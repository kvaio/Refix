import { ConfigService } from '@nestjs/config';

import { JwtStrategy } from './jwt';

describe('JwtStrategy', () => {
  const configService = {
    getOrThrow: (key: string) => {
      if (key === 'JWT_SECRET') {
        return 'test-secret';
      }

      throw new Error(`Configuración no encontrada: ${key}`);
    },
  } as unknown as ConfigService;

  it('should be defined', () => {
    const strategy = new JwtStrategy(configService);

    expect(strategy).toBeDefined();
  });

  it('should validate JWT payload', async () => {
    const strategy = new JwtStrategy(configService);

    const payload = {
      sub: 'user-001',
      email: 'test@refix.com',
      role: 'CLIENT',
    };

    await expect(
      strategy.validate(payload),
    ).resolves.toEqual({
      id: 'user-001',
      email: 'test@refix.com',
      role: 'CLIENT',
    });
  });
});