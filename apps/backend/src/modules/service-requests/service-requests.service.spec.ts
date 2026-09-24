import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestStatus } from './domain/service-request-status';

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

  const createAcceptedRequest = () => {
    const request = service.create(createDto, client);

    service.accept(request.id, technician);

    return request;
  };

  it('debe crear una solicitud en estado SOLICITADO', () => {
    const request = service.create(createDto, client);

    expect(request.status).toBe(ServiceRequestStatus.SOLICITADO);

    expect(request.clientId).toBe(client.id);
    expect(request.technicianId).toBeNull();
  });

  it('un técnico debe poder aceptar una solicitud solicitada', () => {
    const request = service.create(createDto, client);

    const accepted = service.accept(request.id, technician);

    expect(accepted.status).toBe(ServiceRequestStatus.AGENDADO);

    expect(accepted.technicianId).toBe(technician.id);
  });

  it('debe poder cancelar una solicitud solicitada', () => {
    const request = service.create(createDto, client);

    const cancelled = service.reject(request.id);

    expect(cancelled.status).toBe(ServiceRequestStatus.CANCELADO);
  });

  it('no debe permitir aceptar una solicitud dos veces', () => {
    const request = service.create(createDto, client);

    service.accept(request.id, technician);

    expect(() => service.accept(request.id, anotherTechnician)).toThrow();
  });

  it('debe permitir AGENDADO → RECIBIDO', () => {
    const request = createAcceptedRequest();

    const updated = service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.RECIBIDO,
      },
      technician,
    );

    expect(updated.status).toBe(ServiceRequestStatus.RECIBIDO);
  });

  it('debe permitir RECIBIDO → EN_PROCESO', () => {
    const request = createAcceptedRequest();

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.RECIBIDO,
      },
      technician,
    );

    const updated = service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.EN_PROCESO,
      },
      technician,
    );

    expect(updated.status).toBe(ServiceRequestStatus.EN_PROCESO);
  });

  it('debe permitir EN_PROCESO → ESPERANDO_PIEZA', () => {
    const request = createAcceptedRequest();

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.RECIBIDO,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.EN_PROCESO,
      },
      technician,
    );

    const updated = service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.ESPERANDO_PIEZA,
      },
      technician,
    );

    expect(updated.status).toBe(ServiceRequestStatus.ESPERANDO_PIEZA);
  });

  it('debe permitir ESPERANDO_PIEZA → EN_PROCESO', () => {
    const request = createAcceptedRequest();

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.RECIBIDO,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.EN_PROCESO,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.ESPERANDO_PIEZA,
      },
      technician,
    );

    const updated = service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.EN_PROCESO,
      },
      technician,
    );

    expect(updated.status).toBe(ServiceRequestStatus.EN_PROCESO);
  });

  it('debe permitir EN_PROCESO → LISTO_PARA_ENTREGA', () => {
    const request = createAcceptedRequest();

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.RECIBIDO,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.EN_PROCESO,
      },
      technician,
    );

    const updated = service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.LISTO_PARA_ENTREGA,
      },
      technician,
    );

    expect(updated.status).toBe(ServiceRequestStatus.LISTO_PARA_ENTREGA);
  });

  it('debe permitir LISTO_PARA_ENTREGA → ENTREGADO', () => {
    const request = createAcceptedRequest();

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.RECIBIDO,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.EN_PROCESO,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.LISTO_PARA_ENTREGA,
      },
      technician,
    );

    const updated = service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.ENTREGADO,
      },
      technician,
    );

    expect(updated.status).toBe(ServiceRequestStatus.ENTREGADO);
  });

  it('debe permitir ENTREGADO → CERRADO', () => {
    const request = createAcceptedRequest();

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.RECIBIDO,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.EN_PROCESO,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.LISTO_PARA_ENTREGA,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.ENTREGADO,
      },
      technician,
    );

    const updated = service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.CERRADO,
      },
      technician,
    );

    expect(updated.status).toBe(ServiceRequestStatus.CERRADO);
  });

  it('debe permitir ENTREGADO → EN_GARANTIA', () => {
    const request = createAcceptedRequest();

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.RECIBIDO,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.EN_PROCESO,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.LISTO_PARA_ENTREGA,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.ENTREGADO,
      },
      technician,
    );

    const updated = service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.EN_GARANTIA,
      },
      technician,
    );

    expect(updated.status).toBe(ServiceRequestStatus.EN_GARANTIA);
  });

  it('debe permitir EN_GARANTIA → RESUELTO', () => {
    const request = createAcceptedRequest();

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.RECIBIDO,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.EN_PROCESO,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.LISTO_PARA_ENTREGA,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.ENTREGADO,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.EN_GARANTIA,
      },
      technician,
    );

    const updated = service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.RESUELTO,
      },
      technician,
    );

    expect(updated.status).toBe(ServiceRequestStatus.RESUELTO);
  });

  it('debe permitir RESUELTO → CERRADO', () => {
    const request = createAcceptedRequest();

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.RECIBIDO,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.EN_PROCESO,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.LISTO_PARA_ENTREGA,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.ENTREGADO,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.EN_GARANTIA,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.RESUELTO,
      },
      technician,
    );

    const updated = service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.CERRADO,
      },
      technician,
    );

    expect(updated.status).toBe(ServiceRequestStatus.CERRADO);
  });

  it('no debe permitir saltar directamente de SOLICITADO a CERRADO', () => {
    const request = service.create(createDto, client);

    expect(() =>
      service.updateStatus(
        request.id,
        {
          status: ServiceRequestStatus.CERRADO,
        },
        technician,
      ),
    ).toThrow();
  });

  it('no debe permitir saltar directamente de EN_PROCESO a CERRADO', () => {
    const request = createAcceptedRequest();

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.RECIBIDO,
      },
      technician,
    );

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.EN_PROCESO,
      },
      technician,
    );

    expect(() =>
      service.updateStatus(
        request.id,
        {
          status: ServiceRequestStatus.CERRADO,
        },
        technician,
      ),
    ).toThrow();
  });

  it('no debe permitir que otro técnico modifique una solicitud', () => {
    const request = createAcceptedRequest();

    expect(() =>
      service.updateStatus(
        request.id,
        {
          status: ServiceRequestStatus.RECIBIDO,
        },
        anotherTechnician,
      ),
    ).toThrow(ForbiddenException);
  });

  it('debe lanzar NotFoundException para una solicitud inexistente', () => {
    expect(() => service.findOne('does-not-exist', client)).toThrow(
      NotFoundException,
    );
  });
});
