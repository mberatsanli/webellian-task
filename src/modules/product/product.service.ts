import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  ConflictException,
} from '@nestjs/common';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from './interfaces/product.repository.interface';
import {
  ICatalogRepository,
  CATALOG_REPOSITORY,
} from '../catalog/interfaces/catalog.repository.interface';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(forwardRef(() => CATALOG_REPOSITORY))
    private readonly catalogRepository: ICatalogRepository,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productRepository.findAll();
  }

  async findUnassignedProducts(): Promise<Product[]> {
    return this.productRepository.findUnassignedProducts();
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      await this.validateNameUniqueness(createProductDto.name);

      if (createProductDto.catalogId) {
        const catalog = await this.catalogRepository.findById(
          createProductDto.catalogId,
        );
        if (!catalog) {
          throw new NotFoundException(
            `Catalog with ID ${createProductDto.catalogId} not found`,
          );
        }
      }

      return await this.productRepository.create(createProductDto);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    try {
      if (updateProductDto.name) {
        await this.validateNameUniqueness(updateProductDto.name, id);
      }

      if (updateProductDto.catalogId) {
        const catalog = await this.catalogRepository.findById(
          updateProductDto.catalogId,
        );
        if (!catalog) {
          throw new NotFoundException(
            `Catalog with ID ${updateProductDto.catalogId} not found`,
          );
        }
      }

      return await this.productRepository.update(id, updateProductDto);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.productRepository.delete(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }

  async assignToCatalog(
    productId: number,
    catalogId: number,
  ): Promise<Product> {
    try {
      const catalog = await this.catalogRepository.findById(catalogId);
      if (!catalog) {
        throw new NotFoundException(`Catalog with ID ${catalogId} not found`);
      }

      return await this.productRepository.assignToCatalog(productId, catalogId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to assign product to catalog: ${error.message}`);
    }
  }

  async removeFromCatalog(productId: number): Promise<Product> {
    try {
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
    const existingProduct = await this.productRepository.findByName(name);
    if (existingProduct && existingProduct.id !== excludeId) {
      throw new ConflictException(`Product with name "${name}" already exists`);
    }
  }
}
