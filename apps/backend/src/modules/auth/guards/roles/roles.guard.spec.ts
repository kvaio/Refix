import {
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { vi } from 'vitest';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(),
    } as unknown as Reflector;

    guard = new RolesGuard(reflector);
  });

  const createContext = (user?: {
    id: string;
    email: string;
    role: string;
  }) =>
    ({
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
    }) as any;

  it('debe permitir el acceso cuando no se requieren roles', () => {
    vi.spyOn(
      reflector,
      'getAllAndOverride',
    ).mockReturnValue(undefined);

    expect(
      guard.canActivate(createContext()),
    ).toBe(true);
  });

  it('debe permitir el acceso cuando el usuario tiene el rol requerido', () => {
    vi.spyOn(
      reflector,
      'getAllAndOverride',
    ).mockReturnValue(['TECHNICIAN']);

    expect(
      guard.canActivate(
        createContext({
          id: 'tech-001',
          email: 'tech@refix.com',
          role: 'TECHNICIAN',
        }),
      ),
    ).toBe(true);
  });

  it('debe rechazar al usuario cuando su rol no está permitido', () => {
    vi.spyOn(
      reflector,
      'getAllAndOverride',
    ).mockReturnValue(['TECHNICIAN']);

    expect(() =>
      guard.canActivate(
        createContext({
          id: 'client-001',
          email: 'client@refix.com',
          role: 'CLIENT',
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('debe rechazar el acceso cuando no existe usuario autenticado', () => {
    vi.spyOn(
      reflector,
      'getAllAndOverride',
    ).mockReturnValue(['CLIENT']);

    expect(() =>
      guard.canActivate(createContext()),
    ).toThrow(ForbiddenException);
  });

  it('debe permitir cualquiera de los roles requeridos', () => {
    vi.spyOn(
      reflector,
      'getAllAndOverride',
    ).mockReturnValue([
      'TECHNICIAN',
      'ADMIN',
    ]);

    expect(
      guard.canActivate(
        createContext({
          id: 'admin-001',
          email: 'admin@refix.com',
          role: 'ADMIN',
        }),
      ),
    ).toBe(true);
  });
});