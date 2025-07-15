import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { IProductRepository } from '../interfaces/product.repository.interface';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.repository.find({
      relations: ['catalog'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<Product | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['catalog'],
    });
  }

  async findByName(name: string): Promise<Product | null> {
    return this.repository.findOne({
      where: { name },
    });
  }

  async findUnassignedProducts(): Promise<Product[]> {
    return this.repository.find({
      where: { catalogId: null },
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: CreateProductDto): Promise<Product> {
    const product = this.repository.create(data);
    return await this.repository.save(product);
  }

  async update(id: number, data: UpdateProductDto): Promise<Product> {
    const result = await this.repository.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const updatedProduct = await this.findById(id);
    if (!updatedProduct) {
      throw new Error(`Product with ID ${id} not found after update`);
    }
    return updatedProduct;
  }

  async delete(id: number): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  async assignToCatalog(
    productId: number,
    catalogId: number,
  ): Promise<Product> {
    const result = await this.repository.update(productId, { catalogId });
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const updatedProduct = await this.findById(productId);
    if (!updatedProduct) {
      throw new Error(
        `Product with ID ${productId} not found after assignment`,
      );
    }
    return updatedProduct;
  }

  async removeFromCatalog(productId: number): Promise<Product> {
    const result = await this.repository.update(productId, { catalogId: null });
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const updatedProduct = await this.findById(productId);
    if (!updatedProduct) {
      throw new Error(`Product with ID ${productId} not found after removal`);
    }
    return updatedProduct;
  }
}
