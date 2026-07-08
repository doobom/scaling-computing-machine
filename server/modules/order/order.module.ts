import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { AdminOrderController } from './admin-order.controller';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [ProductModule],
  controllers: [CartController, AddressController, OrderController, AdminOrderController],
  providers: [CartService, AddressService, OrderService],
})
export class OrderModule {}
