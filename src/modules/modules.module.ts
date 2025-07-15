import { Module } from '@nestjs/common';
import { CatalogModule } from './catalog/catalog.module';
import { ProductModule } from './product/product.module';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [AuthModule, CatalogModule, ProductModule],
})
export class Modules {}
