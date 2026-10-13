import { Reflector } from '@nestjs/core';
import { vi } from 'vitest';

import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(),
    } as unknown as Reflector;

    guard = new JwtAuthGuard(reflector);
  });

  const createContext = () =>
    ({
      getHandler: vi.fn(),
      getClass: vi.fn(),
    }) as any;

  it('debe permitir una ruta marcada como pública', () => {
    vi.spyOn(
      reflector,
      'getAllAndOverride',
    ).mockReturnValue(true);

    expect(
      guard.canActivate(createContext()),
    ).toBe(true);
  });

  it('debe delegar la autenticación de una ruta protegida al guard JWT', () => {
    vi.spyOn(
      reflector,
      'getAllAndOverride',
    ).mockReturnValue(false);

    const parentPrototype = Object.getPrototypeOf(
      JwtAuthGuard.prototype,
    );

    const canActivateSpy = vi
      .spyOn(parentPrototype, 'canActivate')
      .mockReturnValue(true);

    expect(
      guard.canActivate(createContext()),
    ).toBe(true);

    expect(canActivateSpy).toHaveBeenCalled();

    canActivateSpy.mockRestore();
  });
});