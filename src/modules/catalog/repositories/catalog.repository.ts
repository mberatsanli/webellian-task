import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Catalog } from '../catalog.entity';
import { CreateCatalogDto } from '../dto/create-catalog.dto';
import { UpdateCatalogDto } from '../dto/update-catalog.dto';
import { ICatalogRepository } from '../interfaces/catalog.repository.interface';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class CatalogRepository implements ICatalogRepository {
  constructor(
    @InjectRepository(Catalog)
    private readonly repository: Repository<Catalog>,
  ) {}

  async findAll(): Promise<Catalog[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<Catalog | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Catalog | null> {
    return this.repository.findOne({
      where: { name },
    });
  }

  async create(data: CreateCatalogDto): Promise<Catalog> {
    const catalog = this.repository.create(data);
    return await this.repository.save(catalog);
  }

  async update(id: number, data: UpdateCatalogDto): Promise<Catalog> {
    const result = await this.repository.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Catalog with ID ${id} not found`);
    }

    const updatedCatalog = await this.findById(id);
    if (!updatedCatalog) {
      throw new Error(`Catalog with ID ${id} not found after update`);
    }
    return updatedCatalog;
  }

  async delete(id: number): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Catalog with ID ${id} not found`);
    }
  }
}
