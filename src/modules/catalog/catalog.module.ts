import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogController } from './catalog.controller';
import { CatalogProductController } from './catalog-product.controller';
import { CatalogService } from './catalog.service';
import { CatalogRepository } from './repositories/catalog.repository';
import { Catalog } from './catalog.entity';
import { CATALOG_REPOSITORY } from './interfaces/catalog.repository.interface';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Catalog]),
    forwardRef(() => ProductModule),
  ],
  controllers: [CatalogController, CatalogProductController],
  providers: [
    CatalogService,
    {
      provide: CATALOG_REPOSITORY,
      useClass: CatalogRepository,
    },
  ],
  exports: [CatalogService, CATALOG_REPOSITORY],
})
export class CatalogModule {}
