import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { Product } from './product.entity';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { Role } from '@/modules/auth/enums/roles.enum';

@ApiTags('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'products', version: '1' })
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles([Role.ADMIN])
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Catalog not found (if catalogId is provided)',
  })
  @ApiResponse({
    status: 409,
    description: 'Product with this name already exists',
  })
  create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productService.create(createProductDto);
  }

  @Get()
  @Roles([Role.ADMIN, Role.USER])
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({
    status: 200,
    description: 'List of all products',
    type: [ProductResponseDto],
  })
  findAll(): Promise<Product[]> {
    return this.productService.findAll();
  }

  @Get('unassigned')
  @Roles([Role.ADMIN])
  @ApiOperation({ summary: 'Get products not assigned to any catalog' })
  @ApiResponse({
    status: 200,
    description: 'List of products not assigned to any catalog',
    type: [ProductResponseDto],
  })
  findUnassignedProducts(): Promise<Product[]> {
    return this.productService.findUnassignedProducts();
  }

  @Get(':id')
  @Roles([Role.ADMIN, Role.USER])
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Product found',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @Roles([Role.ADMIN])
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product or catalog not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Roles([Role.ADMIN])
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'Product ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.productService.remove(id);
  }
}
