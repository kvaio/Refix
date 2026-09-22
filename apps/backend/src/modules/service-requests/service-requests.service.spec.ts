import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { ServiceRequestsService } from './service-requests.service';
import {
  ServiceRequestStatus,
} from './dto/update-service-request-status.dto';

describe('ServiceRequestsService', () => {
  let service: ServiceRequestsService;

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

  const anotherTechnician = {
    id: 'tech-002',
    email: 'tech2@test.com',
    role: 'TECHNICIAN',
  };

  const createDto = {
    title: 'Laptop no enciende',
    description: 'La laptop dejó de encender.',
    deviceType: 'Laptop',
    latitude: 20.6534,
    longitude: -103.3496,
  };

  beforeEach(() => {
    service = new ServiceRequestsService();
  });

  it('debe crear una solicitud en estado PENDING', () => {
    const request = service.create(
      createDto,
      client,
    );

    expect(request.status).toBe(
      ServiceRequestStatus.PENDING,
    );

    expect(request.clientId).toBe(client.id);
    expect(request.technicianId).toBeNull();
  });

  it('un técnico debe poder aceptar una solicitud pendiente', () => {
    const request = service.create(
      createDto,
      client,
    );

    const accepted = service.accept(
      request.id,
      technician,
    );

    expect(accepted.status).toBe(
      ServiceRequestStatus.ACCEPTED,
    );

    expect(accepted.technicianId).toBe(
      technician.id,
    );
  });

  it('no debe permitir aceptar una solicitud dos veces', () => {
    const request = service.create(
      createDto,
      client,
    );

    service.accept(request.id, technician);

    expect(() =>
      service.accept(request.id, anotherTechnician),
    ).toThrow();
  });

  it('debe permitir ACCEPTED → IN_PROGRESS', () => {
    const request = service.create(
      createDto,
      client,
    );

    service.accept(request.id, technician);

    const updated = service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.IN_PROGRESS,
      },
      technician,
    );

    expect(updated.status).toBe(
      ServiceRequestStatus.IN_PROGRESS,
    );
  });

  it('debe permitir IN_PROGRESS → COMPLETED', () => {
    const request = service.create(
      createDto,
      client,
    );

    service.accept(request.id, technician);

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.IN_PROGRESS,
      },
      technician,
    );

    const completed = service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.COMPLETED,
      },
      technician,
    );

    expect(completed.status).toBe(
      ServiceRequestStatus.COMPLETED,
    );
  });

  it('no debe permitir saltar directamente de PENDING a COMPLETED', () => {
    const request = service.create(
      createDto,
      client,
    );

    expect(() =>
      service.updateStatus(
        request.id,
        {
          status: ServiceRequestStatus.COMPLETED,
        },
        technician,
      ),
    ).toThrow();
  });

  it('no debe permitir que otro técnico modifique una solicitud', () => {
    const request = service.create(
      createDto,
      client,
    );

    service.accept(request.id, technician);

    expect(() =>
      service.updateStatus(
        request.id,
        {
          status: ServiceRequestStatus.IN_PROGRESS,
        },
        anotherTechnician,
      ),
    ).toThrow(ForbiddenException);
  });

  it('debe lanzar NotFoundException para una solicitud inexistente', () => {
    expect(() =>
      service.findOne('does-not-exist', client),
    ).toThrow(NotFoundException);
  });
});