import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as crypto from 'crypto';
import * as otplib from 'otplib';
import * as qrcode from 'qrcode';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MIN = 15;

const PASSWORD_RULES = {
  minLength: 8,
  requireUpper: true,
  requireLower: true,
  requireDigit: true,
  requireSpecial: true,
};

function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_RULES.minLength) {
    return `Password must be at least ${PASSWORD_RULES.minLength} characters`;
  }
  if (PASSWORD_RULES.requireUpper && !/[A-Z]/.test(password)) {
    return 'Password must contain an uppercase letter';
  }
  if (PASSWORD_RULES.requireLower && !/[a-z]/.test(password)) {
    return 'Password must contain a lowercase letter';
  }
  if (PASSWORD_RULES.requireDigit && !/\d/.test(password)) {
    return 'Password must contain a digit';
  }
  if (PASSWORD_RULES.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain a special character';
  }
  return null;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  private userSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    status: true,
    emailVerifiedAt: true,
    totpEnabled: true,
    roleId: true,
    role: { select: { id: true, name: true, permissions: { select: { name: true } } } },
  } as const;

  private async userWithRole(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });
  }

  async register(dto: RegisterDto) {
    const pwError = validatePassword(dto.password);
    if (pwError) throw new BadRequestException(pwError);

    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException('Email already registered');
    }

    const defaultRole = await this.prisma.role.findUnique({ where: { name: 'user' } });
    if (!defaultRole) {
      const created = await this.prisma.role.create({ data: { name: 'user' } });
      return this.completeRegistration(dto, created.id);
    }

    return this.completeRegistration(dto, defaultRole.id);
  }

  private async completeRegistration(dto: RegisterDto, roleId: string) {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
        roleId,
        emailVerificationToken: verificationToken,
      },
      select: this.userSelect,
    });

    const tokens = await this.generateTokens(user.id, user.email);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is not active');
    }

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(`Account locked. Try again in ${remaining} minutes`);
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      const attempts = user.loginAttempts + 1;
      const updateData: any = { loginAttempts: attempts };
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MIN * 60 * 1000);
      }
      await this.prisma.user.update({ where: { id: user.id }, data: updateData });
      throw new UnauthorizedException('Invalid email or password');
    }

    // Reset lockout on success
    if (user.loginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockedUntil: null },
      });
    }

    const full = await this.userWithRole(user.id);
    const tokens = await this.generateTokens(user.id, user.email);

    // If MFA is enabled, issue a partial token
    if (user.totpEnabled) {
      const mfaToken = this.jwt.sign({ sub: user.id, type: 'mfa' }, { expiresIn: '5m' });
      return { mfaRequired: true, mfaToken };
    }

    return { user: full, ...tokens };
  }

  async verifyMfa(mfaToken: string, code: string) {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwt.verify(mfaToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA token');
    }
    if (payload.type !== 'mfa') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.totpSecret) {
      throw new UnauthorizedException('MFA not configured');
    }

    const valid = otplib.verify({ token: code, secret: user.totpSecret });
    if (!valid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    const full = await this.userWithRole(user.id);
    const tokens = await this.generateTokens(user.id, user.email);
    return { user: full, ...tokens };
  }

  // --- Email verification ---

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });
    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date(), emailVerificationToken: null },
    });
    return { message: 'Email verified successfully' };
  }

  async resendVerification(userId: string) {
    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerificationToken: token },
    });
    return { message: 'Verification email sent' };
  }

  // --- MFA / TOTP ---

  async enableMfa(userId: string) {
    const secret = otplib.generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: secret },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const otpauth = otplib.generateURI({ issuer: 'UniSupport', label: user!.email, secret });
    const qrCode = await qrcode.toDataURL(otpauth);
    return { secret, qrCode, message: 'Scan the QR code with your authenticator app' };
  }

  async verifyMfaSetup(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpSecret) {
      throw new BadRequestException('MFA not initialized. Call enable first.');
    }
    const valid = otplib.verify({ token: code, secret: user.totpSecret });
    if (!valid) {
      throw new BadRequestException('Invalid code. Try again.');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true },
    });
    return { message: 'MFA enabled successfully' };
  }

  async disableMfa(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: null, totpEnabled: false },
    });
    return { message: 'MFA disabled' };
  }

  // --- Existing methods ---

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string; type: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const session = await this.prisma.session.findFirst({
      where: {
        userId: payload.sub,
        refreshTokenHash: this.hashToken(refreshToken),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!session) {
      throw new UnauthorizedException('Session not found or revoked');
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.userWithRole(payload.sub);
    if (!user || user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is not active');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    return { user, ...tokens };
  }

  async logout(userId: string, refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    const session = await this.prisma.session.findFirst({
      where: { userId, refreshTokenHash: hash, revokedAt: null },
    });
    if (!session) return;
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
  }

  private meSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    avatarUrl: true,
    status: true,
    emailVerifiedAt: true,
    totpEnabled: true,
    role: { select: { id: true, name: true, permissions: { select: { name: true } } } },
    department: { select: { id: true, name: true } },
    createdAt: true,
  } as const;

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.meSelect,
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, dto: { firstName?: string; lastName?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: this.meSelect,
    });
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const resetLink = `${this.config.getOrThrow<string>('WEB_ORIGIN')}/reset-password?token=${token}`;

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const pwError = validatePassword(newPassword);
    if (pwError) throw new BadRequestException(pwError);

    const resetToken = await this.prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Password reset successful' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const pwError = validatePassword(newPassword);
    if (pwError) throw new BadRequestException(pwError);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password changed successfully' };
  }

  private async generateTokens(userId: string, email: string) {
    const accessToken = this.jwt.sign({ sub: userId, email }, { expiresIn: ACCESS_TOKEN_EXPIRY });

    const refreshToken = this.jwt.sign(
      { sub: userId, email, type: 'refresh' },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
      },
    );

    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.prisma.session.create({
      data: { userId, refreshTokenHash, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async handleSamlLogin(profile: { nameID: string; email: string; firstName: string; lastName: string }) {
    let user = await this.prisma.user.findUnique({ where: { samlId: profile.nameID } });
    if (!user) {
      user = await this.prisma.user.findUnique({ where: { email: profile.email } });
      if (user) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { samlId: profile.nameID },
        });
      }
    }
    if (!user) {
      const defaultRole = await this.prisma.role.findUnique({ where: { name: 'user' } });
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          firstName: profile.firstName || profile.email.split('@')[0],
          lastName: profile.lastName || '',
          passwordHash: crypto.randomBytes(32).toString('hex'),
          samlId: profile.nameID,
          roleId: defaultRole?.id ?? undefined,
          emailVerifiedAt: new Date(),
        },
      });
    }
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is not active');
    }
    const tokens = await this.generateTokens(user.id, user.email);
    return { user, ...tokens };
  }

  signSamlToken(userId: string): string {
    return this.jwt.sign({ sub: userId, type: 'saml_exchange' }, { expiresIn: '1m' });
  }

  async exchangeSamlToken(samlToken: string) {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwt.verify(samlToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired SAML token');
    }
    if (payload.type !== 'saml_exchange') {
      throw new UnauthorizedException('Invalid token type');
    }
    const user = await this.userWithRole(payload.sub);
    if (!user || user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is not active');
    }
    const tokens = await this.generateTokens(user.id, user.email);
    return { user, ...tokens };
  }

  async exportUserData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tickets: { include: { comments: true, attachments: true } },
        assigned: true,
        comments: true,
        sessions: true,
        notifications: true,
        timeEntries: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    const { passwordHash, totpSecret, emailVerificationToken, ...safe } = user;
    return safe;
  }

  async anonymizeUser(userId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.session.deleteMany({ where: { userId } });
      await tx.user.update({
        where: { id: userId },
        data: {
          firstName: 'Anonymous',
          lastName: 'User',
          email: `anon-${userId.slice(0, 8)}@deleted.local`,
          passwordHash: crypto.randomBytes(32).toString('hex'),
          avatarUrl: null,
          emailVerifiedAt: null,
          emailVerificationToken: null,
          totpSecret: null,
          totpEnabled: false,
          status: 'INACTIVE' as any,
        },
      });
    });
    return { message: 'Account anonymized' };
  }
}
