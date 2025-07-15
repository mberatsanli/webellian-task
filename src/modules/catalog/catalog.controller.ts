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
import { CatalogService } from './catalog.service';
import { CreateCatalogDto } from './dto/create-catalog.dto';
import { UpdateCatalogDto } from './dto/update-catalog.dto';
import { CatalogResponseDto } from './dto/catalog-response.dto';
import { Catalog } from './catalog.entity';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { Role } from '@/modules/auth/enums/roles.enum';

@ApiTags('catalogs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'catalogs', version: '1' })
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post()
  @Roles([Role.ADMIN])
  @ApiOperation({ summary: 'Create a new catalog' })
  @ApiResponse({
    status: 201,
    description: 'Catalog created successfully',
    type: CatalogResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Catalog with this name already exists',
  })
  create(@Body() createCatalogDto: CreateCatalogDto): Promise<Catalog> {
    return this.catalogService.create(createCatalogDto);
  }

  @Get()
  @Roles([Role.ADMIN, Role.USER])
  @ApiOperation({ summary: 'Get all catalogs' })
  @ApiResponse({
    status: 200,
    description: 'List of all catalogs',
    type: [CatalogResponseDto],
  })
  findAll(): Promise<Catalog[]> {
    return this.catalogService.findAll();
  }

  @Get(':id')
  @Roles([Role.ADMIN, Role.USER])
  @ApiOperation({ summary: 'Get a catalog by ID' })
  @ApiParam({ name: 'id', description: 'Catalog ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Catalog found',
    type: CatalogResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Catalog not found' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Catalog> {
    return this.catalogService.findOne(id);
  }

  @Patch(':id')
  @Roles([Role.ADMIN])
  @ApiOperation({ summary: 'Update a catalog' })
  @ApiParam({ name: 'id', description: 'Catalog ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Catalog updated successfully',
    type: CatalogResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Catalog not found' })
  @ApiResponse({
    status: 409,
    description: 'Catalog with this name already exists',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCatalogDto: UpdateCatalogDto,
  ): Promise<Catalog> {
    return this.catalogService.update(id, updateCatalogDto);
  }

  @Delete(':id')
  @Roles([Role.ADMIN])
  @ApiOperation({ summary: 'Delete a catalog' })
  @ApiParam({ name: 'id', description: 'Catalog ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Catalog deleted successfully' })
  @ApiResponse({ status: 404, description: 'Catalog not found' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.catalogService.remove(id);
  }
}
