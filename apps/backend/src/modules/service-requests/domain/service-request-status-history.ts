import { ServiceRequestStatus } from './service-request-status';

export interface ServiceRequestStatusHistory {
  id: string;
  serviceRequestId: string;
  previousStatus: ServiceRequestStatus | null;
  newStatus: ServiceRequestStatus;
  actorId: string;
  actorRole: string;
  createdAt: string;
}
