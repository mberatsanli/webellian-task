import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCatalogDto {
  @ApiProperty({ description: 'Name of the catalog', example: 'Electronics' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the catalog',
    example: 'All electronic products',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
