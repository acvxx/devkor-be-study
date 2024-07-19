import { Body, Controller, Delete, Post, Req, UseGuards } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/signin.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signUp')
  async signUp(@Body() body: SignupDto) {
    return await this.authService.signUp(body);
  }

  @Post('signIn')
  async signIn(@Body() body: SigninDto) {
    return await this.authService.signIn(body);
  }
  @Post('signUp/sendEmail')
  async sendVerificationforSignUp(@Body() body: any) {
    return await this.authService.sendVerificationCodeforSignUp(body.email);
  }
  @Post('signUp/checkEmail')
  async checkVerificationforSignUp(@Body() body: any) {
    return await this.authService.checkVerificationCodeforSignUp(
      body.email,
      body.code,
    );
  }

  @Post('changePW')
  async changePW(@Req() req: any, @Body() body: any) {
    return await this.authService.changePW(body.email, body.password);
  }

  @Post('changePW/sendEmail')
  async sendVerificationforChangePW(@Req() req: any) {
    return await this.authService.sendVerificationCodeforChangePW(
      req.body.email,
    );
  }
  @Post('changePW/checkEmail')
  async checkVerificationforChangePW(@Req() req: any, @Body() body: any) {
    return await this.authService.checkVerificationCodeforChangePW(
      body.email,
      body.code,
    );
  }

  @Delete('delete')
  @UseGuards(AuthGuard())
  async DeleteUser(@Req() req: any) {
    return await this.authService.deleteUser(req.user.id);
  }

  @Post('/refresh')
  @UseGuards(AuthGuard('refresh'))
  async refresh(@Req() req: any) {
    return await this.authService.refreshJWT(
      req.user.id,
      req.user.refreshToken,
    );
  }
}
