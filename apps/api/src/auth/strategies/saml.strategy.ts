import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Strategy } from '@node-saml/passport-saml';
import passport from 'passport';

@Injectable()
export class SamlStrategy {
  private readonly logger = new Logger(SamlStrategy.name);

  constructor(config: ConfigService) {
    const entryPoint = config.get<string>('SAML_ENTRY_POINT');
    const issuer = config.get<string>('SAML_ISSUER');
    const cert = config.get<string>('SAML_CERT');
    const callbackUrl = config.get<string>('SAML_CALLBACK_URL');

    if (!entryPoint || !issuer || !cert || !callbackUrl) {
      this.logger.warn('SAML SSO not configured — set SAML_ENTRY_POINT, SAML_ISSUER, SAML_CERT, SAML_CALLBACK_URL');
      return;
    }

    const strategy = new Strategy(
      {
        entryPoint,
        issuer,
        idpCert: cert,
        callbackUrl,
        wantAssertionsSigned: true,
        acceptedClockSkewMs: 300000,
      } as any,
      ((profile: any, done: any) => {
        if (!profile) {
          done(new Error('No SAML profile returned'));
          return;
        }
        const email =
          profile.email ??
          profile.mail ??
          profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ??
          profile.nameID;
        const firstName =
          profile.firstName ??
          profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] ??
          '';
        const lastName =
          profile.lastName ??
          profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] ??
          '';

        done(null, { nameID: profile.nameID, email, firstName, lastName });
      }) as any,
      ((_profile: any, done: any) => {
        done(null);
      }) as any,
    );

    passport.use('saml', strategy as unknown as passport.Strategy);
  }
}
