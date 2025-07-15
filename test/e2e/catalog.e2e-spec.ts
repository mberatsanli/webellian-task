import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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

describe('CatalogController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let dbPath: string;

  let adminToken: string;
  let userToken: string;
  let invalidToken: string;

  beforeAll(async () => {
    const testId = Date.now() + Math.random();
    dbPath = path.join(process.cwd(), 'data', `test-catalog-e2e-${testId}.db`);

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

  describe('Authentication', () => {
    it('should reject requests without JWT token', () => {
      return request(app.getHttpServer()).get('/catalogs').expect(401);
    });

    it('should reject requests with invalid JWT token', () => {
      return request(app.getHttpServer())
        .get('/catalogs')
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
        .get('/catalogs')
        .set('Authorization', `Bearer ${tokenWithoutRoles}`)
        .expect(401);
    });
  });

  describe('/api/v1/catalogs (GET)', () => {
    it('should return all catalogs with admin role', () => {
      return request(app.getHttpServer())
        .get('/catalogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should return all catalogs with user role', () => {
      return request(app.getHttpServer())
        .get('/catalogs')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/v1/catalogs (POST)', () => {
    it('should create a new catalog with admin role', () => {
      const createCatalogDto = {
        name: 'Test Catalog E2E',
        description: 'Test Description E2E',
      };

      return request(app.getHttpServer())
        .post('/catalogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createCatalogDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(createCatalogDto.name);
          expect(res.body.description).toBe(createCatalogDto.description);
        });
    });

    it('should reject catalog creation with user role', () => {
      const createCatalogDto = {
        name: 'Test Catalog User E2E',
        description: 'Test Description',
      };

      return request(app.getHttpServer())
        .post('/catalogs')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createCatalogDto)
        .expect(403);
    });

    it('should return 409 when catalog name already exists', async () => {
      const createCatalogDto = {
        name: 'Duplicate Catalog E2E',
        description: 'Test Description',
      };

      await request(app.getHttpServer())
        .post('/catalogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createCatalogDto)
        .expect(201);

      return request(app.getHttpServer())
        .post('/catalogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createCatalogDto)
        .expect(409);
    });
  });

  describe('/api/v1/catalogs/:id (GET)', () => {
    let testCatalogId: number;

    beforeEach(async () => {
      await request(app.getHttpServer())
        .delete(`/catalogs/${testCatalogId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const response = await request(app.getHttpServer())
        .post('/catalogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Get Catalog E2E',
          description: 'Test Description',
        });

      testCatalogId = response.body.id;
    });

    it('should return a catalog by id with admin role', () => {
      return request(app.getHttpServer())
        .get(`/catalogs/${testCatalogId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testCatalogId);
          expect(res.body.name).toBe('Get Catalog E2E');
        });
    });

    it('should return a catalog by id with user role', () => {
      return request(app.getHttpServer())
        .get(`/catalogs/${testCatalogId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect((res) => {
          console.log('>>>', res.body, 'BUT', testCatalogId);
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testCatalogId);
        });
    });

    it('should return 404 when catalog not found', () => {
      return request(app.getHttpServer())
        .get('/catalogs/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/api/v1/catalogs/:id (PATCH)', () => {
    let testCatalogId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/catalogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Update Catalog E2E',
          description: 'Original Description',
        });

      testCatalogId = response.body.id;
    });

    it('should update a catalog with admin role', () => {
      const updateCatalogDto = {
        name: 'Updated Catalog E2E',
        description: 'Updated Description',
      };

      return request(app.getHttpServer())
        .patch(`/catalogs/${testCatalogId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateCatalogDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testCatalogId);
          expect(res.body.name).toBe(updateCatalogDto.name);
          expect(res.body.description).toBe(updateCatalogDto.description);
        });
    });

    it('should reject catalog update with user role', () => {
      const updateCatalogDto = {
        name: 'Updated Catalog User E2E',
        description: 'Updated Description',
      };

      return request(app.getHttpServer())
        .patch(`/catalogs/${testCatalogId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateCatalogDto)
        .expect(403);
    });

    it('should return 404 for updating non-existent catalog', () => {
      const updateCatalogDto = {
        name: 'Updated Catalog E2E',
        description: 'Updated Description',
      };

      return request(app.getHttpServer())
        .patch('/catalogs/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateCatalogDto)
        .expect(404);
    });
  });

  describe('/api/v1/catalogs/:id (DELETE)', () => {
    let testCatalogId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/catalogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Delete Catalog E2E',
          description: 'Test Description',
        });

      testCatalogId = response.body.id;
    });

    it('should delete a catalog with admin role', () => {
      return request(app.getHttpServer())
        .delete(`/catalogs/${testCatalogId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should reject catalog deletion with user role', () => {
      return request(app.getHttpServer())
        .delete(`/catalogs/${testCatalogId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 404 for deleting non-existent catalog', () => {
      return request(app.getHttpServer())
        .delete('/catalogs/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
