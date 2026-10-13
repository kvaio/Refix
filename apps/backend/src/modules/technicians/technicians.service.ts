import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

export interface Technician {
  id: string;
  name: string;
  specialty: string;
  latitude: number;
  longitude: number;
  available: boolean;
}

@Injectable()
export class TechniciansService {
  private readonly technicians: Technician[] = [
    {
      id: 'tech-001',
      name: 'Técnico Demo 1',
      specialty: 'Laptops',
      latitude: 20.6534,
      longitude: -103.3496,
      available: true,
    },
    {
      id: 'tech-002',
      name: 'Técnico Demo 2',
      specialty: 'PCs de escritorio',
      latitude: 20.662,
      longitude: -103.34,
      available: true,
    },
    {
      id: 'tech-003',
      name: 'Técnico Demo 3',
      specialty: 'Celulares',
      latitude: 20.64,
      longitude: -103.36,
      available: false,
    },
  ];

  findAll() {
    return this.technicians;
  }

  findOne(id: string) {
    const technician = this.technicians.find(
      (item) => item.id === id,
    );

    if (!technician) {
      throw new NotFoundException(
        'Técnico no encontrado',
      );
    }

    return technician;
  }

  findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ) {
    return this.technicians
      .filter((technician) => technician.available)
      .map((technician) => ({
        ...technician,
        distanceKm: this.calculateDistance(
          latitude,
          longitude,
          technician.latitude,
          technician.longitude,
        ),
      }))
      .filter(
        (technician) => technician.distanceKm <= radiusKm,
      )
      .sort(
        (a, b) => a.distanceKm - b.distanceKm,
      );
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const earthRadiusKm = 6371;

    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;

    const deltaLat =
      ((lat2 - lat1) * Math.PI) / 180;

    const deltaLon =
      ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLon / 2) ** 2;

    const c =
      2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a),
      );

    return Number((earthRadiusKm * c).toFixed(2));
  }
}