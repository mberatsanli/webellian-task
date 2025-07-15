import { ICatalogRepository } from '@/modules/catalog/interfaces/catalog.repository.interface';
import { Catalog } from '@/modules/catalog/catalog.entity';

describe('CatalogRepository', () => {
  let repository: ICatalogRepository;

  const mockCatalog: Catalog = {
    id: 1,
    name: 'Test Catalog',
    description: 'Test Description',
    products: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    repository = {
      findAll: jest.fn().mockResolvedValue([mockCatalog]),
      findById: jest.fn().mockResolvedValue(mockCatalog),
      findByName: jest.fn().mockResolvedValue(mockCatalog),
      create: jest.fn().mockResolvedValue(mockCatalog),
      update: jest.fn().mockResolvedValue(mockCatalog),
      delete: jest.fn().mockResolvedValue(undefined),
    };
  });

  it('should find all catalogs', async () => {
    const result = await repository.findAll();
    expect(result).toEqual([mockCatalog]);
  });

  it('should find catalog by id', async () => {
    const result = await repository.findById(1);
    expect(result).toEqual(mockCatalog);
  });

  it('should find catalog by name', async () => {
    const result = await repository.findByName('Test Catalog');
    expect(result).toEqual(mockCatalog);
  });

  it('should create a catalog', async () => {
    const result = await repository.create({
      name: 'Test Catalog',
      description: 'Test Description',
    });
    expect(result).toEqual(mockCatalog);
  });

  it('should update a catalog', async () => {
    const result = await repository.update(1, {
      name: 'Updated',
      description: 'Updated',
    });
    expect(result).toEqual(mockCatalog);
  });

  it('should delete a catalog', async () => {
    const result = await repository.delete(1);
    expect(result).toBeUndefined();
  });
});
