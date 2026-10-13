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

  const admin = {
    id: 'admin-001',
    email: 'admin@test.com',
    role: 'ADMIN',
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
    const cancelled = service.reject(request.id, technician);
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
  it('no debe permitir que otro cliente consulte una solicitud ajena', () => {
    const request = service.create(createDto, client);

    const anotherClient = {
      id: 'client-002',
      email: 'client2@test.com',
      role: 'CLIENT',
    };

    expect(() => service.findOne(request.id, anotherClient)).toThrow(
      ForbiddenException,
    );
  });

  it('no debe permitir que otro técnico consulte una solicitud ajena', () => {
    const request = service.create(createDto, client);

    service.accept(request.id, technician);

    expect(() => service.findOne(request.id, anotherTechnician)).toThrow(
      ForbiddenException,
    );
  });

  it('no debe permitir que un cliente modifique el estado de una solicitud', () => {
    const request = service.create(createDto, client);

    service.accept(request.id, technician);

    expect(() =>
      service.updateStatus(
        request.id,
        {
          status: ServiceRequestStatus.RECIBIDO,
        },
        client,
      ),
    ).toThrow(ForbiddenException);
  });

  it('debe permitir que un administrador modifique el estado de una solicitud', () => {
    const request = service.create(createDto, client);

    service.accept(request.id, technician);

    const updated = service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.RECIBIDO,
      },
      admin,
    );

    expect(updated.status).toBe(ServiceRequestStatus.RECIBIDO);
  });

  it('no debe permitir que un técnico cree una solicitud', () => {
    expect(() => service.create(createDto, technician)).toThrow(
      ForbiddenException,
    );
  });

  it('no debe permitir que un cliente acepte una solicitud', () => {
    const request = service.create(createDto, client);

    expect(() => service.accept(request.id, client)).toThrow(
      ForbiddenException,
    );
  });

  it('no debe permitir que un cliente rechace una solicitud', () => {
    const request = service.create(createDto, client);

    expect(() => service.reject(request.id, client)).toThrow(
      ForbiddenException,
    );
  });

  it('debe registrar la creación de una solicitud en el historial', () => {
    const client = {
      id: 'client-history-1',
      email: 'client-history-1@test.com',
      role: 'CLIENT',
    };

    const request = service.create(
      {
        title: 'Laptop no enciende',
        description: 'La laptop dejó de encender.',
        deviceType: 'Laptop',
        latitude: 20.6534,
        longitude: -103.3496,
      },
      client,
    );

    const history = service.getHistory(request.id, client);

    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      serviceRequestId: request.id,
      previousStatus: null,
      newStatus: ServiceRequestStatus.SOLICITADO,
      actorId: client.id,
      actorRole: client.role,
    });
    expect(history[0].createdAt).toEqual(expect.any(String));
  });

  it('debe registrar cada transición en orden cronológico', () => {
    const client = {
      id: 'client-history-2',
      email: 'client-history-2@test.com',
      role: 'CLIENT',
    };

    const technician = {
      id: 'tech-history-2',
      email: 'tech-history-2@test.com',
      role: 'TECHNICIAN',
    };

    const request = service.create(
      {
        title: 'PC no da video',
        description: 'La computadora enciende pero no muestra imagen.',
        deviceType: 'PC',
        latitude: 20.6534,
        longitude: -103.3496,
      },
      client,
    );

    service.accept(request.id, technician);

    service.updateStatus(
      request.id,
      {
        status: ServiceRequestStatus.RECIBIDO,
      },
      technician,
    );

    const history = service.getHistory(request.id, client);

    expect(history).toHaveLength(3);

    expect(history[0]).toMatchObject({
      previousStatus: null,
      newStatus: ServiceRequestStatus.SOLICITADO,
      actorId: client.id,
      actorRole: client.role,
    });

    expect(history[1]).toMatchObject({
      previousStatus: ServiceRequestStatus.SOLICITADO,
      newStatus: ServiceRequestStatus.AGENDADO,
      actorId: technician.id,
      actorRole: technician.role,
    });

    expect(history[2]).toMatchObject({
      previousStatus: ServiceRequestStatus.AGENDADO,
      newStatus: ServiceRequestStatus.RECIBIDO,
      actorId: technician.id,
      actorRole: technician.role,
    });

    expect(new Date(history[0].createdAt).getTime()).toBeLessThanOrEqual(
      new Date(history[1].createdAt).getTime(),
    );

    expect(new Date(history[1].createdAt).getTime()).toBeLessThanOrEqual(
      new Date(history[2].createdAt).getTime(),
    );
  });

  it('debe permitir consultar el historial al cliente dueño', () => {
    const client = {
      id: 'client-history-3',
      email: 'client-history-3@test.com',
      role: 'CLIENT',
    };

    const request = service.create(
      {
        title: 'Monitor apagado',
        description: 'El monitor no enciende.',
        deviceType: 'Monitor',
        latitude: 20.6534,
        longitude: -103.3496,
      },
      client,
    );

    const history = service.getHistory(request.id, client);

    expect(history).toHaveLength(1);
  });

  it('debe permitir consultar el historial al técnico asignado', () => {
    const client = {
      id: 'client-history-4',
      email: 'client-history-4@test.com',
      role: 'CLIENT',
    };

    const technician = {
      id: 'tech-history-4',
      email: 'tech-history-4@test.com',
      role: 'TECHNICIAN',
    };

    const request = service.create(
      {
        title: 'Celular con falla',
        description: 'El celular se apaga solo.',
        deviceType: 'Celular',
        latitude: 20.6534,
        longitude: -103.3496,
      },
      client,
    );

    service.accept(request.id, technician);

    const history = service.getHistory(request.id, technician);

    expect(history).toHaveLength(2);
  });

  it('debe permitir consultar el historial al administrador', () => {
    const client = {
      id: 'client-history-5',
      email: 'client-history-5@test.com',
      role: 'CLIENT',
    };

    const admin = {
      id: 'admin-history-5',
      email: 'admin-history-5@test.com',
      role: 'ADMIN',
    };

    const request = service.create(
      {
        title: 'Tablet dañada',
        description: 'La pantalla dejó de responder.',
        deviceType: 'Tablet',
        latitude: 20.6534,
        longitude: -103.3496,
      },
      client,
    );

    const history = service.getHistory(request.id, admin);

    expect(history).toHaveLength(1);
  });

  it('no debe permitir consultar el historial a otro cliente', () => {
    const client = {
      id: 'client-history-6',
      email: 'client-history-6@test.com',
      role: 'CLIENT',
    };

    const anotherClient = {
      id: 'client-history-6-other',
      email: 'client-history-6-other@test.com',
      role: 'CLIENT',
    };

    const request = service.create(
      {
        title: 'Consola no enciende',
        description: 'La consola dejó de encender.',
        deviceType: 'Consola',
        latitude: 20.6534,
        longitude: -103.3496,
      },
      client,
    );

    expect(() => service.getHistory(request.id, anotherClient)).toThrowError(
      ForbiddenException,
    );
  });

  it('no debe permitir consultar el historial a otro técnico', () => {
    const client = {
      id: 'client-history-7',
      email: 'client-history-7@test.com',
      role: 'CLIENT',
    };

    const technician = {
      id: 'tech-history-7',
      email: 'tech-history-7@test.com',
      role: 'TECHNICIAN',
    };

    const anotherTechnician = {
      id: 'tech-history-7-other',
      email: 'tech-history-7-other@test.com',
      role: 'TECHNICIAN',
    };

    const request = service.create(
      {
        title: 'Impresora con falla',
        description: 'La impresora no imprime.',
        deviceType: 'Impresora',
        latitude: 20.6534,
        longitude: -103.3496,
      },
      client,
    );

    service.accept(request.id, technician);

    expect(() =>
      service.getHistory(request.id, anotherTechnician),
    ).toThrowError(ForbiddenException);
  });

  it('debe lanzar NotFoundException al consultar el historial de una solicitud inexistente', () => {
    const client = {
      id: 'client-history-8',
      email: 'client-history-8@test.com',
      role: 'CLIENT',
    };

    expect(() =>
      service.getHistory('123e4567-e89b-12d3-a456-426614174999', client),
    ).toThrowError(NotFoundException);
  });
});
