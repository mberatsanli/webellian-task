import { DataSource } from 'typeorm';
import { DataSourceOptions } from 'typeorm/data-source/DataSourceOptions';
import { Catalog } from '@/modules/catalog/catalog.entity';
import { Product } from '@/modules/product/product.entity';

export interface DatabaseConfig {
  database_path?: string;
  node_env?: NodeJS.ProcessEnv['NODE_ENV'];
}

export const generateConnectionOptions = (
  config: DatabaseConfig = {},
): DataSourceOptions => {
  const databasePath = config.database_path || './data/webellian.db';

  return {
    type: 'sqlite',
    database: process.env.NODE_ENV === 'test' ? ':memory:' : databasePath,
    entities: [Catalog, Product],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    synchronize: process.env.NODE_ENV === 'test',
    logging: config.node_env === 'development',
  };
};

export default new DataSource(
  generateConnectionOptions({
    database_path: process.env.DATABASE_PATH,
    node_env: process.env.NODE_ENV,
  }),
);
