import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './repositories/product.repository';
import { Product } from './product.entity';
import { Catalog } from '../catalog/catalog.entity';
import { PRODUCT_REPOSITORY } from './interfaces/product.repository.interface';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Catalog]),
    forwardRef(() => CatalogModule),
  ],
  controllers: [ProductController],
  providers: [
    ProductService,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductRepository,
    },
  ],
  exports: [ProductService, PRODUCT_REPOSITORY],
})
export class ProductModule {}
