declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Database Configuration
      DATABASE_PATH?: string;

      // Application Configuration
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: number;
    }
  }
}

export {};
