import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CatalogProductController } from '@/modules/catalog/catalog-product.controller';
import { CatalogService } from '@/modules/catalog/catalog.service';
import { Product } from '@/modules/product/product.entity';
import { Catalog } from '@/modules/catalog/catalog.entity';

describe('CatalogProductController', () => {
  let controller: CatalogProductController;
  let service: jest.Mocked<CatalogService>;

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
    const mockCatalogService = {
      findProducts: jest.fn(),
      assignProductToCatalog: jest.fn(),
      removeProductFromCatalog: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogProductController],
      providers: [
        {
          provide: CatalogService,
          useValue: mockCatalogService,
        },
      ],
    }).compile();

    controller = module.get<CatalogProductController>(CatalogProductController);
    service = module.get(CatalogService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findProducts', () => {
    it('should return all products in a catalog (public endpoint)', async () => {
      const products = [mockProduct];
      service.findProducts.mockResolvedValue(products);

      const result = await controller.findProducts(1);

      expect(result).toEqual(products);
      expect(service.findProducts).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when catalog not found', async () => {
      service.findProducts.mockRejectedValue(
        new NotFoundException('Catalog with ID 999 not found'),
      );

      await expect(controller.findProducts(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('assignProductToCatalog', () => {
    it('should assign product to catalog (ADMIN role required)', async () => {
      service.assignProductToCatalog.mockResolvedValue(mockProduct);

      const result = await controller.assignProductToCatalog(1, 1);

      expect(result).toEqual(mockProduct);
      expect(service.assignProductToCatalog).toHaveBeenCalledWith(1, 1);
    });

    it('should throw NotFoundException when catalog not found', async () => {
      service.assignProductToCatalog.mockRejectedValue(
        new NotFoundException('Catalog with ID 999 not found'),
      );

      await expect(controller.assignProductToCatalog(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when product not found', async () => {
      service.assignProductToCatalog.mockRejectedValue(
        new NotFoundException('Product with ID 999 not found'),
      );

      await expect(controller.assignProductToCatalog(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeProductFromCatalog', () => {
    it('should remove product from catalog (ADMIN role required)', async () => {
      const unassignedProduct = {
        ...mockProduct,
        catalogId: null,
        catalog: null,
      };
      service.removeProductFromCatalog.mockResolvedValue(unassignedProduct);

      const result = await controller.removeProductFromCatalog(1, 1);

      expect(result).toEqual(unassignedProduct);
      expect(service.removeProductFromCatalog).toHaveBeenCalledWith(1, 1);
    });

    it('should throw NotFoundException when catalog not found', async () => {
      service.removeProductFromCatalog.mockRejectedValue(
        new NotFoundException('Catalog with ID 999 not found'),
      );

      await expect(controller.removeProductFromCatalog(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when product not found', async () => {
      service.removeProductFromCatalog.mockRejectedValue(
        new NotFoundException('Product with ID 999 not found'),
      );

      await expect(controller.removeProductFromCatalog(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when product does not belong to catalog', async () => {
      service.removeProductFromCatalog.mockRejectedValue(
        new NotFoundException('Product with ID 1 does not belong to catalog 2'),
      );

      await expect(controller.removeProductFromCatalog(2, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
