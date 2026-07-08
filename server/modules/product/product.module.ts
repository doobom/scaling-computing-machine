import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { ProductService } from './product.service';
import { CategoryController } from './category.controller';
import { ProductController } from './product.controller';
import { AdminCategoryController } from './admin-category.controller';
import { AdminProductController } from './admin-product.controller';

@Module({
  controllers: [
    CategoryController,
    ProductController,
    AdminCategoryController,
    AdminProductController,
  ],
  providers: [CategoryService, ProductService],
  exports: [CategoryService, ProductService],
})
export class ProductModule {}
