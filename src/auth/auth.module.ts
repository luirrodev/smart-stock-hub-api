import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';

import { UsersModule } from 'src/users/users.module';
import { AuthService } from './services/auth.service';
import { LocalStrategyService } from './strategies/local-strategy.service';
import { JwtStrategyService } from './strategies/jwt-strategy.service';
import { AuthController } from './controllers/auth.controller';
import config from 'src/config';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [config.KEY],
      useFactory: (configService: ConfigType<typeof config>) => {
        return {
          secret: configService.jwtSecret,
          signOptions: {
            expiresIn: '3d',
          },
        };
      },
    }),
  ],
  providers: [AuthService, LocalStrategyService, JwtStrategyService],
  controllers: [AuthController],
})
export class AuthModule {}
