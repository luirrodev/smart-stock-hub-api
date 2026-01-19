import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';

import { AccessControlModule } from 'src/access-control/access-control.module';
import { AuthService } from './services/auth.service';
import { LocalStrategyService } from './strategies/local-strategy.service';
import { JwtStrategyService } from './strategies/jwt-strategy.service';
import { AuthController } from './controllers/auth.controller';
import config from 'src/config';

@Module({
  imports: [
    AccessControlModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [config.KEY],
      useFactory: (configService: ConfigType<typeof config>) => {
        return {
          secret: configService.jwt.accessTokenSecret,
          signOptions: {
            expiresIn: configService.jwt.accessTokenExpiresIn,
          },
        };
      },
    }),
  ],
  providers: [AuthService, LocalStrategyService, JwtStrategyService],
  controllers: [AuthController],
})
export class AuthModule {}
