import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigType } from '@nestjs/config';

import config from 'src/config';

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatar: string | null;
  state?: string;
}

@Injectable()
export class GoogleStrategyService extends PassportStrategy(
  Strategy,
  'google',
) {
  constructor(
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
  ) {
    super({
      clientID: configService.google.clientId,
      clientSecret: configService.google.clientSecret,
      callbackURL: configService.google.callbackUrl,
      scope: ['email', 'profile'],
      passReqToCallback: true, // Enable request in validate method
    });
  }

  async validate(
    request: any,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, emails, displayName, photos } = profile;

    // Extract state from query parameters
    const state = request.query?.state;

    const user: GoogleUser = {
      googleId: id,
      email: emails?.[0]?.value || '',
      name: displayName || '',
      avatar: photos?.[0]?.value || null,
      state, // Pass state to controller
    };

    done(null, user);
  }
}
