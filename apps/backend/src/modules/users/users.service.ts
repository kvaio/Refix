import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateAdminAccountDto } from './dto/update-admin-account.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminDashboard(search?: string, role?: string, status?: string) {
    if (role && !Object.values(Role).includes(role as Role)) {
      throw new BadRequestException('Filtro de rol inválido.');
    }
    if (status && status !== 'active' && status !== 'suspended') {
      throw new BadRequestException('Filtro de estado inválido.');
    }

    const normalizedSearch = search?.trim();
    const where: Prisma.UserWhereInput = {
      ...(role ? { role: role as Role } : {}),
      ...(status ? { isActive: status === 'active' } : {}),
      ...(normalizedSearch
        ? {
            OR: [
              { name: { contains: normalizedSearch, mode: 'insensitive' } },
              { email: { contains: normalizedSearch, mode: 'insensitive' } },
              { phone: { contains: normalizedSearch, mode: 'insensitive' } },
              {
                technicianProfile: {
                  is: {
                    profession: { contains: normalizedSearch, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [accounts, total, clients, technicians, admins, active, suspended] =
      await Promise.all([
        this.prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
            firstNames: true,
            paternalSurname: true,
            maternalSurname: true,
            birthDate: true,
            sex: true,
            street: true,
            exteriorNumber: true,
            interiorNumber: true,
            neighborhood: true,
            municipality: true,
            state: true,
            postalCode: true,
            _count: {
              select: {
                serviceRequests: true,
                assignedServices: true,
                statusHistoryEntries: true,
                tradeInEstimates: true,
                chatbotLogs: true,
              },
            },
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
        }),
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: Role.CLIENT } }),
        this.prisma.user.count({ where: { role: Role.TECHNICIAN } }),
        this.prisma.user.count({ where: { role: Role.ADMIN } }),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { isActive: false } }),
      ]);

    return {
      metrics: { total, clients, technicians, admins, active, suspended },
      accounts: accounts.map((account) => ({
        ...account,
        canDelete:
          account._count.serviceRequests === 0 &&
          account._count.assignedServices === 0 &&
          account._count.statusHistoryEntries === 0 &&
          account._count.tradeInEstimates === 0 &&
          account._count.chatbotLogs === 0,
      })),
    };
  }

  async createAccount(dto: RegisterDto) {
    const role = dto.role ?? 'CLIENT';
    if (role === 'TECHNICIAN' && !dto.technicianProfile) {
      throw new BadRequestException('Completa el perfil profesional del técnico.');
    }
    if (role === 'CLIENT' && dto.technicianProfile) {
      throw new BadRequestException('Una cuenta de cliente no puede incluir perfil técnico.');
    }

    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email }, select: { id: true } })) {
      throw new ConflictException('Ya existe una cuenta con ese correo.');
    }

    const name = [dto.firstNames, dto.paternalSurname, dto.maternalSurname]
      .map((part) => part.trim())
      .join(' ');
    const address = this.buildAddress(dto);

    return this.prisma.user.create({
      data: {
        name,
        firstNames: dto.firstNames.trim(),
        paternalSurname: dto.paternalSurname.trim(),
        maternalSurname: dto.maternalSurname.trim(),
        birthDate: new Date(dto.birthDate + 'T00:00:00.000Z'),
        sex: dto.sex,
        email,
        password: await hash(dto.password, 12),
        phone: dto.phone?.trim() || null,
        role,
        street: dto.street.trim(),
        exteriorNumber: dto.exteriorNumber.trim(),
        interiorNumber: dto.interiorNumber?.trim() || null,
        neighborhood: dto.neighborhood.trim(),
        municipality: dto.municipality.trim(),
        state: dto.state.trim(),
        postalCode: dto.postalCode?.trim() || null,
        ...(role === 'TECHNICIAN' && dto.technicianProfile
          ? {
              technicianProfile: {
                create: {
                  profession: dto.technicianProfile.profession.trim(),
                  yearsExperience: dto.technicianProfile.yearsExperience,
                  certifications: dto.technicianProfile.certifications?.trim() || null,
                  bio: dto.technicianProfile.bio.trim(),
                  address,
                },
              },
            }
          : {}),
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
  }

  async updateAccount(accountId: string, dto: UpdateAdminAccountDto) {
    const account = await this.prisma.user.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        firstNames: true,
        paternalSurname: true,
        maternalSurname: true,
        street: true,
        exteriorNumber: true,
        interiorNumber: true,
        neighborhood: true,
        municipality: true,
        state: true,
        postalCode: true,
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
    if (!account) throw new NotFoundException('La cuenta no existe.');

    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      const duplicate = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (duplicate && duplicate.id !== accountId) {
        throw new ConflictException('Ese correo ya está registrado.');
      }
    }
    if (dto.technicianProfile && account.role !== Role.TECHNICIAN) {
      throw new BadRequestException('Solo las cuentas de técnico tienen datos profesionales.');
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.email !== undefined) data.email = dto.email.trim().toLowerCase();
    if (dto.password) data.password = await hash(dto.password, 12);
    if (dto.phone !== undefined) data.phone = dto.phone?.trim() || null;
    if (dto.firstNames !== undefined) data.firstNames = dto.firstNames.trim();
    if (dto.paternalSurname !== undefined) data.paternalSurname = dto.paternalSurname.trim();
    if (dto.maternalSurname !== undefined) data.maternalSurname = dto.maternalSurname.trim();
    if (dto.birthDate !== undefined) data.birthDate = new Date(dto.birthDate + 'T00:00:00.000Z');
    if (dto.sex !== undefined) data.sex = dto.sex;
    if (dto.street !== undefined) data.street = dto.street.trim();
    if (dto.exteriorNumber !== undefined) data.exteriorNumber = dto.exteriorNumber.trim();
    if (dto.interiorNumber !== undefined) data.interiorNumber = dto.interiorNumber?.trim() || null;
    if (dto.neighborhood !== undefined) data.neighborhood = dto.neighborhood.trim();
    if (dto.municipality !== undefined) data.municipality = dto.municipality.trim();
    if (dto.state !== undefined) data.state = dto.state.trim();
    if (dto.postalCode !== undefined) data.postalCode = dto.postalCode?.trim() || null;

    const firstNames = dto.firstNames?.trim() ?? account.firstNames;
    const paternalSurname = dto.paternalSurname?.trim() ?? account.paternalSurname;
    const maternalSurname = dto.maternalSurname?.trim() ?? account.maternalSurname;
    if (dto.firstNames !== undefined || dto.paternalSurname !== undefined || dto.maternalSurname !== undefined) {
      const fullName = [firstNames, paternalSurname, maternalSurname].filter(Boolean).join(' ');
      if (fullName) data.name = fullName;
    }

    const profile = dto.technicianProfile;
    const nextStreet = dto.street?.trim() ?? account.street;
    const nextExteriorNumber = dto.exteriorNumber?.trim() ?? account.exteriorNumber;
    const addressChanged =
      dto.street !== undefined || dto.exteriorNumber !== undefined ||
      dto.interiorNumber !== undefined || dto.neighborhood !== undefined ||
      dto.municipality !== undefined || dto.state !== undefined || dto.postalCode !== undefined;
    const profileAddress = addressChanged
      ? [
          nextStreet && nextExteriorNumber ? nextStreet + ' ' + nextExteriorNumber : nextStreet || nextExteriorNumber,
          dto.interiorNumber?.trim() ?? account.interiorNumber,
          dto.neighborhood?.trim() ?? account.neighborhood,
          dto.municipality?.trim() ?? account.municipality,
          dto.state?.trim() ?? account.state,
          dto.postalCode?.trim() ?? account.postalCode,
        ].filter(Boolean).join(', ')
      : undefined;

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: accountId }, data });
      if (profile) {
        const existing = account.technicianProfile;
        const profession = profile.profession?.trim() ?? existing?.profession;
        const yearsExperience = profile.yearsExperience ?? existing?.yearsExperience;
        const bio = profile.bio?.trim() ?? existing?.bio;
        if (!profession || yearsExperience === null || yearsExperience === undefined || !bio) {
          throw new BadRequestException('Completa profesión, experiencia y descripción para crear el perfil técnico.');
        }
        const profileData = {
          profession,
          yearsExperience,
          bio,
          certifications: profile.certifications === undefined
            ? existing?.certifications ?? null
            : profile.certifications?.trim() || null,
          ...(profileAddress !== undefined ? { address: profileAddress } : {}),
        };
        if (existing) {
          await tx.technicianProfile.update({ where: { userId: accountId }, data: profileData });
        } else {
          await tx.technicianProfile.create({
            data: { userId: accountId, ...profileData },
          });
        }
      }
    });

    return { id: account.id, updated: true };
  }

  async deleteAccount(accountId: string, adminId: string) {
    const account = await this.prisma.user.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        role: true,
        isActive: true,
        _count: {
          select: {
            serviceRequests: true,
            assignedServices: true,
            statusHistoryEntries: true,
            tradeInEstimates: true,
            chatbotLogs: true,
          },
        },
      },
    });
    if (!account) throw new NotFoundException('La cuenta no existe.');
    if (accountId === adminId) throw new ForbiddenException('No puedes eliminar tu propia cuenta.');

    if (account.role === Role.ADMIN && account.isActive) {
      const activeAdmins = await this.prisma.user.count({ where: { role: Role.ADMIN, isActive: true } });
      if (activeAdmins <= 1) {
        throw new ForbiddenException('No puedes eliminar al último administrador activo.');
      }
    }

    if (account._count.serviceRequests || account._count.assignedServices || account._count.statusHistoryEntries || account._count.tradeInEstimates || account._count.chatbotLogs) {
      throw new ConflictException('Esta cuenta tiene solicitudes o historial asociado. Suspéndela para conservar esos registros.');
    }

    await this.prisma.user.delete({ where: { id: accountId } });
    return { id: accountId, deleted: true };
  }

  async clearAccountServiceRequests(accountId: string) {
    const account = await this.prisma.user.findUnique({
      where: { id: accountId },
      select: { id: true, role: true },
    });
    if (!account) throw new NotFoundException('La cuenta no existe.');
    if (account.role === Role.ADMIN) {
      throw new BadRequestException('Solo se pueden limpiar pedidos de perfiles de cliente o técnico.');
    }

    return this.prisma.$transaction(async (tx) => {
      const requests = await tx.serviceRequest.findMany({
        where: { OR: [{ clientId: accountId }, { technicianId: accountId }] },
        select: { id: true, technicianId: true },
      });
      if (requests.length === 0) {
        return { id: accountId, deletedRequests: 0 };
      }

      const technicianIds = [
        ...new Set(
          requests
            .map((request) => request.technicianId)
            .filter((technicianId): technicianId is string => Boolean(technicianId)),
        ),
      ];
      const deleted = await tx.serviceRequest.deleteMany({
        where: { id: { in: requests.map((request) => request.id) } },
      });

      for (const technicianId of technicianIds) {
        const remainingReviews = await tx.review.aggregate({
          where: { serviceRequest: { technicianId } },
          _avg: { rating: true },
        });
        await tx.technicianProfile.updateMany({
          where: { userId: technicianId },
          data: { rating: remainingReviews._avg.rating ?? 0 },
        });
      }

      return { id: accountId, deletedRequests: deleted.count };
    });
  }

  async setAccountActive(accountId: string, isActive: boolean, adminId: string) {
    const account = await this.prisma.user.findUnique({
      where: { id: accountId },
      select: { id: true, role: true, isActive: true },
    });
    if (!account) throw new NotFoundException('La cuenta no existe.');
    if (!isActive && accountId === adminId) {
      throw new ForbiddenException('No puedes suspender tu propia cuenta.');
    }
    if (!isActive && account.role === Role.ADMIN && account.isActive) {
      const activeAdmins = await this.prisma.user.count({ where: { role: Role.ADMIN, isActive: true } });
      if (activeAdmins <= 1) {
        throw new ForbiddenException('No puedes suspender al último administrador activo.');
      }
    }
    return this.prisma.user.update({
      where: { id: accountId },
      data: { isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
  }

  private buildAddress(dto: RegisterDto): string {
    return [
      dto.street.trim() + ' ' + dto.exteriorNumber.trim(),
      dto.interiorNumber?.trim(),
      dto.neighborhood.trim(),
      dto.municipality.trim(),
      dto.state.trim(),
      dto.postalCode?.trim(),
    ].filter(Boolean).join(', ');
  }
}
