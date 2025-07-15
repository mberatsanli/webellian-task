import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProductController } from '@/modules/product/product.controller';
import { ProductService } from '@/modules/product/product.service';
import { Product } from '@/modules/product/product.entity';
import { CreateProductDto } from '@/modules/product/dto/create-product.dto';
import { UpdateProductDto } from '@/modules/product/dto/update-product.dto';

describe('ProductController', () => {
  let controller: ProductController;
  let service: jest.Mocked<ProductService>;

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
    const mockProductService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findUnassignedProducts: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      assignToCatalog: jest.fn(),
      removeFromCatalog: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get(ProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a product (ADMIN role required)', async () => {
      const createDto: CreateProductDto = {
        name: 'New Product',
        description: 'New Description',
        price: 200,
        stockQuantity: 5,
      };

      service.create.mockResolvedValue(mockProduct);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockProduct);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should create a product with catalog (ADMIN role required)', async () => {
      const createDto: CreateProductDto = {
        name: 'New Product',
        description: 'New Description',
        price: 200,
        stockQuantity: 5,
        catalogId: 1,
      };

      service.create.mockResolvedValue(mockProduct);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockProduct);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException when product name already exists', async () => {
      const createDto: CreateProductDto = {
        name: 'Existing Product',
        description: 'Description',
        price: 200,
        stockQuantity: 5,
      };

      service.create.mockRejectedValue(
        new ConflictException(
          'Product with name "Existing Product" already exists',
        ),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
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

      service.create.mockRejectedValue(
        new NotFoundException('Catalog with ID 999 not found'),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all products (public endpoint)', async () => {
      const products = [mockProduct];
      service.findAll.mockResolvedValue(products);

      const result = await controller.findAll();

      expect(result).toEqual(products);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findUnassignedProducts', () => {
    it('should return unassigned products (public endpoint)', async () => {
      const unassignedProducts = [
        { ...mockProduct, catalogId: null, catalog: null },
      ];
      service.findUnassignedProducts.mockResolvedValue(unassignedProducts);

      const result = await controller.findUnassignedProducts();

      expect(result).toEqual(unassignedProducts);
      expect(service.findUnassignedProducts).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a product by id (public endpoint)', async () => {
      service.findOne.mockResolvedValue(mockProduct);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockProduct);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when product not found', async () => {
      service.findOne.mockRejectedValue(
        new NotFoundException('Product with ID 999 not found'),
      );

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a product (ADMIN role required)', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated Product',
        price: 300,
      };

      const updatedProduct = { ...mockProduct, ...updateDto };
      service.update.mockResolvedValue(updatedProduct);

      const result = await controller.update(1, updateDto);

      expect(result).toEqual(updatedProduct);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should throw NotFoundException when product not found', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated Product',
      };

      service.update.mockRejectedValue(
        new NotFoundException('Product with ID 999 not found'),
      );

      await expect(controller.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when updated name already exists', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Existing Product',
      };

      service.update.mockRejectedValue(
        new ConflictException(
          'Product with name "Existing Product" already exists',
        ),
      );

      await expect(controller.update(1, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a product (ADMIN role required)', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when product not found', async () => {
      service.remove.mockRejectedValue(
        new NotFoundException('Product with ID 999 not found'),
      );

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
