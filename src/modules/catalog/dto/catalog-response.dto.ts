import { ApiProperty } from '@nestjs/swagger';

export class CatalogResponseDto {
  @ApiProperty({ description: 'Unique identifier for the catalog', example: 1 })
  id: number;

  @ApiProperty({ description: 'Name of the catalog', example: 'Electronics' })
  name: string;

  @ApiProperty({
    description: 'Description of the catalog',
    example: 'All electronic products',
    required: false,
  })
  description: string;

  @ApiProperty({ description: 'When the catalog was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the catalog was last updated' })
  updatedAt: Date;
}
