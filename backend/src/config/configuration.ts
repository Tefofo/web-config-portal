export interface AppConfig {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtl: string;
    refreshTtl: string;
  };
  seedDemoPassword: string;
}

/**
 * Typed configuration loader. Secrets come exclusively from environment
 * variables — never from source. See .env.example.
 */
export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:4200,http://localhost:4300',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '900s',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  seedDemoPassword: process.env.SEED_DEMO_PASSWORD ?? 'Password123!',
});
