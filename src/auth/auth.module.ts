import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import config from 'src/config';

import { CustomersModule } from 'src/customers/customers.module';
import { StoresModule } from 'src/stores/stores.module';

import { PasswordResetToken } from './entities/password-reset-token.entity';

import { AuthService } from './services/auth.service';
import { LocalStrategyService } from './strategies/local-strategy.service';
import { JwtStrategyService } from './strategies/jwt-strategy.service';
import { GoogleStrategyService } from './strategies/google-strategy.service';

import { AuthV1Controller } from './controllers';

@Module({
  imports: [
    TypeOrmModule.forFeature([PasswordResetToken]),
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
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 3,
        },
      ],
      errorMessage:
        'Ha excedido el límite de intentos. Por favor, inténtalo de nuevo más tarde.',
    } as any),
    CustomersModule,
    StoresModule,
    PassportModule,
  ],
  providers: [
    AuthService,
    LocalStrategyService,
    JwtStrategyService,
    GoogleStrategyService,
  ],
  controllers: [AuthV1Controller],
})
export class AuthModule {}
