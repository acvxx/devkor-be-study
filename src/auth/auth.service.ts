import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { hash, compare } from 'bcrypt';
import { Prisma, PrismaClient, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SigninDto } from './dto/signin.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly mailerService: MailerService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}
  saltOrRounds = 10;
  async refreshJWT(id: number, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (user.refreshToken !== refreshToken)
      throw new UnauthorizedException('invalid refresh token');
    const payload = { email: user.email };
    const token = this.jwtService.sign(payload, {
      expiresIn: '1h',
      secret: process.env.JWT_SECRET,
    });
    const newRefreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
      secret: process.env.JWT_SECRET_REFRESH,
    });
    await this.prisma.user.update({
      where: { email: user.email },
      data: { refreshToken: newRefreshToken },
    });
    return token;
  }

  async signUp(info: SignupDto) {
    const { email, nickname, password } = info;
    const verify = await this.prisma.verification.findUnique({
      where: { email, purpose: '가입' },
    });
    const existUser = await this.prisma.user.findUnique({ where: { email } });
    if (existUser) {
      throw new BadRequestException('이미 가입되어 있는 이메일입니다.');
    }
    if (verify === null || verify.verify === false) {
      throw new BadRequestException('이메일 인증을 먼저 진행해주세요.');
    }
    if (
      !/^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(
        password,
      )
    )
      throw new BadRequestException(
        '비밀번호는 영문, 숫자, 특수문자로 이루어져야 합니다.',
      );

    const hashPass = await hash(password, this.saltOrRounds);

    const user = await this.prisma.user.create({
      data: {
        email: email,
        nickname: nickname,
        password: hashPass,
      },
    });
    await this.prisma.verification.delete({
      where: {
        email: email,
        purpose: '가입',
      },
    });
    const payload = { email: user.email };
    const token = this.jwtService.sign(payload, {
      expiresIn: '1h',
      secret: process.env.JWT_SECRET,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
      secret: process.env.JWT_SECRET_REFRESH,
    });
    await this.prisma.user.update({
      where: { email: user.email },
      data: { refreshToken: refreshToken },
    });
    return token;
  }
  async signIn(info: SigninDto) {
    const { email, password } = info;

    const user = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) throw new BadRequestException('존재하지 않는 유저입니다.');

    const match = await compare(password, user.password);
    if (match) {
      const payload = { email: user.email };
      const token = this.jwtService.sign(payload, {
        expiresIn: '1h',
        secret: process.env.JWT_SECRET,
      });
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: '30d',
        secret: process.env.JWT_SECRET_REFRESH,
      });
      await this.prisma.user.update({
        where: { email: user.email },
        data: { refreshToken: refreshToken },
      });

      return token;
    } else {
      throw new BadRequestException('비밀번호가 올바르지 않습니다.');
    }
  }
  async deleteUser(userId: number) {
    const user = await this.prisma.user.delete({
      where: { id: userId },
    });
  }
  async sendVerificationCodeforSignUp(email: string) {
    const existVerification = await this.prisma.verification.findUnique({
      where: { email, purpose: '가입' },
    });
    const existEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existVerification) {
      throw new BadRequestException('이미 코드가 전송되었습니다.');
    }
    if (existEmail) {
      throw new BadRequestException('이미 가입된 이메일입니다.');
    }
    const code = Math.floor(100000 + Math.random() * 900000);
    const result = await this.mailerService.sendMail({
      to: email,
      subject: '[BE-STUDY] 이메일 인증 코드입니다.',
      text: `인증 코드: ${code}`,
    });
    const verification = await this.prisma.verification.create({
      data: { email: email, code: code, purpose: '가입' },
    });
    return verification;
  }

  async checkVerificationCodeforSignUp(email: string, code: number) {
    const verification = await this.prisma.verification.findUnique({
      where: { email, code, purpose: '가입' },
    });
    if (verification) {
      await this.prisma.verification.update({
        where: { email },
        data: { verify: true },
      });
      return '인증이 완료되었습니다.';
    }
    throw new BadRequestException('잘못된 비밀번호입니다.');
  }
  async changePW(email: string, password: string) {
    const verify = await this.prisma.verification.findUnique({
      where: { email: email, purpose: '변경' },
    });
    if (verify === null || verify.verify === false) {
      throw new BadRequestException('이메일 인증을 먼저 진행해주세요.');
    }
    if (
      !/^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(
        password,
      )
    )
      throw new BadRequestException(
        '비밀번호는 영문, 숫자, 특수문자로 이루어져야 합니다.',
      );

    const hashPass = await hash(password, this.saltOrRounds);

    const changedUser = await this.prisma.user.update({
      where: { email: email },
      data: { password: hashPass },
    });
    await this.prisma.verification.delete({
      where: {
        email: email,
        purpose: '변경',
      },
    });
    const payload = { email: changedUser.email };
    const token = this.jwtService.sign(payload, {
      expiresIn: '1h',
      secret: process.env.JWT_SECRET,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
      secret: process.env.JWT_SECRET_REFRESH,
    });
    await this.prisma.user.update({
      where: { email: changedUser.email },
      data: { refreshToken: refreshToken },
    });
    return token;
  }
  async sendVerificationCodeforChangePW(email: string) {
    const existVerification = await this.prisma.verification.findUnique({
      where: { email: email, purpose: '변경' },
    });
    if (existVerification) {
      throw new BadRequestException('이미 코드가 전송되었습니다.');
    }
    const code = Math.floor(100000 + Math.random() * 900000);
    const result = await this.mailerService.sendMail({
      to: email,
      subject: '[BE-STUDY] 비밀번호 변경을 위한 이메일 인증 코드입니다.',
      text: `인증 코드: ${code}`,
    });
    const verification = await this.prisma.verification.create({
      data: { email: email, code: code, purpose: '변경' },
    });
    return verification;
  }
  async checkVerificationCodeforChangePW(email: string, code: number) {
    const verification = await this.prisma.verification.findUnique({
      where: { email: email, code: code, purpose: '변경' },
    });
    if (verification) {
      await this.prisma.verification.update({
        where: { email: email },
        data: { verify: true },
      });
      return '인증이 완료되었습니다.';
    }
    throw new BadRequestException('잘못된 비밀번호입니다.');
  }
}
