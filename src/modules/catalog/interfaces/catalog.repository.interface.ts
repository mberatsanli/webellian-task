import { Catalog } from '../catalog.entity';
import { CreateCatalogDto } from '../dto/create-catalog.dto';
import { UpdateCatalogDto } from '../dto/update-catalog.dto';

export const CATALOG_REPOSITORY = 'CATALOG_REPOSITORY';

export interface ICatalogRepository {
  findAll(): Promise<Catalog[]>;

  findById(id: number): Promise<Catalog | null>;

  findByName(name: string): Promise<Catalog | null>;

  create(data: CreateCatalogDto): Promise<Catalog>;

  update(id: number, data: UpdateCatalogDto): Promise<Catalog>;

  delete(id: number): Promise<void>;
}
