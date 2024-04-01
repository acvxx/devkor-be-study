import { BadRequestException, Injectable } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly mailerService: MailerService,
    private prisma: PrismaService,
  ) {}
  async signUp(info: SignupDto) {
    const { email, nickname, password } = info;
    // if (!/^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[@$!%*#?&]){8,}$/.test(password))
    //   throw new BadRequestException(
    //     '비밀번호는 영문, 숫자, 특수문자로 이루어져야 합니다.',
    //   );
    const result = await this.mailerService.sendMail({
      to: email,
      subject: 'Test email',
      text: 'Hello, world!',
    });
    this.sendEmail(email);
    const user = this.prisma.user.create({
      data: info,
    });
  }
  async sendEmail(email: string) {
    const result = await this.mailerService.sendMail({
      to: email,
      subject: 'Test email',
      text: 'Hello, world!',
    });
    console.log(result);
  }
}
