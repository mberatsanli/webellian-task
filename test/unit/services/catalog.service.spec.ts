import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CatalogService } from '@/modules/catalog/catalog.service';
import { Catalog } from '@/modules/catalog/catalog.entity';
import { Product } from '@/modules/product/product.entity';
import { CreateCatalogDto } from '@/modules/catalog/dto/create-catalog.dto';
import { UpdateCatalogDto } from '@/modules/catalog/dto/update-catalog.dto';
import {
  ICatalogRepository,
  CATALOG_REPOSITORY,
} from '@/modules/catalog/interfaces/catalog.repository.interface';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '@/modules/product/interfaces/product.repository.interface';

describe('CatalogService', () => {
  let service: CatalogService;
  let catalogRepository: jest.Mocked<ICatalogRepository>;
  let productRepository: jest.Mocked<IProductRepository>;

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
    catalog: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockCatalogRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockProductRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findUnassignedProducts: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      assignToCatalog: jest.fn(),
      removeFromCatalog: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        {
          provide: CATALOG_REPOSITORY,
          useValue: mockCatalogRepository,
        },
        {
          provide: PRODUCT_REPOSITORY,
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
    catalogRepository = module.get(CATALOG_REPOSITORY);
    productRepository = module.get(PRODUCT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all catalogs', async () => {
      const catalogs = [mockCatalog];
      catalogRepository.findAll.mockResolvedValue(catalogs);

      const result = await service.findAll();

      expect(result).toEqual(catalogs);
      expect(catalogRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a catalog by id', async () => {
      catalogRepository.findById.mockResolvedValue(mockCatalog);

      const result = await service.findOne(1);

      expect(result).toEqual(mockCatalog);
      expect(catalogRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when catalog not found', async () => {
      catalogRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(catalogRepository.findById).toHaveBeenCalledWith(999);
    });
  });

  describe('create', () => {
    it('should create a new catalog', async () => {
      const createDto: CreateCatalogDto = {
        name: 'New Catalog',
        description: 'New Description',
      };

      catalogRepository.findByName.mockResolvedValue(null);
      catalogRepository.create.mockResolvedValue(mockCatalog);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCatalog);
      expect(catalogRepository.findByName).toHaveBeenCalledWith('New Catalog');
      expect(catalogRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException when catalog name already exists', async () => {
      const createDto: CreateCatalogDto = {
        name: 'Existing Catalog',
        description: 'Description',
      };

      catalogRepository.findByName.mockResolvedValue(mockCatalog);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(catalogRepository.findByName).toHaveBeenCalledWith(
        'Existing Catalog',
      );
    });
  });

  describe('update', () => {
    it('should update a catalog', async () => {
      const updateDto: UpdateCatalogDto = {
        name: 'Updated Catalog',
        description: 'Updated Description',
      };

      catalogRepository.findById.mockResolvedValue(mockCatalog);
      catalogRepository.findByName.mockResolvedValue(null);
      catalogRepository.update.mockResolvedValue({
        ...mockCatalog,
        ...updateDto,
      });

      const result = await service.update(1, updateDto);

      expect(result).toEqual({ ...mockCatalog, ...updateDto });
      expect(catalogRepository.findById).toHaveBeenCalledWith(1);
      expect(catalogRepository.findByName).toHaveBeenCalledWith(
        'Updated Catalog',
      );
      expect(catalogRepository.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should throw ConflictException when updated name already exists', async () => {
      const updateDto: UpdateCatalogDto = {
        name: 'Existing Catalog',
      };

      const existingCatalog = { ...mockCatalog, id: 2 };
      catalogRepository.findById.mockResolvedValue(mockCatalog);
      catalogRepository.findByName.mockResolvedValue(existingCatalog);

      await expect(service.update(1, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a catalog', async () => {
      catalogRepository.delete.mockResolvedValue(undefined);

      await service.remove(1);

      expect(catalogRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('findProducts', () => {
    it('should return products for a catalog', async () => {
      const products = [mockProduct];

      catalogRepository.findById.mockResolvedValue(mockCatalog);
      productRepository.findAll.mockResolvedValue(products);

      const result = await service.findProducts(1);

      expect(result).toEqual(products);
      expect(catalogRepository.findById).toHaveBeenCalledWith(1);
      expect(productRepository.findAll).toHaveBeenCalled();
    });

    it('should throw NotFoundException when catalog not found', async () => {
      catalogRepository.findById.mockResolvedValue(null);

      await expect(service.findProducts(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
