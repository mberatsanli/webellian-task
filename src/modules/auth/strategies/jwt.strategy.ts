import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET_KEY'),
    });
  }

  async validate(payload: any) {
    // Validate required fields
    if (!payload.sub || !payload.username) {
      throw new UnauthorizedException(
        'Invalid JWT payload: missing required fields',
      );
    }

    // Validate roles - must be present and non-empty array
    if (
      !payload.roles ||
      !Array.isArray(payload.roles) ||
      payload.roles.length === 0
    ) {
      throw new UnauthorizedException(
        'Invalid JWT payload: roles must be a non-empty array',
      );
    }

    return {
      userId: payload.sub,
      username: payload.username,
      roles: payload.roles,
    };
  }
}
