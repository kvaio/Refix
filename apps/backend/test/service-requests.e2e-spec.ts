import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import { vi } from 'vitest';

import configuration from '../src/config/configuration';
import { AuthModule } from '../src/modules/auth/auth.module';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth/jwt-auth.guard';
import { ServiceRequestStatus } from '../src/modules/service-requests/domain/service-request-status';
import { ServiceRequestsModule } from '../src/modules/service-requests/service-requests.module';
import { ServiceRequestsService } from '../src/modules/service-requests/service-requests.service';

describe('ServiceRequests API (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  const serviceMock = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    accept: vi.fn(),
    reject: vi.fn(),
    updateStatus: vi.fn(),
    getHistory: vi.fn(),
  };

  const client = {
    id: 'client-001',
    email: 'client@test.com',
    role: 'CLIENT',
  };

  const technician = {
    id: 'tech-001',
    email: 'tech@test.com',
    role: 'TECHNICIAN',
  };

  const admin = {
    id: 'admin-001',
    email: 'admin@test.com',
    role: 'ADMIN',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        AuthModule,
        ServiceRequestsModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
      ],
    })
      .overrideProvider(ServiceRequestsService)
      .useValue(serviceMock)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.setGlobalPrefix('api');

    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  const createToken = (
    user: typeof client | typeof technician | typeof admin,
  ) => {
    return jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();

    serviceMock.create.mockReturnValue({
      id: '123e4567-e89b-12d3-a456-426614174000',
      clientId: client.id,
      technicianId: null,
      title: 'Laptop no enciende',
      description: 'La laptop dejó de encender después de conectarla.',
      deviceType: 'Laptop',
      latitude: 20.6534,
      longitude: -103.3496,
      status: ServiceRequestStatus.SOLICITADO,
    });

    serviceMock.findAll.mockReturnValue([]);

    serviceMock.findOne.mockReturnValue({
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: ServiceRequestStatus.AGENDADO,
    });

    serviceMock.accept.mockReturnValue({
      id: '123e4567-e89b-12d3-a456-426614174000',
      technicianId: technician.id,
      status: ServiceRequestStatus.AGENDADO,
    });

    serviceMock.reject.mockReturnValue({
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: ServiceRequestStatus.CANCELADO,
    });

    serviceMock.updateStatus.mockImplementation((_id, dto) => ({
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: dto.status,
    }));

    serviceMock.getHistory.mockReturnValue([
      {
        id: 'history-1',
        serviceRequestId: '123e4567-e89b-12d3-a456-426614174000',
        previousStatus: null,
        newStatus: ServiceRequestStatus.SOLICITADO,
        actorId: client.id,
        actorRole: client.role,
        createdAt: '2026-09-24T00:00:00.000Z',
      },
    ]);
  });

  it('debe permitir consultar el historial de una solicitud', async () => {
    const token = createToken(client);

    const response = await request(app.getHttpServer())
      .get('/api/service-requests/123e4567-e89b-12d3-a456-426614174000/history')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveLength(1);

    expect(response.body[0]).toMatchObject({
      serviceRequestId: '123e4567-e89b-12d3-a456-426614174000',
      previousStatus: null,
      newStatus: ServiceRequestStatus.SOLICITADO,
      actorId: client.id,
      actorRole: client.role,
    });

    expect(serviceMock.getHistory).toHaveBeenCalledWith(
      '123e4567-e89b-12d3-a456-426614174000',
      expect.objectContaining({
        id: client.id,
        role: client.role,
      }),
    );
  });

  it('debe rechazar la consulta del historial sin JWT', async () => {
    await request(app.getHttpServer())
      .get('/api/service-requests/123e4567-e89b-12d3-a456-426614174000/history')
      .expect(401);

    expect(serviceMock.getHistory).not.toHaveBeenCalled();
  });

  it('debe rechazar la consulta del historial con un UUID inválido', async () => {
    const token = createToken(client);

    await request(app.getHttpServer())
      .get('/api/service-requests/no-es-un-uuid/history')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(serviceMock.getHistory).not.toHaveBeenCalled();
  });

  it('debe crear una solicitud válida', async () => {
    const token = createToken(client);

    await request(app.getHttpServer())
      .post('/api/service-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Laptop no enciende',
        description: 'La laptop dejó de encender después de conectarla.',
        deviceType: 'Laptop',
        latitude: 20.6534,
        longitude: -103.3496,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe(ServiceRequestStatus.SOLICITADO);
      });

    expect(serviceMock.create).toHaveBeenCalledTimes(1);
  });

  it('debe rechazar una solicitud sin JWT', async () => {
    await request(app.getHttpServer()).get('/api/service-requests').expect(401);
  });

  it('debe rechazar la creación si el DTO es inválido', async () => {
    const token = createToken(client);

    await request(app.getHttpServer())
      .post('/api/service-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'PC',
        description: 'Falla',
        deviceType: 'Laptop',
        latitude: 999,
        longitude: -103.3496,
      })
      .expect(400);

    expect(serviceMock.create).not.toHaveBeenCalled();
  });

  it('debe rechazar la creación si el rol no es CLIENT', async () => {
    const token = createToken(technician);

    await request(app.getHttpServer())
      .post('/api/service-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Laptop no enciende',
        description: 'La laptop dejó de encender después de conectarla.',
        deviceType: 'Laptop',
        latitude: 20.6534,
        longitude: -103.3496,
      })
      .expect(403);

    expect(serviceMock.create).not.toHaveBeenCalled();
  });

  it('debe rechazar un UUID inválido', async () => {
    const token = createToken(client);

    await request(app.getHttpServer())
      .get('/api/service-requests/no-es-un-uuid')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(serviceMock.findOne).not.toHaveBeenCalled();
  });

  it('debe permitir que un técnico acepte una solicitud', async () => {
    const token = createToken(technician);

    await request(app.getHttpServer())
      .patch(
        '/api/service-requests/123e4567-e89b-12d3-a456-426614174000/accept',
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe(ServiceRequestStatus.AGENDADO);
        expect(body.technicianId).toBe(technician.id);
      });

    expect(serviceMock.accept).toHaveBeenCalledWith(
      '123e4567-e89b-12d3-a456-426614174000',
      technician,
    );
  });

  it('debe rechazar propiedades no permitidas en el DTO', async () => {
    const token = createToken(client);

    await request(app.getHttpServer())
      .post('/api/service-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Laptop no enciende',
        description: 'La laptop dejó de encender después de conectarla.',
        deviceType: 'Laptop',
        latitude: 20.6534,
        longitude: -103.3496,
        propiedadInventada: 'no debería existir',
      })
      .expect(400);

    expect(serviceMock.create).not.toHaveBeenCalled();
  });

  it('debe rechazar un estado inexistente', async () => {
    const token = createToken(technician);

    await request(app.getHttpServer())
      .patch(
        '/api/service-requests/123e4567-e89b-12d3-a456-426614174000/status',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'ESTADO_QUE_NO_EXISTE',
      })
      .expect(400);

    expect(serviceMock.updateStatus).not.toHaveBeenCalled();
  });

  it('debe rechazar una actualización de estado sin JWT', async () => {
    await request(app.getHttpServer())
      .patch(
        '/api/service-requests/123e4567-e89b-12d3-a456-426614174000/status',
      )
      .send({
        status: ServiceRequestStatus.EN_PROCESO,
      })
      .expect(401);

    expect(serviceMock.updateStatus).not.toHaveBeenCalled();
  });

  it('debe rechazar una solicitud y marcarla como CANCELADO', async () => {
    const token = createToken(technician);

    await request(app.getHttpServer())
      .patch(
        '/api/service-requests/123e4567-e89b-12d3-a456-426614174000/reject',
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe(ServiceRequestStatus.CANCELADO);
      });

    expect(serviceMock.reject).toHaveBeenCalledWith(
      '123e4567-e89b-12d3-a456-426614174000',
      technician,
    );
  });

  it('debe impedir que un cliente acepte una solicitud', async () => {
    const token = createToken(client);

    await request(app.getHttpServer())
      .patch(
        '/api/service-requests/123e4567-e89b-12d3-a456-426614174000/accept',
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(serviceMock.accept).not.toHaveBeenCalled();
  });

  it('debe impedir que un cliente rechace una solicitud', async () => {
    const token = createToken(client);

    await request(app.getHttpServer())
      .patch(
        '/api/service-requests/123e4567-e89b-12d3-a456-426614174000/reject',
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(serviceMock.reject).not.toHaveBeenCalled();
  });

  it('debe impedir que un cliente actualice el estado', async () => {
    const token = createToken(client);

    await request(app.getHttpServer())
      .patch(
        '/api/service-requests/123e4567-e89b-12d3-a456-426614174000/status',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: ServiceRequestStatus.RECIBIDO,
      })
      .expect(403);

    expect(serviceMock.updateStatus).not.toHaveBeenCalled();
  });

  it('debe impedir que un técnico cree una solicitud', async () => {
    const token = createToken(technician);

    await request(app.getHttpServer())
      .post('/api/service-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Laptop no enciende',
        description: 'La laptop dejó de encender después de conectarla.',
        deviceType: 'Laptop',
        latitude: 20.6534,
        longitude: -103.3496,
      })
      .expect(403);

    expect(serviceMock.create).not.toHaveBeenCalled();
  });

  it('debe rechazar una aceptación sin JWT', async () => {
    await request(app.getHttpServer())
      .patch(
        '/api/service-requests/123e4567-e89b-12d3-a456-426614174000/accept',
      )
      .expect(401);

    expect(serviceMock.accept).not.toHaveBeenCalled();
  });

  it('debe permitir que un administrador actualice el estado', async () => {
    const token = createToken(admin);

    await request(app.getHttpServer())
      .patch(
        '/api/service-requests/123e4567-e89b-12d3-a456-426614174000/status',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: ServiceRequestStatus.RECIBIDO,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe(ServiceRequestStatus.RECIBIDO);
      });

    expect(serviceMock.updateStatus).toHaveBeenCalledWith(
      '123e4567-e89b-12d3-a456-426614174000',
      {
        status: ServiceRequestStatus.RECIBIDO,
      },
      admin,
    );
  });
});
