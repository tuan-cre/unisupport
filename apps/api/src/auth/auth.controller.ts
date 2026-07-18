import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { TokenOnlyDto } from './dto/token-only.dto';
import { VerifyMfaSetupDto } from './dto/verify-mfa-setup.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Request, Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private config: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Register a new user' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.auth.register(dto);
    return { success: true, message: 'Registration successful', data: result };
  }

  @ApiOperation({ summary: 'Login with email and password' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.auth.login(dto);
    return { success: true, message: 'Login successful', data: result };
  }

  @ApiOperation({ summary: 'Complete MFA login with 2FA code' })
  @HttpCode(HttpStatus.OK)
  @Post('mfa')
  async verifyMfa(@Body() dto: VerifyMfaDto) {
    const result = await this.auth.verifyMfa(dto.mfaToken, dto.code);
    return { success: true, message: 'MFA verified', data: result };
  }

  @ApiOperation({ summary: 'Verify email with token' })
  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  async verifyEmail(@Body() dto: TokenOnlyDto) {
    const result = await this.auth.verifyEmail(dto.token);
    return { success: true, ...result };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend email verification' })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('resend-verification')
  async resendVerification(@Req() req: Request) {
    const result = await this.auth.resendVerification(req.user!.id);
    return { success: true, ...result };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable MFA (returns QR code)' })
  @UseGuards(JwtAuthGuard)
  @Post('mfa/enable')
  async enableMfa(@Req() req: Request) {
    const result = await this.auth.enableMfa(req.user!.id);
    return { success: true, data: result };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify MFA setup with code' })
  @UseGuards(JwtAuthGuard)
  @Post('mfa/verify-setup')
  async verifyMfaSetup(@Req() req: Request, @Body() dto: VerifyMfaSetupDto) {
    const result = await this.auth.verifyMfaSetup(req.user!.id, dto.code);
    return { success: true, ...result };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable MFA' })
  @UseGuards(JwtAuthGuard)
  @Post('mfa/disable')
  async disableMfa(@Req() req: Request) {
    const result = await this.auth.disableMfa(req.user!.id);
    return { success: true, ...result };
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    const result = await this.auth.refresh(dto.refreshToken);
    return { success: true, message: 'Token refreshed', data: result };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: Request, @Body() dto: RefreshTokenDto) {
    await this.auth.logout(req.user!.id, dto.refreshToken);
    return { success: true, message: 'Logged out' };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    const user = await this.auth.me(req.user!.id);
    return { success: true, message: 'Current user', data: user };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile (firstName, lastName)' })
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const user = await this.auth.updateProfile(req.user!.id, dto);
    return { success: true, message: 'Profile updated', data: user };
  }

  @ApiOperation({ summary: 'Request password reset email' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.auth.forgotPassword(dto.email);
    return { success: true, ...result };
  }

  @ApiOperation({ summary: 'Reset password with token' })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.auth.resetPassword(dto.token, dto.password);
    return { success: true, ...result };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password (requires current password)' })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    const result = await this.auth.changePassword(
      req.user!.id,
      dto.currentPassword,
      dto.newPassword,
    );
    return { success: true, ...result };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export all personal data (GDPR)' })
  @UseGuards(JwtAuthGuard)
  @Get('me/export')
  async exportData(@Req() req: Request) {
    const data = await this.auth.exportUserData(req.user!.id);
    return { success: true, data };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Anonymize/delete personal data (right to be forgotten)' })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('me/anonymize')
  async anonymize(@Req() req: Request) {
    await this.auth.anonymizeUser(req.user!.id);
    return { success: true, message: 'Account anonymized' };
  }

  // --- Google OAuth ---

  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @Get('google/login')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    // Passport handles the redirect to Google
  }

  @ApiOperation({ summary: 'Google OAuth callback' })
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as unknown as {
      googleId: string;
      email: string;
      firstName: string;
      lastName: string;
    };
    const { user } = await this.auth.handleGoogleLogin(profile);
    const token = this.auth.signExchangeToken(user.id);
    const webOrigin = this.config.getOrThrow<string>('WEB_ORIGIN');
    res.redirect(`${webOrigin}/auth/google/callback?token=${token}`);
  }

  @ApiOperation({ summary: 'Exchange Google OAuth token for JWT tokens' })
  @HttpCode(HttpStatus.OK)
  @Post('google/exchange')
  async exchangeGoogleToken(@Body() dto: TokenOnlyDto) {
    const result = await this.auth.exchangeGoogleToken(dto.token);
    return { success: true, message: 'Google login successful', data: result };
  }
}
