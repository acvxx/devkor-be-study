import {
  ExecutionContext,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { JwtPayload } from './auth/dto/jwtpayload.dto';

export const User = createParamDecorator(
  (_: unknown, cts: ExecutionContext): JwtPayload => {
    const request = cts.switchToHttp().getRequest();
    if (!request.user) throw new UnauthorizedException();
    return request.user;
  },
);
