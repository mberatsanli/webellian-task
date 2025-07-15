import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import jwtConfig from '@/config/jwt.config';

@Module({
  imports: [ConfigModule, JwtModule.registerAsync(jwtConfig)],
  providers: [JwtStrategy],
})
export class AuthModule {}
