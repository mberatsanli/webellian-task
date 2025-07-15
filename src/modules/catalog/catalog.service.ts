import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Catalog } from './catalog.entity';
import { CreateCatalogDto } from './dto/create-catalog.dto';
import { UpdateCatalogDto } from './dto/update-catalog.dto';
import {
  ICatalogRepository,
  CATALOG_REPOSITORY,
} from './interfaces/catalog.repository.interface';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../product/interfaces/product.repository.interface';
import { Product } from '../product/product.entity';

@Injectable()
export class CatalogService {
  constructor(
    @Inject(CATALOG_REPOSITORY)
    private readonly catalogRepository: ICatalogRepository,
    @Inject(forwardRef(() => PRODUCT_REPOSITORY))
    private readonly productRepository: IProductRepository,
  ) {}

  async findAll(): Promise<Catalog[]> {
    return this.catalogRepository.findAll();
  }

  async findOne(id: number): Promise<Catalog> {
    const catalog = await this.catalogRepository.findById(id);

    if (!catalog) {
      throw new NotFoundException(`Catalog with ID ${id} not found`);
    }

    return catalog;
  }

  async findProducts(catalogId: number): Promise<Product[]> {
    try {
      await this.findOne(catalogId);

      const allProducts = await this.productRepository.findAll();
      return allProducts.filter((product) => product.catalogId === catalogId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to get products for catalog: ${error.message}`);
    }
  }

  async create(createCatalogDto: CreateCatalogDto): Promise<Catalog> {
    try {
      await this.validateNameUniqueness(createCatalogDto.name);

      return await this.catalogRepository.create(createCatalogDto);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to create catalog: ${error.message}`);
    }
  }

  async update(
    id: number,
    updateCatalogDto: UpdateCatalogDto,
  ): Promise<Catalog> {
    try {
      await this.findOne(id);

      if (updateCatalogDto.name) {
        await this.validateNameUniqueness(updateCatalogDto.name, id);
      }

      return await this.catalogRepository.update(id, updateCatalogDto);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new Error(`Failed to update catalog: ${error.message}`);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.catalogRepository.delete(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete catalog: ${error.message}`);
    }
  }

  async assignProductToCatalog(
    catalogId: number,
    productId: number,
  ): Promise<Product> {
    try {
      await this.findOne(catalogId);

      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      return await this.productRepository.assignToCatalog(productId, catalogId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to assign product to catalog: ${error.message}`);
    }
  }

  async removeProductFromCatalog(
    catalogId: number,
    productId: number,
  ): Promise<Product> {
    try {
      await this.findOne(catalogId);

      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      if (product.catalogId !== catalogId) {
        throw new NotFoundException(
          `Product with ID ${productId} does not belong to catalog ${catalogId}`,
        );
      }

      return await this.productRepository.removeFromCatalog(productId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(
        `Failed to remove product from catalog: ${error.message}`,
      );
    }
  }

  private async validateNameUniqueness(
    name: string,
    excludeId?: number,
  ): Promise<void> {
    const existingCatalog = await this.catalogRepository.findByName(name);
    if (existingCatalog && existingCatalog.id !== excludeId) {
      throw new ConflictException(`Catalog with name "${name}" already exists`);
    }
  }
}
