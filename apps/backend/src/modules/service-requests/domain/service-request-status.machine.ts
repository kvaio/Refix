import { ServiceRequestStatus } from './service-request-status';

export const SERVICE_REQUEST_TRANSITIONS: Record<
  ServiceRequestStatus,
  readonly ServiceRequestStatus[]
> = {
  [ServiceRequestStatus.SOLICITADO]: [
    ServiceRequestStatus.AGENDADO,
    ServiceRequestStatus.CANCELADO,
  ],

  [ServiceRequestStatus.AGENDADO]: [ServiceRequestStatus.RECIBIDO],

  [ServiceRequestStatus.RECIBIDO]: [ServiceRequestStatus.EN_PROCESO],

  [ServiceRequestStatus.EN_PROCESO]: [
    ServiceRequestStatus.ESPERANDO_PIEZA,
    ServiceRequestStatus.LISTO_PARA_ENTREGA,
  ],

  [ServiceRequestStatus.ESPERANDO_PIEZA]: [ServiceRequestStatus.EN_PROCESO],

  [ServiceRequestStatus.LISTO_PARA_ENTREGA]: [ServiceRequestStatus.ENTREGADO],

  [ServiceRequestStatus.ENTREGADO]: [
    ServiceRequestStatus.EN_GARANTIA,
    ServiceRequestStatus.CERRADO,
  ],

  [ServiceRequestStatus.EN_GARANTIA]: [ServiceRequestStatus.RESUELTO],

  [ServiceRequestStatus.RESUELTO]: [ServiceRequestStatus.CERRADO],

  [ServiceRequestStatus.CANCELADO]: [],

  [ServiceRequestStatus.CERRADO]: [],
};

export function canTransition(
  currentStatus: ServiceRequestStatus,
  nextStatus: ServiceRequestStatus,
): boolean {
  return SERVICE_REQUEST_TRANSITIONS[currentStatus].includes(nextStatus);
}
