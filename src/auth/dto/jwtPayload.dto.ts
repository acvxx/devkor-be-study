import { IsEmail } from 'class-validator';

export class JwtPayload {
  @IsEmail()
  email: string;
}
