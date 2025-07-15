import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ description: 'Unique identifier for the product', example: 1 })
  id: number;

  @ApiProperty({ description: 'Name of the product', example: 'iPhone 16' })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the product',
    example: 'Latest iPhone model',
  })
  description: string;

  @ApiProperty({ description: 'Price of the product', example: 999.99 })
  price: number;

  @ApiProperty({ description: 'Stock quantity', example: 50 })
  stockQuantity: number;

  @ApiPropertyOptional({
    description: 'ID of the catalog this product belongs to',
    example: 1,
  })
  catalogId: number;

  @ApiProperty({ description: 'When the product was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the product was last updated' })
  updatedAt: Date;
}
