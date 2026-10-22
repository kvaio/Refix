import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const role = dto.role ?? 'CLIENT';
    const fullName = [dto.firstNames, dto.paternalSurname, dto.maternalSurname]
      .map((part) => part.trim())
      .join(' ');
    const technicianAddress = [
      `${dto.street.trim()} ${dto.exteriorNumber.trim()}`,
      dto.interiorNumber?.trim(),
      dto.neighborhood.trim(),
      dto.municipality.trim(),
      dto.state.trim(),
      dto.postalCode?.trim(),
    ]
      .filter(Boolean)
      .join(', ');

    if (role === 'TECHNICIAN' && !dto.technicianProfile) {
      throw new BadRequestException(
        'Para crear una cuenta de técnico debes completar tu ubicación y perfil.',
      );
    }

    if (role === 'CLIENT' && dto.technicianProfile) {
      throw new BadRequestException(
        'El perfil técnico solo se puede crear para cuentas de técnico.',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }

    const passwordHash = await hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: fullName,
        firstNames: dto.firstNames.trim(),
        paternalSurname: dto.paternalSurname.trim(),
        maternalSurname: dto.maternalSurname.trim(),
        birthDate: new Date(`${dto.birthDate}T00:00:00.000Z`),
        sex: dto.sex,
        street: dto.street.trim(),
        exteriorNumber: dto.exteriorNumber.trim(),
        interiorNumber: dto.interiorNumber?.trim() || null,
        neighborhood: dto.neighborhood.trim(),
        municipality: dto.municipality.trim(),
        state: dto.state.trim(),
        postalCode: dto.postalCode?.trim() || null,
        email,
        password: passwordHash,
        phone: dto.phone?.trim() || null,
        role,
        ...(role === 'TECHNICIAN' && dto.technicianProfile
          ? {
              technicianProfile: {
                create: {
                  bio: dto.technicianProfile.bio.trim(),
                  profession: dto.technicianProfile.profession.trim(),
                  yearsExperience: dto.technicianProfile.yearsExperience,
                  certifications: dto.technicianProfile.certifications?.trim() || null,
                  address: technicianAddress,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    const access_token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { access_token, user };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await compare(dto.password, user.password))) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Esta cuenta está suspendida. Contacta al administrador.');
    }

    const access_token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }
}
