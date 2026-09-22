import {
  Controller,
  Get,
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
  @Get('me')
  @ApiOperation({
    summary: 'Obtener el usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Datos del usuario autenticado',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT inválido o ausente',
  })
  getMe(@Req() req: AuthenticatedRequest) {
    return {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    };
  }
}
