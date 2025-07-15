# Webellian Task

## Description

This is a **catalog management system** built with NestJS. It's basically an API that helps you organize products into catalogs - like having different categories for your online store items.

## Features

### Authentication & Authorization
- **JWT-based authentication** for secure user login
- **Role-based access control** with two user types:
  - `USER` - can view products and catalogs
  - `ADMIN` - full access to manage everything
- **Protected routes** with guards and decorators

### Product Management
- **Create, read, update, delete** products
- **Product details** include:
  - Name and description
  - Price (with validation)
  - Stock quantity tracking
  - Optional catalog assignment
- **Data validation** using class-validator decorators

### Catalog Management
- **Organize products** into different catalogs
- **Flexible catalog structure** with name and description
- **Product-catalog relationships** - assign/remove products from catalogs
- **Browse products** within specific catalogs

### Technical Features
- **RESTful API** with proper HTTP status codes
- **Swagger documentation** for easy API testing
- **TypeORM** for database operations with SQLite
- **Comprehensive testing**:
  - Unit tests for services and controllers
  - Integration tests for database operations
  - End-to-end tests for complete workflows
- **Clean architecture** with separate modules and repositories
- **Environment configuration** support
- **Database migrations** for schema management

### Development Features
- **Hot reload** in development mode
- **TypeScript** for type safety
- **ESLint & Prettier** for code formatting
- **Docker support** for containerization

## Docker Setup

The project uses a **multi-container Docker setup** with two separate services:

### App Container (`webellian-app`)
- **Main NestJS application** that serves the API
- **Built and optimized** for production deployment
- **Runs on port 3000** (configurable via environment)
- **Handles all HTTP requests** and business logic

### CLI Container (`webellian-cli`)
- **Database management tool** for administrative tasks
- **Migration management** - create, run, and revert database migrations
- **Future extensibility** - ready for seeders, data imports, and other CLI tools
- **Shared database access** with the main app container
- **Stays running** for on-demand CLI operations

### Container Communication
- **Shared volume** (`database_data`) for database persistence
- **Same environment variables** for consistent configuration
- **Independent scaling** - CLI can be used without running the main app
- **Production-ready** with proper user permissions and security

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Run migrations

```bash
$ npm run migration:run
```
