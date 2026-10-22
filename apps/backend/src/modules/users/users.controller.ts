import {
  BadRequestException,
  Body,
  Delete,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { RegisterDto } from '../auth/dto/register.dto';
import { SetAccountStatusDto } from './dto/set-account-status.dto';
import { UpdateAdminAccountDto } from './dto/update-admin-account.dto';
import { UsersService } from './users.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener el usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del usuario autenticado' })
  @ApiUnauthorizedResponse({ description: 'JWT inválido o ausente' })
  getMe(@Req() req: AuthenticatedRequest) {
    return { id: req.user.id, email: req.user.email, role: req.user.role };
  }

  @Get('admin/accounts')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Consultar cuentas para el panel de administración' })
  getAdminDashboard(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.usersService.getAdminDashboard(search, role, status);
  }

  @Post('admin/accounts')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear una cuenta de cliente o técnico' })
  createAccount(@Body() dto: RegisterDto) {
    return this.usersService.createAccount(dto);
  }

  @Patch('admin/accounts/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Editar los datos de una cuenta' })
  updateAccount(@Param('id') id: string, @Body() dto: UpdateAdminAccountDto) {
    return this.usersService.updateAccount(id, dto);
  }

  @Delete('admin/accounts/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar una cuenta sin historial operativo' })
  deleteAccount(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.usersService.deleteAccount(id, req.user.id);
  }

  @Delete('admin/accounts/:id/service-requests')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Borrar los pedidos de una cuenta y sus datos asociados' })
  clearAccountServiceRequests(@Param('id') id: string) {
    return this.usersService.clearAccountServiceRequests(id);
  }

  @Patch('admin/accounts/:id/status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Activar o suspender una cuenta' })
  setAccountStatus(
    @Param('id') id: string,
    @Body() dto: SetAccountStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (typeof dto.isActive !== 'boolean') {
      throw new BadRequestException('isActive debe ser verdadero o falso.');
    }
    return this.usersService.setAccountActive(id, dto.isActive, req.user.id);
  }
}
