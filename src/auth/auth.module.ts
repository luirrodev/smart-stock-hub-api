import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { AccessControlModule } from 'src/access-control/access-control.module';
import { CustomersModule } from 'src/customers/customers.module';
import { AuthService } from './services/auth.service';
import { LocalStrategyService } from './strategies/local-strategy.service';
import { JwtStrategyService } from './strategies/jwt-strategy.service';
import { GoogleStrategyService } from './strategies/google-strategy.service';
import { AuthController } from './controllers/auth.controller';
import config from 'src/config';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { StoresModule } from 'src/stores/stores.module';

@Module({
  imports: [
    AccessControlModule,
    CustomersModule,
    StoresModule,
    TypeOrmModule.forFeature([PasswordResetToken]),
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
  ],
  providers: [
    AuthService,
    LocalStrategyService,
    JwtStrategyService,
    GoogleStrategyService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
