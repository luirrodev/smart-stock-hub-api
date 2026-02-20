import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import config from 'src/config';

import { Payment } from './entities/payment.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { StoresModule } from '../stores/stores.module';
import { JwtSignatureService } from './services/jwt-signature.service';
import { PaymentsService } from './services/payments.service';
import { PaymentsController } from './controllers/payments-v1.controller';
import { PaymentsV2Controller } from './controllers/payments-v2.controller';
import { PaypalService } from './providers/paypal/paypal.service';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Payment, PaymentTransaction]),
    StoresModule,
    OrdersModule,
    JwtModule.registerAsync({
      inject: [config.KEY],
      useFactory: (configService: ConfigType<typeof config>) => ({
        secret: configService.jwt.paypalSignToken,
      }),
    }),
  ],
  controllers: [PaymentsController, PaymentsV2Controller],
  providers: [PaymentsService, PaypalService, JwtSignatureService],
  exports: [PaymentsService, PaypalService],
})
export class PaymentsModule {}
