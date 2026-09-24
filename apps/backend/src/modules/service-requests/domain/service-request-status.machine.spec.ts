import {
  canTransition,
  SERVICE_REQUEST_TRANSITIONS,
} from './service-request-status.machine';
import { ServiceRequestStatus } from './service-request-status';

describe('ServiceRequestStatusMachine', () => {
  describe('transiciones válidas', () => {
    const validTransitions: Array<
      [ServiceRequestStatus, ServiceRequestStatus]
    > = [
      [ServiceRequestStatus.SOLICITADO, ServiceRequestStatus.AGENDADO],
      [ServiceRequestStatus.SOLICITADO, ServiceRequestStatus.CANCELADO],
      [ServiceRequestStatus.AGENDADO, ServiceRequestStatus.RECIBIDO],
      [ServiceRequestStatus.RECIBIDO, ServiceRequestStatus.EN_PROCESO],
      [ServiceRequestStatus.EN_PROCESO, ServiceRequestStatus.ESPERANDO_PIEZA],
      [ServiceRequestStatus.ESPERANDO_PIEZA, ServiceRequestStatus.EN_PROCESO],
      [
        ServiceRequestStatus.EN_PROCESO,
        ServiceRequestStatus.LISTO_PARA_ENTREGA,
      ],
      [ServiceRequestStatus.LISTO_PARA_ENTREGA, ServiceRequestStatus.ENTREGADO],
      [ServiceRequestStatus.ENTREGADO, ServiceRequestStatus.EN_GARANTIA],
      [ServiceRequestStatus.ENTREGADO, ServiceRequestStatus.CERRADO],
      [ServiceRequestStatus.EN_GARANTIA, ServiceRequestStatus.RESUELTO],
      [ServiceRequestStatus.RESUELTO, ServiceRequestStatus.CERRADO],
    ];

    it.each(validTransitions)(
      'debe permitir %s → %s',
      (currentStatus, nextStatus) => {
        expect(canTransition(currentStatus, nextStatus)).toBe(true);
      },
    );
  });

  describe('transiciones inválidas', () => {
    const invalidTransitions: Array<
      [ServiceRequestStatus, ServiceRequestStatus]
    > = [
      [ServiceRequestStatus.SOLICITADO, ServiceRequestStatus.RECIBIDO],
      [ServiceRequestStatus.SOLICITADO, ServiceRequestStatus.EN_PROCESO],
      [ServiceRequestStatus.SOLICITADO, ServiceRequestStatus.CERRADO],
      [ServiceRequestStatus.AGENDADO, ServiceRequestStatus.EN_PROCESO],
      [ServiceRequestStatus.RECIBIDO, ServiceRequestStatus.LISTO_PARA_ENTREGA],
      [ServiceRequestStatus.EN_PROCESO, ServiceRequestStatus.ENTREGADO],
      [ServiceRequestStatus.LISTO_PARA_ENTREGA, ServiceRequestStatus.CERRADO],
      [ServiceRequestStatus.ENTREGADO, ServiceRequestStatus.RESUELTO],
      [ServiceRequestStatus.EN_GARANTIA, ServiceRequestStatus.CERRADO],
      [ServiceRequestStatus.CERRADO, ServiceRequestStatus.EN_PROCESO],
      [ServiceRequestStatus.CANCELADO, ServiceRequestStatus.AGENDADO],
    ];

    it.each(invalidTransitions)(
      'debe rechazar %s → %s',
      (currentStatus, nextStatus) => {
        expect(canTransition(currentStatus, nextStatus)).toBe(false);
      },
    );
  });

  it('debe definir todas las transiciones para cada estado', () => {
    const statuses = Object.values(ServiceRequestStatus);

    for (const status of statuses) {
      expect(SERVICE_REQUEST_TRANSITIONS[status]).toBeDefined();
    }
  });

  it('CERRADO no debe tener transiciones posteriores', () => {
    expect(SERVICE_REQUEST_TRANSITIONS[ServiceRequestStatus.CERRADO]).toEqual(
      [],
    );
  });

  it('CANCELADO no debe tener transiciones posteriores', () => {
    expect(SERVICE_REQUEST_TRANSITIONS[ServiceRequestStatus.CANCELADO]).toEqual(
      [],
    );
  });
});
