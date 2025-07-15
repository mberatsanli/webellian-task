import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CatalogController } from '@/modules/catalog/catalog.controller';
import { CatalogService } from '@/modules/catalog/catalog.service';
import { Catalog } from '@/modules/catalog/catalog.entity';
import { CreateCatalogDto } from '@/modules/catalog/dto/create-catalog.dto';
import { UpdateCatalogDto } from '@/modules/catalog/dto/update-catalog.dto';

describe('CatalogController', () => {
  let controller: CatalogController;
  let service: jest.Mocked<CatalogService>;

  const mockCatalog: Catalog = {
    id: 1,
    name: 'Test Catalog',
    description: 'Test Description',
    products: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockCatalogService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findProducts: jest.fn(),
      assignProductToCatalog: jest.fn(),
      removeProductFromCatalog: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [
        {
          provide: CatalogService,
          useValue: mockCatalogService,
        },
      ],
    }).compile();

    controller = module.get<CatalogController>(CatalogController);
    service = module.get(CatalogService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a catalog', async () => {
      const createDto: CreateCatalogDto = {
        name: 'New Catalog',
        description: 'New Description',
      };

      service.create.mockResolvedValue(mockCatalog);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockCatalog);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException when catalog name already exists', async () => {
      const createDto: CreateCatalogDto = {
        name: 'Existing Catalog',
        description: 'Description',
      };

      service.create.mockRejectedValue(
        new ConflictException(
          'Catalog with name "Existing Catalog" already exists',
        ),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all catalogs', async () => {
      const catalogs = [mockCatalog];
      service.findAll.mockResolvedValue(catalogs);

      const result = await controller.findAll();

      expect(result).toEqual(catalogs);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a catalog by id', async () => {
      service.findOne.mockResolvedValue(mockCatalog);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockCatalog);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when catalog not found', async () => {
      service.findOne.mockRejectedValue(
        new NotFoundException('Catalog with ID 999 not found'),
      );

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a catalog', async () => {
      const updateDto: UpdateCatalogDto = {
        name: 'Updated Catalog',
        description: 'Updated Description',
      };

      const updatedCatalog = { ...mockCatalog, ...updateDto };
      service.update.mockResolvedValue(updatedCatalog);

      const result = await controller.update(1, updateDto);

      expect(result).toEqual(updatedCatalog);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should throw NotFoundException when catalog not found', async () => {
      const updateDto: UpdateCatalogDto = {
        name: 'Updated Catalog',
      };

      service.update.mockRejectedValue(
        new NotFoundException('Catalog with ID 999 not found'),
      );

      await expect(controller.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a catalog', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when catalog not found', async () => {
      service.remove.mockRejectedValue(
        new NotFoundException('Catalog with ID 999 not found'),
      );

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
