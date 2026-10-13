import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestStatus } from './domain/service-request-status';
import { ServiceRequestStatus } from './dto/update-service-request-status.dto';

describe('ServiceRequestsController', () => {
  let controller: ServiceRequestsController;

  const serviceMock = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    accept: vi.fn(),
    reject: vi.fn(),
    updateStatus: vi.fn(),
    getHistory: vi.fn(),
  };

  const clientRequest = {
    user: {
      id: 'client-001',
      email: 'client@test.com',
      role: 'CLIENT',
    },
  };

  const technicianRequest = {
    user: {
      id: 'tech-001',
      email: 'tech@test.com',
      role: 'TECHNICIAN',
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceRequestsController],
      providers: [
        {
          provide: ServiceRequestsService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<ServiceRequestsController>(
      ServiceRequestsController,
    );
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe delegar la creación de una solicitud al servicio', () => {
    const dto = {
      title: 'Laptop no enciende',
      description: 'La laptop dejó de encender después de conectarla.',
      deviceType: 'Laptop',
      latitude: 20.6534,
      longitude: -103.3496,
    };

    const expected = {
      id: 'request-001',
      status: ServiceRequestStatus.SOLICITADO,
    };

    serviceMock.create.mockReturnValue(expected);

    const result = controller.create(dto, clientRequest as never);

    expect(serviceMock.create).toHaveBeenCalledWith(dto, clientRequest.user);
    expect(result).toBe(expected);
  });

  it('debe delegar la consulta de todas las solicitudes', () => {
    const expected = [];

    serviceMock.findAll.mockReturnValue(expected);

    const result = controller.findAll(technicianRequest as never);

    expect(serviceMock.findAll).toHaveBeenCalledWith(technicianRequest.user);
    expect(result).toBe(expected);
  });

  it('debe delegar la consulta de una solicitud por ID', () => {
    const expected = {
      id: 'request-001',
      status: ServiceRequestStatus.AGENDADO,
    };

    serviceMock.findOne.mockReturnValue(expected);

    const result = controller.findOne('request-001', clientRequest as never);

    expect(serviceMock.findOne).toHaveBeenCalledWith(
      'request-001',
      clientRequest.user,
    );
    expect(result).toBe(expected);
  });

  it('debe delegar la aceptación de una solicitud', () => {
    const expected = {
      id: 'request-001',
      status: ServiceRequestStatus.AGENDADO,
      technicianId: 'tech-001',
    };

    serviceMock.accept.mockReturnValue(expected);

    const result = controller.accept('request-001', technicianRequest as never);

    expect(serviceMock.accept).toHaveBeenCalledWith(
      'request-001',
      technicianRequest.user,
    );
    expect(result).toBe(expected);
  });

  it('debe delegar el rechazo de una solicitud', () => {
    const expected = {
      id: 'request-001',
      status: ServiceRequestStatus.CANCELADO,
    };
    serviceMock.reject.mockReturnValue(expected);
    const result = controller.reject('request-001', technicianRequest as never);
    expect(serviceMock.reject).toHaveBeenCalledWith(
      'request-001',
      technicianRequest.user,
    );
    expect(result).toBe(expected);
  });

  it('debe delegar la actualización de estado', () => {
    const dto = {
      status: ServiceRequestStatus.EN_PROCESO,
    };

    const expected = {
      id: 'request-001',
      status: ServiceRequestStatus.EN_PROCESO,
    };

    serviceMock.updateStatus.mockReturnValue(expected);

    const result = controller.updateStatus(
      'request-001',
      dto,
      technicianRequest as never,
    );

    expect(serviceMock.updateStatus).toHaveBeenCalledWith(
      'request-001',
      dto,
      technicianRequest.user,
    );

    expect(result).toBe(expected);
  });

  it('debe delegar la consulta del historial al servicio', () => {
    const expected = [
      {
        id: 'history-1',
        serviceRequestId: '123e4567-e89b-12d3-a456-426614174000',
        previousStatus: null,
        newStatus: ServiceRequestStatus.SOLICITADO,
        actorId: clientRequest.user.id,
        actorRole: clientRequest.user.role,
        createdAt: '2026-09-24T00:00:00.000Z',
      },
    ];

    serviceMock.getHistory.mockReturnValue(expected);

    const result = controller.getHistory(
      '123e4567-e89b-12d3-a456-426614174000',
      clientRequest as never,
    );

    expect(serviceMock.getHistory).toHaveBeenCalledWith(
      '123e4567-e89b-12d3-a456-426614174000',
      clientRequest.user,
    );

    expect(result).toBe(expected);
  });
});
