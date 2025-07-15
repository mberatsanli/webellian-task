import { registerAs } from '@nestjs/config';
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import { generateConnectionOptions } from '@/database/datasource';

export default registerAs('database', () => {
  return generateConnectionOptions({
    database_path: process.env.DATABASE_PATH,
    node_env: process.env.NODE_ENV,
  }) as SqliteConnectionOptions;
});
