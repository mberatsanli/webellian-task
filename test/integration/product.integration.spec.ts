import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as fs from 'fs';
import * as path from 'path';
import { ProductModule } from '@/modules/product/product.module';
import { ProductService } from '@/modules/product/product.service';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '@/modules/product/interfaces/product.repository.interface';
import { CatalogModule } from '@/modules/catalog/catalog.module';
import { CatalogService } from '@/modules/catalog/catalog.service';
import { Product } from '@/modules/product/product.entity';
import { Catalog } from '@/modules/catalog/catalog.entity';
import { Role } from '@/modules/auth/enums/roles.enum';

describe('Product Integration Tests', () => {
  let app: INestApplication;
  let productService: ProductService;
  let productRepository: IProductRepository;
  let catalogService: CatalogService;
  let jwtService: JwtService;
  let dataSource: DataSource;
  let dbPath: string;

  let adminToken: string;
  let userToken: string;
  let invalidToken: string;

  beforeAll(async () => {
    const testId = Date.now() + Math.random();
    dbPath = path.join(
      process.cwd(),
      'data',
      `test-product-integration-${testId}.db`,
    );

    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
          load: [
            () => ({
              jwt: {
                secret: 'test-secret-key-for-testing-only',
              },
            }),
          ],
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: dbPath,
          entities: [Product, Catalog],
          synchronize: true,
          logging: false,
        }),
        ProductModule,
        CatalogModule,
      ],
      providers: [
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockImplementation((payload) => {
              return Buffer.from(JSON.stringify(payload)).toString('base64');
            }),
            verify: jest.fn().mockImplementation((token) => {
              try {
                const decoded = JSON.parse(
                  Buffer.from(token, 'base64').toString(),
                );
                return decoded;
              } catch {
                throw new Error('Invalid token');
              }
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    productService = moduleFixture.get<ProductService>(ProductService);
    productRepository =
      moduleFixture.get<IProductRepository>(PRODUCT_REPOSITORY);
    catalogService = moduleFixture.get<CatalogService>(CatalogService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();

    adminToken = jwtService.sign({
      sub: 1,
      username: 'admin',
      roles: [Role.ADMIN],
    });

    userToken = jwtService.sign({
      sub: 2,
      username: 'user',
      roles: [Role.USER],
    });

    invalidToken = 'invalid.jwt.token';
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }

    if (dbPath && fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
      } catch (error) {
        console.warn(`Failed to delete test database file: ${dbPath}`, error);
      }
    }
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM product');
    await dataSource.query('DELETE FROM catalog');
  });

  describe('ProductService Integration', () => {
    it('should create a product and retrieve it', async () => {
      const createProductDto = {
        name: 'Test Product Integration',
        description: 'Test Description Integration',
        price: 99.99,
        stockQuantity: 10,
      };

      const createdProduct = await productService.create(createProductDto);
      expect(createdProduct).toHaveProperty('id');
      expect(createdProduct.name).toBe(createProductDto.name);
      expect(createdProduct.description).toBe(createProductDto.description);
      expect(createdProduct.price).toBe(createProductDto.price);
      expect(createdProduct.stockQuantity).toBe(createProductDto.stockQuantity);

      const retrievedProduct = await productService.findOne(createdProduct.id);
      expect(retrievedProduct).toBeDefined();
      expect(retrievedProduct.id).toBe(createdProduct.id);
      expect(retrievedProduct.name).toBe(createProductDto.name);
    });

    it('should find product by name', async () => {
      const createProductDto = {
        name: 'Find By Name Product',
        description: 'Test Description',
        price: 50.0,
        stockQuantity: 5,
      };

      await productService.create(createProductDto);

      const foundProduct = await productRepository.findByName(
        createProductDto.name,
      );
      expect(foundProduct).toBeDefined();
      expect(foundProduct.name).toBe(createProductDto.name);
    });

    it('should update a product', async () => {
      const createProductDto = {
        name: 'Update Product Integration',
        description: 'Original Description',
        price: 75.0,
        stockQuantity: 15,
      };

      const createdProduct = await productService.create(createProductDto);

      const updateProductDto = {
        name: 'Updated Product Integration',
        price: 125.0,
      };

      const updatedProduct = await productService.update(
        createdProduct.id,
        updateProductDto,
      );
      expect(updatedProduct.name).toBe(updateProductDto.name);
      expect(updatedProduct.price).toBe(updateProductDto.price);
      expect(updatedProduct.description).toBe(createProductDto.description); // Should remain unchanged
    });

    it('should delete a product', async () => {
      const createProductDto = {
        name: 'Delete Product Integration',
        description: 'Test Description',
        price: 25.0,
        stockQuantity: 3,
      };

      const createdProduct = await productService.create(createProductDto);
      const productId = createdProduct.id;

      await productService.remove(productId);

      await expect(productService.findOne(productId)).rejects.toThrow();
    });

    it('should return all products', async () => {
      const products = [
        {
          name: 'Product 1',
          description: 'Description 1',
          price: 10.0,
          stockQuantity: 1,
        },
        {
          name: 'Product 2',
          description: 'Description 2',
          price: 20.0,
          stockQuantity: 2,
        },
        {
          name: 'Product 3',
          description: 'Description 3',
          price: 30.0,
          stockQuantity: 3,
        },
      ];

      for (const product of products) {
        await productService.create(product);
      }

      const allProducts = await productService.findAll();
      expect(allProducts).toHaveLength(3);
      expect(allProducts.map((p) => p.name)).toEqual(
        expect.arrayContaining(products.map((p) => p.name)),
      );
    });
  });

  describe('Product-Catalog Integration', () => {
    it('should create a product with catalog assignment', async () => {
      const catalog = await catalogService.create({
        name: 'Test Catalog for Product',
        description: 'Test catalog description',
      });

      const createProductDto = {
        name: 'Product with Catalog',
        description: 'Test Description',
        price: 150.0,
        stockQuantity: 20,
        catalogId: catalog.id,
      };

      const createdProduct = await productService.create(createProductDto);
      expect(createdProduct.catalogId).toBe(catalog.id);

      const catalogProducts = await catalogService.findProducts(catalog.id);
      expect(catalogProducts).toHaveLength(1);
      expect(catalogProducts[0].id).toBe(createdProduct.id);
    });

    it('should assign product to catalog after creation', async () => {
      const catalog = await catalogService.create({
        name: 'Test Catalog Assignment',
        description: 'Test catalog description',
      });

      const product = await productService.create({
        name: 'Product for Assignment',
        description: 'Test Description',
        price: 200.0,
        stockQuantity: 25,
      });

      const assignedProduct = await catalogService.assignProductToCatalog(
        catalog.id,
        product.id,
      );
      expect(assignedProduct.catalogId).toBe(catalog.id);

      const catalogProducts = await catalogService.findProducts(catalog.id);
      expect(catalogProducts).toHaveLength(1);
      expect(catalogProducts[0].id).toBe(product.id);
    });

    it('should remove product from catalog', async () => {
      const catalog = await catalogService.create({
        name: 'Test Catalog Removal',
        description: 'Test catalog description',
      });

      const product = await productService.create({
        name: 'Product for Removal',
        description: 'Test Description',
        price: 300.0,
        stockQuantity: 30,
        catalogId: catalog.id,
      });

      const removedProduct = await catalogService.removeProductFromCatalog(
        catalog.id,
        product.id,
      );
      expect(removedProduct.catalogId).toBeNull();

      const catalogProducts = await catalogService.findProducts(catalog.id);
      expect(catalogProducts).toHaveLength(0);
    });
  });

  describe('ProductRepository Integration', () => {
    it('should handle duplicate product names', async () => {
      const createProductDto = {
        name: 'Duplicate Name Product',
        description: 'Test Description',
        price: 100.0,
        stockQuantity: 10,
      };

      await productService.create(createProductDto);

      await expect(productService.create(createProductDto)).rejects.toThrow();
    });

    it('should handle product not found scenarios', async () => {
      const nonExistentId = 99999;

      await expect(productService.findOne(nonExistentId)).rejects.toThrow();

      await expect(
        productService.update(nonExistentId, { name: 'Updated' }),
      ).rejects.toThrow();
      await expect(productService.remove(nonExistentId)).rejects.toThrow();
    });

    it('should handle invalid catalog ID', async () => {
      const createProductDto = {
        name: 'Product with Invalid Catalog',
        description: 'Test Description',
        price: 50.0,
        stockQuantity: 5,
        catalogId: 99999, // Non-existent catalog ID
      };

      await expect(productService.create(createProductDto)).rejects.toThrow();
    });
  });

  describe('Database Transaction Integration', () => {
    it('should handle database transactions properly', async () => {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      let createdProduct: Product;

      try {
        const createProductDto = {
          name: 'Transaction Test Product',
          description: 'Test Description',
          price: 75.0,
          stockQuantity: 8,
        };

        createdProduct = await productService.create(createProductDto);
        expect(createdProduct).toBeDefined();

        const foundProduct = await productService.findOne(createdProduct.id);
        expect(foundProduct).toBeDefined();

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }

      const productAfterTransaction = await productService.findOne(
        createdProduct.id,
      );
      expect(productAfterTransaction).toBeDefined();
    });
  });

  describe('Stock Management Integration', () => {
    it('should handle stock quantity updates', async () => {
      const createProductDto = {
        name: 'Stock Management Product',
        description: 'Test Description',
        price: 25.0,
        stockQuantity: 100,
      };

      const createdProduct = await productService.create(createProductDto);
      expect(createdProduct.stockQuantity).toBe(100);

      const updatedProduct = await productService.update(createdProduct.id, {
        stockQuantity: 75,
      });
      expect(updatedProduct.stockQuantity).toBe(75);
    });

    it('should handle zero stock quantity', async () => {
      const createProductDto = {
        name: 'Zero Stock Product',
        description: 'Test Description',
        price: 10.0,
        stockQuantity: 0,
      };

      const createdProduct = await productService.create(createProductDto);
      expect(createdProduct.stockQuantity).toBe(0);
    });
  });

  describe('Role-Based Access Control Integration', () => {
    it('should validate admin token correctly', () => {
      const decodedToken = jwtService.verify(adminToken);
      expect(decodedToken).toBeDefined();
      expect(decodedToken.roles).toContain(Role.ADMIN);
      expect(decodedToken.username).toBe('admin');
    });

    it('should validate user token correctly', () => {
      const decodedToken = jwtService.verify(userToken);
      expect(decodedToken).toBeDefined();
      expect(decodedToken.roles).toContain(Role.USER);
      expect(decodedToken.username).toBe('user');
    });

    it('should reject invalid token', () => {
      expect(() => jwtService.verify(invalidToken)).toThrow();
    });

    it('should handle token without roles', () => {
      const tokenWithoutRoles = jwtService.sign({
        sub: 3,
        username: 'noroles',
        // No roles array
      });

      expect(() => jwtService.verify(tokenWithoutRoles)).not.toThrow();
      const decodedToken = jwtService.verify(tokenWithoutRoles);
      expect(decodedToken.roles).toBeUndefined();
    });

    it('should handle multiple roles in token', () => {
      const multiRoleToken = jwtService.sign({
        sub: 5,
        username: 'multirole',
        roles: [Role.ADMIN, Role.USER],
      });

      const decodedToken = jwtService.verify(multiRoleToken);
      expect(decodedToken.roles).toContain(Role.ADMIN);
      expect(decodedToken.roles).toContain(Role.USER);
      expect(decodedToken.roles).toHaveLength(2);
    });
  });
});
