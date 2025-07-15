import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'Name of the product', example: 'iPhone 16' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the product',
    example: 'Latest iPhone model',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Price of the product', example: 999.99 })
  @IsNumber()
  @IsPositive()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Stock quantity', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({
    description: 'ID of the catalog to assign the product to',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  catalogId?: number;
}
