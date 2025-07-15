import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProductService } from '@/modules/product/product.service';
import { Product } from '@/modules/product/product.entity';
import { Catalog } from '@/modules/catalog/catalog.entity';
import { CreateProductDto } from '@/modules/product/dto/create-product.dto';
import { UpdateProductDto } from '@/modules/product/dto/update-product.dto';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '@/modules/product/interfaces/product.repository.interface';
import {
  ICatalogRepository,
  CATALOG_REPOSITORY,
} from '@/modules/catalog/interfaces/catalog.repository.interface';

describe('ProductService', () => {
  let service: ProductService;
  let productRepository: jest.Mocked<IProductRepository>;
  let catalogRepository: jest.Mocked<ICatalogRepository>;

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

  beforeEach(async () => {
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

    const mockCatalogRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: mockProductRepository,
        },
        {
          provide: CATALOG_REPOSITORY,
          useValue: mockCatalogRepository,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    productRepository = module.get(PRODUCT_REPOSITORY);
    catalogRepository = module.get(CATALOG_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const products = [mockProduct];
      productRepository.findAll.mockResolvedValue(products);

      const result = await service.findAll();

      expect(result).toEqual(products);
      expect(productRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findUnassignedProducts', () => {
    it('should return unassigned products', async () => {
      const unassignedProducts = [
        { ...mockProduct, catalogId: null, catalog: null },
      ];
      productRepository.findUnassignedProducts.mockResolvedValue(
        unassignedProducts,
      );

      const result = await service.findUnassignedProducts();

      expect(result).toEqual(unassignedProducts);
      expect(productRepository.findUnassignedProducts).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);

      const result = await service.findOne(1);

      expect(result).toEqual(mockProduct);
      expect(productRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(productRepository.findById).toHaveBeenCalledWith(999);
    });
  });

  describe('create', () => {
    it('should create a new product without catalog', async () => {
      const createDto: CreateProductDto = {
        name: 'New Product',
        description: 'New Description',
        price: 200,
        stockQuantity: 5,
      };

      productRepository.findByName.mockResolvedValue(null);
      productRepository.create.mockResolvedValue(mockProduct);

      const result = await service.create(createDto);

      expect(result).toEqual(mockProduct);
      expect(productRepository.findByName).toHaveBeenCalledWith('New Product');
      expect(productRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('should create a new product with catalog', async () => {
      const createDto: CreateProductDto = {
        name: 'New Product',
        description: 'New Description',
        price: 200,
        stockQuantity: 5,
        catalogId: 1,
      };

      productRepository.findByName.mockResolvedValue(null);
      catalogRepository.findById.mockResolvedValue(mockCatalog);
      productRepository.create.mockResolvedValue(mockProduct);

      const result = await service.create(createDto);

      expect(result).toEqual(mockProduct);
      expect(catalogRepository.findById).toHaveBeenCalledWith(1);
      expect(productRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException when product name already exists', async () => {
      const createDto: CreateProductDto = {
        name: 'Existing Product',
        description: 'Description',
        price: 200,
        stockQuantity: 5,
      };

      productRepository.findByName.mockResolvedValue(mockProduct);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException when catalog not found', async () => {
      const createDto: CreateProductDto = {
        name: 'New Product',
        description: 'Description',
        price: 200,
        stockQuantity: 5,
        catalogId: 999,
      };

      productRepository.findByName.mockResolvedValue(null);
      catalogRepository.findById.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated Product',
        price: 300,
      };

      productRepository.findByName.mockResolvedValue(null);
      productRepository.update.mockResolvedValue({
        ...mockProduct,
        ...updateDto,
      });

      const result = await service.update(1, updateDto);

      expect(result).toEqual({ ...mockProduct, ...updateDto });
      expect(productRepository.findByName).toHaveBeenCalledWith(
        'Updated Product',
      );
      expect(productRepository.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should throw ConflictException when updated name already exists', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Existing Product',
      };

      const existingProduct = { ...mockProduct, id: 2 };
      productRepository.findByName.mockResolvedValue(existingProduct);

      await expect(service.update(1, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      productRepository.delete.mockResolvedValue(undefined);

      await service.remove(1);

      expect(productRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('assignToCatalog', () => {
    it('should assign product to catalog', async () => {
      catalogRepository.findById.mockResolvedValue(mockCatalog);
      productRepository.assignToCatalog.mockResolvedValue(mockProduct);

      const result = await service.assignToCatalog(1, 1);

      expect(result).toEqual(mockProduct);
      expect(catalogRepository.findById).toHaveBeenCalledWith(1);
      expect(productRepository.assignToCatalog).toHaveBeenCalledWith(1, 1);
    });

    it('should throw NotFoundException when catalog not found', async () => {
      catalogRepository.findById.mockResolvedValue(null);

      await expect(service.assignToCatalog(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeFromCatalog', () => {
    it('should remove product from catalog', async () => {
      const unassignedProduct = {
        ...mockProduct,
        catalogId: null,
        catalog: null,
      };
      productRepository.removeFromCatalog.mockResolvedValue(unassignedProduct);

      const result = await service.removeFromCatalog(1);

      expect(result).toEqual(unassignedProduct);
      expect(productRepository.removeFromCatalog).toHaveBeenCalledWith(1);
    });
  });
});
