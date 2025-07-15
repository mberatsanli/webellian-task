import { Module } from '@nestjs/common';
import { Modules } from './modules/modules.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from '@/config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync(databaseConfig.asProvider()),
    Modules,
  ],
})
export class AppModule {}
