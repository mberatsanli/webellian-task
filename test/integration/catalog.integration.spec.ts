import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as fs from 'fs';
import * as path from 'path';
import { CatalogModule } from '@/modules/catalog/catalog.module';
import { CatalogService } from '@/modules/catalog/catalog.service';
import {
  ICatalogRepository,
  CATALOG_REPOSITORY,
} from '@/modules/catalog/interfaces/catalog.repository.interface';
import { Catalog } from '@/modules/catalog/catalog.entity';
import { Product } from '@/modules/product/product.entity';
import { Role } from '@/modules/auth/enums/roles.enum';

describe('Catalog Integration Tests', () => {
  let app: INestApplication;
  let catalogService: CatalogService;
  let catalogRepository: ICatalogRepository;
  let jwtService: JwtService;
  let dataSource: DataSource;
  let dbPath: string;

  // Test JWT tokens
  let adminToken: string;
  let userToken: string;
  let invalidToken: string;

  beforeAll(async () => {
    // Create unique database file for this test
    const testId = Date.now() + Math.random();
    dbPath = path.join(
      process.cwd(),
      'data',
      `test-catalog-integration-${testId}.db`,
    );

    // Ensure data directory exists
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
          entities: [Catalog, Product],
          synchronize: true,
          logging: false,
        }),
        CatalogModule,
      ],
      providers: [
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockImplementation((payload) => {
              // Simple mock JWT signing
              return Buffer.from(JSON.stringify(payload)).toString('base64');
            }),
            verify: jest.fn().mockImplementation((token) => {
              try {
                // Simple mock JWT verification
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
    catalogService = moduleFixture.get<CatalogService>(CatalogService);
    catalogRepository =
      moduleFixture.get<ICatalogRepository>(CATALOG_REPOSITORY);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();

    // Generate test JWT tokens
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

    // Clean up database file
    if (dbPath && fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
      } catch (error) {
        console.warn(`Failed to delete test database file: ${dbPath}`, error);
      }
    }
  });

  beforeEach(async () => {
    // Clean up database before each test
    await dataSource.query('DELETE FROM product');
    await dataSource.query('DELETE FROM catalog');
  });

  describe('CatalogService Integration', () => {
    it('should create a catalog and retrieve it', async () => {
      const createCatalogDto = {
        name: 'Test Catalog Integration',
        description: 'Test Description Integration',
      };

      const createdCatalog = await catalogService.create(createCatalogDto);
      expect(createdCatalog).toHaveProperty('id');
      expect(createdCatalog.name).toBe(createCatalogDto.name);
      expect(createdCatalog.description).toBe(createCatalogDto.description);

      const retrievedCatalog = await catalogService.findOne(createdCatalog.id);
      expect(retrievedCatalog).toBeDefined();
      expect(retrievedCatalog.id).toBe(createdCatalog.id);
      expect(retrievedCatalog.name).toBe(createCatalogDto.name);
    });

    it('should find catalog by name', async () => {
      const createCatalogDto = {
        name: 'Find By Name Catalog',
        description: 'Test Description',
      };

      await catalogService.create(createCatalogDto);

      const foundCatalog = await catalogRepository.findByName(
        createCatalogDto.name,
      );
      expect(foundCatalog).toBeDefined();
      expect(foundCatalog.name).toBe(createCatalogDto.name);
    });

    it('should update a catalog', async () => {
      const createCatalogDto = {
        name: 'Update Catalog Integration',
        description: 'Original Description',
      };

      const createdCatalog = await catalogService.create(createCatalogDto);

      const updateCatalogDto = {
        name: 'Updated Catalog Integration',
        description: 'Updated Description',
      };

      const updatedCatalog = await catalogService.update(
        createdCatalog.id,
        updateCatalogDto,
      );
      expect(updatedCatalog.name).toBe(updateCatalogDto.name);
      expect(updatedCatalog.description).toBe(updateCatalogDto.description);
    });

    it('should delete a catalog', async () => {
      const createCatalogDto = {
        name: 'Delete Catalog Integration',
        description: 'Test Description',
      };

      const createdCatalog = await catalogService.create(createCatalogDto);
      const catalogId = createdCatalog.id;

      await catalogService.remove(catalogId);

      await expect(catalogService.findOne(catalogId)).rejects.toThrow();
    });

    it('should return all catalogs', async () => {
      const catalogs = [
        { name: 'Catalog 1', description: 'Description 1' },
        { name: 'Catalog 2', description: 'Description 2' },
        { name: 'Catalog 3', description: 'Description 3' },
      ];

      for (const catalog of catalogs) {
        await catalogService.create(catalog);
      }

      const allCatalogs = await catalogService.findAll();
      expect(allCatalogs).toHaveLength(3);
      expect(allCatalogs.map((c) => c.name)).toEqual(
        expect.arrayContaining(catalogs.map((c) => c.name)),
      );
    });
  });

  describe('CatalogRepository Integration', () => {
    it('should handle duplicate catalog names', async () => {
      const createCatalogDto = {
        name: 'Duplicate Name Catalog',
        description: 'Test Description',
      };

      await catalogService.create(createCatalogDto);

      // Try to create another catalog with the same name
      await expect(catalogService.create(createCatalogDto)).rejects.toThrow();
    });

    it('should handle catalog not found scenarios', async () => {
      const nonExistentId = 99999;

      await expect(catalogService.findOne(nonExistentId)).rejects.toThrow();

      await expect(
        catalogService.update(nonExistentId, { name: 'Updated' }),
      ).rejects.toThrow();
      await expect(catalogService.remove(nonExistentId)).rejects.toThrow();
    });
  });

  describe('Database Transaction Integration', () => {
    it('should handle database transactions properly', async () => {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      let createdCatalog: Catalog;

      try {
        const createCatalogDto = {
          name: 'Transaction Test Catalog',
          description: 'Test Description',
        };

        // Create catalog within transaction
        createdCatalog = await catalogService.create(createCatalogDto);
        expect(createdCatalog).toBeDefined();

        // Verify catalog exists within transaction
        const foundCatalog = await catalogService.findOne(createdCatalog.id);
        expect(foundCatalog).toBeDefined();

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }

      // Verify catalog still exists after transaction
      const catalogAfterTransaction = await catalogService.findOne(
        createdCatalog.id,
      );
      expect(catalogAfterTransaction).toBeDefined();
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

    // Uncomment this test if you want to handle expired tokens
    // it('should handle expired token', () => {
    //   const expiredToken = jwtService.sign(
    //     {
    //       sub: 4,
    //       username: 'expired',
    //       roles: [Role.USER],
    //     },
    //     { expiresIn: '0s' },
    //   );
    //
    //   // Wait a bit for token to expire
    //   setTimeout(() => {
    //     expect(() => jwtService.verify(expiredToken)).toThrow();
    //   }, 100);
    // });
  });
});
