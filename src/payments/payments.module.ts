import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';

import config from 'src/config';

import { StoresModule } from '../stores/stores.module';
import { OrdersModule } from 'src/orders/orders.module';

import { Payment } from './entities/payment.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';

import { JwtSignatureService } from './services/jwt-signature.service';
import { PaymentsService } from './services/payments.service';
import { PaypalService } from './providers/paypal/paypal.service';

import { PaymentsV1Controller, PaymentsV2Controller } from './controllers';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, PaymentTransaction]),
    JwtModule.registerAsync({
      inject: [config.KEY],
      useFactory: (configService: ConfigType<typeof config>) => ({
        secret: configService.jwt.paypalSignToken,
      }),
    }),
    HttpModule,
    StoresModule,
    OrdersModule,
  ],
  controllers: [PaymentsV1Controller, PaymentsV2Controller],
  providers: [PaymentsService, PaypalService, JwtSignatureService],
  exports: [PaymentsService, PaypalService],
})
export class PaymentsModule {}
