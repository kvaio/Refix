export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    environment: process.env.NODE_ENV ?? 'development',
  },
  security: {
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:8100',
  },
});