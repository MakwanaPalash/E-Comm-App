import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { ShareableLink } from './entities/shareable-link.entity';
import { CategoriesModule } from '../categories/categories.module';
import { SubcategoriesModule } from '../subcategories/subcategories.module';
import { ImageService } from '../shared/services/image.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ShareableLink]),
    CategoriesModule,
    SubcategoriesModule,
    AuthModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ImageService],
  exports: [ProductsService],
})
export class ProductsModule {}
