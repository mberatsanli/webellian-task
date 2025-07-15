import { ConfigService } from '@nestjs/config';

export default {
  useFactory: (config: ConfigService) => {
    return {
      global: true,
      secret: config.get<string>('JWT_SECRET_KEY'),
      signOptions: {
        expiresIn: config.get('JWT_ACCESS_TOKEN_EXPIRATION') || '1d',
      },
    };
  },
  inject: [ConfigService],
};
