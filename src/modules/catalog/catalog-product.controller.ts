import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { ProductResponseDto } from '../product/dto/product-response.dto';
import { Product } from '../product/product.entity';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { Role } from '@/modules/auth/enums/roles.enum';

@ApiTags('catalog-products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('catalogs/:catalogId/products')
export class CatalogProductController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @Roles([Role.ADMIN, Role.USER])
  @ApiOperation({ summary: 'Get all products in a specific catalog' })
  @ApiParam({ name: 'catalogId', description: 'Catalog ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'List of products in the catalog',
    type: [ProductResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Catalog not found' })
  findProducts(
    @Param('catalogId', ParseIntPipe) catalogId: number,
  ): Promise<Product[]> {
    return this.catalogService.findProducts(catalogId);
  }

  @Post(':productId')
  @Roles([Role.ADMIN])
  @ApiOperation({ summary: 'Assign a product to a catalog' })
  @ApiParam({ name: 'catalogId', description: 'Catalog ID', type: 'number' })
  @ApiParam({ name: 'productId', description: 'Product ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Product assigned to catalog successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Catalog or product not found' })
  assignProductToCatalog(
    @Param('catalogId', ParseIntPipe) catalogId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<Product> {
    return this.catalogService.assignProductToCatalog(catalogId, productId);
  }

  @Delete(':productId')
  @Roles([Role.ADMIN])
  @ApiOperation({ summary: 'Remove a product from a catalog' })
  @ApiParam({ name: 'catalogId', description: 'Catalog ID', type: 'number' })
  @ApiParam({ name: 'productId', description: 'Product ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Product removed from catalog successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Catalog or product not found' })
  removeProductFromCatalog(
    @Param('catalogId', ParseIntPipe) catalogId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<Product> {
    return this.catalogService.removeProductFromCatalog(catalogId, productId);
  }
}
