import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@/modules/auth/enums/roles.enum';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Catalog } from '@/modules/catalog/catalog.entity';
import { Product } from '@/modules/product/product.entity';

describe('ProductController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let dbPath: string;

  let adminToken: string;
  let userToken: string;
  let invalidToken: string;

  const testProduct = {
    name: 'Test Product E2E',
    description: 'Test product for e2e testing',
    price: 99.99,
    stockQuantity: 10,
  };

  const testProductUpdate = {
    name: 'Updated Test Product E2E',
    price: 149.99,
  };

  let createdProductId: number;
  let testCatalogId: number;

  beforeAll(async () => {
    const testId = Date.now() + Math.random();
    dbPath = path.join(process.cwd(), 'data', `test-product-e2e-${testId}.db`);

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
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

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

    try {
      const catalogResponse = await request(app.getHttpServer())
        .post('/catalogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Catalog E2E',
          description: 'Test catalog for e2e testing',
        });

      if (catalogResponse.status === 201) {
        testCatalogId = catalogResponse.body.id;
      }
    } catch {
      // Catalog might already exist, continue with tests
      testCatalogId = 1; // Use default catalog ID
    }
  });

  afterAll(async () => {
    if (createdProductId) {
      try {
        await request(app.getHttpServer())
          .delete(`/products/${createdProductId}`)
          .set('Authorization', `Bearer ${adminToken}`);
      } catch {
        // Product might already be deleted
      }
    }

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

  describe('Authentication', () => {
    it('should reject requests without JWT token', () => {
      return request(app.getHttpServer()).get('/products').expect(401);
    });

    it('should reject requests with invalid JWT token', () => {
      return request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
    });

    it('should reject requests with JWT token without roles', () => {
      const tokenWithoutRoles = jwtService.sign({
        sub: 3,
        username: 'noroles',
        // No roles array
      });

      return request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${tokenWithoutRoles}`)
        .expect(401);
    });
  });

  describe('/v1/products (POST)', () => {
    it('should create a new product with admin role', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testProduct)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(testProduct.name);
          expect(res.body.description).toBe(testProduct.description);
          expect(res.body.price).toBe(testProduct.price);
          expect(res.body.stockQuantity).toBe(testProduct.stockQuantity);
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
          createdProductId = res.body.id;
        });
    });

    it('should create a product with catalog assignment', () => {
      const productWithCatalog = {
        ...testProduct,
        name: 'Test Product with Catalog E2E',
        catalogId: testCatalogId,
      };

      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productWithCatalog)
        .expect(201)
        .expect((res) => {
          expect(res.body.catalogId).toBe(testCatalogId);
        });
    });

    it('should reject product creation with user role', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(testProduct)
        .expect(403);
    });

    it('should reject product creation with duplicate name', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testProduct);

      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testProduct)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already exists');
        });
    });

    it('should reject product creation with invalid catalog ID', () => {
      const productWithInvalidCatalog = {
        ...testProduct,
        name: 'Test Product Invalid Catalog E2E',
        catalogId: 99999,
      };

      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productWithInvalidCatalog)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('Catalog with ID 99999 not found');
        });
    });

    it('should reject product creation with invalid data', () => {
      const invalidProduct = {
        name: '', // Empty name
        price: -10, // Negative price
        stockQuantity: -5, // Negative stock
      };

      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidProduct)
        .expect(400);
    });
  });

  describe('/v1/products (GET)', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...testProduct,
          name: 'Test Product for GET E2E',
        });

      createdProductId = response.body.id;
    });

    it('should return all products with admin role', () => {
      return request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('price');
        });
    });

    it('should return all products with user role', () => {
      return request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/v1/products/unassigned (GET)', () => {
    it('should return unassigned products with admin role', () => {
      return request(app.getHttpServer())
        .get('/products/unassigned')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should reject unassigned products request with user role', () => {
      return request(app.getHttpServer())
        .get('/products/unassigned')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('/v1/products/:id (GET)', () => {
    beforeEach(async () => {
      if (createdProductId) {
        await request(app.getHttpServer())
          .delete(`/products/${createdProductId}`)
          .set('Authorization', `Bearer ${adminToken}`);
      }

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...testProduct,
          name: 'Test Product for GET by ID E2E',
        });

      createdProductId = response.body.id;
    });

    it('should return a product by ID with admin role', () => {
      return request(app.getHttpServer())
        .get(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdProductId);
          expect(res.body.name).toBe('Test Product for GET by ID E2E');
        });
    });

    it('should return a product by ID with user role', () => {
      return request(app.getHttpServer())
        .get(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdProductId);
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get('/products/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('Product with ID 99999 not found');
        });
    });

    it('should return 400 for invalid product ID', () => {
      return request(app.getHttpServer())
        .get('/products/invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('/v1/products/:id (PATCH)', () => {
    beforeEach(async () => {
      if (createdProductId) {
        await request(app.getHttpServer())
          .delete(`/products/${createdProductId}`)
          .set('Authorization', `Bearer ${adminToken}`);
      }

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...testProduct,
          name: 'Test Product for Update E2E',
        });

      createdProductId = response.body.id;
    });

    it('should update a product with admin role', () => {
      return request(app.getHttpServer())
        .patch(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testProductUpdate)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdProductId);
          expect(res.body.name).toBe(testProductUpdate.name);
          expect(res.body.price).toBe(testProductUpdate.price);
        });
    });

    it('should reject product update with user role', () => {
      return request(app.getHttpServer())
        .patch(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(testProductUpdate)
        .expect(403);
    });

    it('should return 404 for updating non-existent product', () => {
      return request(app.getHttpServer())
        .patch('/products/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testProductUpdate)
        .expect(404);
    });

    it('should reject update with duplicate name', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...testProduct,
          name: 'Another Test Product E2E',
        });

      return request(app.getHttpServer())
        .patch(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Another Test Product E2E' })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already exists');
        });
    });
  });

  describe('/v1/products/:id (DELETE)', () => {
    beforeEach(async () => {
      if (createdProductId) {
        await request(app.getHttpServer())
          .delete(`/products/${createdProductId}`)
          .set('Authorization', `Bearer ${adminToken}`);
      }

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...testProduct,
          name: 'Test Product for Delete E2E',
        });

      createdProductId = response.body.id;
    });

    it('should delete a product with admin role', () => {
      return request(app.getHttpServer())
        .delete(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should reject product deletion with user role', () => {
      return request(app.getHttpServer())
        .delete(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 404 for deleting non-existent product', () => {
      return request(app.getHttpServer())
        .delete('/products/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/v1/catalogs/:catalogId/products (GET)', () => {
    it('should return products in a catalog with admin role', () => {
      return request(app.getHttpServer())
        .get(`/catalogs/${testCatalogId}/products`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should return products in a catalog with user role', () => {
      return request(app.getHttpServer())
        .get(`/catalogs/${testCatalogId}/products`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should return 404 for non-existent catalog', () => {
      return request(app.getHttpServer())
        .get('/catalogs/99999/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/v1/catalogs/:catalogId/products/:productId (POST)', () => {
    beforeEach(async () => {
      if (createdProductId) {
        await request(app.getHttpServer())
          .delete(`/products/${createdProductId}`)
          .set('Authorization', `Bearer ${adminToken}`);
      }

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...testProduct,
          name: 'Test Product for Assignment E2E',
        });

      createdProductId = response.body.id;
    });

    it('should assign a product to a catalog with admin role', () => {
      return request(app.getHttpServer())
        .post(`/catalogs/${testCatalogId}/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.catalogId).toBe(testCatalogId);
        });
    });

    it('should reject product assignment with user role', () => {
      return request(app.getHttpServer())
        .post(`/catalogs/${testCatalogId}/products/${createdProductId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent catalog', () => {
      return request(app.getHttpServer())
        .post(`/catalogs/99999/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          console.log('ress', res.body, createdProductId);
        })
        .expect(404);
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .post(`/catalogs/${testCatalogId}/products/99999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/v1/catalogs/:catalogId/products/:productId (DELETE)', () => {
    beforeEach(async () => {
      if (createdProductId) {
        await request(app.getHttpServer())
          .delete(`/products/${createdProductId}`)
          .set('Authorization', `Bearer ${adminToken}`);
      }

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...testProduct,
          name: 'Test Product for Removal E2E',
          catalogId: testCatalogId,
        });

      createdProductId = response.body.id;
    });

    it('should remove a product from a catalog with admin role', () => {
      return request(app.getHttpServer())
        .delete(`/catalogs/${testCatalogId}/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.catalogId).toBeNull();
        });
    });

    it('should reject product removal with user role', () => {
      return request(app.getHttpServer())
        .delete(`/catalogs/${testCatalogId}/products/${createdProductId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent catalog', () => {
      return request(app.getHttpServer())
        .delete(`/catalogs/99999/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .delete(`/catalogs/${testCatalogId}/products/99999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
