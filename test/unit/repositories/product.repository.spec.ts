import { IProductRepository } from '@/modules/product/interfaces/product.repository.interface';
import { Product } from '@/modules/product/product.entity';
import { Catalog } from '@/modules/catalog/catalog.entity';

describe('ProductRepository', () => {
  let repository: IProductRepository;

  const mockCatalog: Catalog = {
    id: 1,
    name: 'Test Catalog',
    description: 'Test Description',
    products: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct: Product = {
    id: 1,
    name: 'Test Product',
    description: 'Test Product Description',
    price: 100,
    stockQuantity: 10,
    catalogId: 1,
    catalog: mockCatalog,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    repository = {
      findAll: jest.fn().mockResolvedValue([mockProduct]),
      findById: jest.fn().mockResolvedValue(mockProduct),
      findByName: jest.fn().mockResolvedValue(mockProduct),
      findUnassignedProducts: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue(mockProduct),
      update: jest.fn().mockResolvedValue(mockProduct),
      delete: jest.fn().mockResolvedValue(undefined),
      assignToCatalog: jest.fn().mockResolvedValue(mockProduct),
      removeFromCatalog: jest
        .fn()
        .mockResolvedValue({ ...mockProduct, catalogId: null, catalog: null }),
    };
  });

  it('should find all products', async () => {
    const result = await repository.findAll();
    expect(result).toEqual([mockProduct]);
  });

  it('should find product by id', async () => {
    const result = await repository.findById(1);
    expect(result).toEqual(mockProduct);
  });

  it('should find product by name', async () => {
    const result = await repository.findByName('Test Product');
    expect(result).toEqual(mockProduct);
  });

  it('should find unassigned products', async () => {
    const result = await repository.findUnassignedProducts();
    expect(result).toEqual([]);
  });

  it('should create a product', async () => {
    const result = await repository.create({
      name: 'Test Product',
      description: 'Test Product Description',
      price: 100,
      stockQuantity: 10,
    });
    expect(result).toEqual(mockProduct);
  });

  it('should update a product', async () => {
    const result = await repository.update(1, { name: 'Updated', price: 200 });
    expect(result).toEqual(mockProduct);
  });

  it('should delete a product', async () => {
    const result = await repository.delete(1);
    expect(result).toBeUndefined();
  });

  it('should assign product to catalog', async () => {
    const result = await repository.assignToCatalog(1, 1);
    expect(result).toEqual(mockProduct);
  });

  it('should remove product from catalog', async () => {
    const result = await repository.removeFromCatalog(1);
    expect(result).toEqual({ ...mockProduct, catalogId: null, catalog: null });
  });
});
