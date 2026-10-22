import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateTechnicianProfileDto } from './dto/update-technician-profile.dto';

interface TechnicianProfileRecord {
  userId: string;
  bio: string | null;
  profession: string | null;
  yearsExperience: number | null;
  certifications: string | null;
  rating: number;
  isAvailable: boolean;
  latitude: number | null;
  longitude: number | null;
  user: {
    name: string;
  };
}

export interface Technician {
  id: string;
  name: string;
  bio: string | null;
  profession: string | null;
  yearsExperience: number | null;
  certifications: string | null;
  rating: number;
  available: boolean;
}

@Injectable()
export class TechniciansService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Technician[]> {
    const profiles = await this.prisma.technicianProfile.findMany({
      where: { user: { is: { isActive: true } } },
      include: { user: { select: { name: true } } },
      orderBy: [{ isAvailable: 'desc' }, { rating: 'desc' }],
    });

    return profiles.map((profile) => this.toTechnician(profile));
  }

  async findOne(id: string): Promise<Technician> {
    const profile = await this.prisma.technicianProfile.findUnique({
      where: { userId: id },
      include: { user: { select: { name: true, isActive: true } } },
    });

    if (!profile || !profile.user.isActive) {
      throw new NotFoundException('Perfil técnico no encontrado');
    }

    return this.toTechnician(profile);
  }

  async findNearby(latitude: number, longitude: number, radiusKm: number) {
    const profiles = await this.prisma.technicianProfile.findMany({
      where: { isAvailable: true, user: { is: { isActive: true } } },
      include: { user: { select: { name: true } } },
    });

    return profiles
      .filter((profile) => profile.latitude !== null && profile.longitude !== null)
      .map((profile) => ({
        ...this.toTechnician(profile),
        distanceKm: this.calculateDistance(
          latitude,
          longitude,
          profile.latitude!,
          profile.longitude!,
        ),
      }))
      .filter((technician) => technician.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async findMyProfile(userId: string) {
    const account = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        technicianProfile: {
          select: {
            profession: true,
            yearsExperience: true,
            certifications: true,
            bio: true,
            rating: true,
            isAvailable: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });
    if (!account || !account.technicianProfile) {
      throw new NotFoundException('No se encontró el perfil técnico de esta cuenta.');
    }
    return { ...account, profile: account.technicianProfile };
  }

  async updateMyProfile(userId: string, dto: UpdateTechnicianProfileDto) {
    const account = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        technicianProfile: {
          select: {
            profession: true,
            yearsExperience: true,
            certifications: true,
            bio: true,
          },
        },
      },
    });
    if (!account || account.role !== Role.TECHNICIAN) {
      throw new NotFoundException('No se encontró el perfil técnico de esta cuenta.');
    }

    const existing = account.technicianProfile;
    const profession = dto.profession?.trim() ?? existing?.profession;
    const yearsExperience = dto.yearsExperience ?? existing?.yearsExperience;
    const bio = dto.bio?.trim() ?? existing?.bio;
    if (!profession || yearsExperience === null || yearsExperience === undefined || !bio) {
      throw new BadRequestException('Completa profesión, experiencia y descripción profesional.');
    }

    const profileData = {
      profession,
      yearsExperience,
      bio,
      ...(dto.certifications !== undefined
        ? { certifications: dto.certifications?.trim() || null }
        : {}),
      ...(dto.isAvailable !== undefined ? { isAvailable: dto.isAvailable } : {}),
    };

    if (existing) {
      await this.prisma.technicianProfile.update({
        where: { userId },
        data: profileData,
      });
    } else {
      await this.prisma.technicianProfile.create({
        data: { userId, ...profileData },
      });
    }
    return this.findMyProfile(userId);
  }

  async findMyReviews(userId: string) {
    return this.prisma.review.findMany({
      where: { serviceRequest: { technicianId: userId } },
      include: {
        serviceRequest: {
          select: {
            title: true,
            client: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private toTechnician(profile: TechnicianProfileRecord): Technician {
    return {
      id: profile.userId,
      name: profile.user.name,
      bio: profile.bio,
      profession: profile.profession,
      yearsExperience: profile.yearsExperience,
      certifications: profile.certifications,
      rating: profile.rating,
      available: profile.isAvailable,
    };
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
    const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Number((earthRadiusKm * c).toFixed(2));
  }
}
