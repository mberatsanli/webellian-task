import { Product } from '../product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';

export const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';

export interface IProductRepository {
  findAll(): Promise<Product[]>;

  findById(id: number): Promise<Product | null>;

  findByName(name: string): Promise<Product | null>;

  findUnassignedProducts(): Promise<Product[]>;

  create(data: CreateProductDto): Promise<Product>;

  update(id: number, data: UpdateProductDto): Promise<Product>;

  delete(id: number): Promise<void>;

  assignToCatalog(productId: number, catalogId: number): Promise<Product>;

  removeFromCatalog(productId: number): Promise<Product>;
}
