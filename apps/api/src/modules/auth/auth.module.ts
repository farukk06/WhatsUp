import {
  Body,
  Controller,
  Module,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, RegisterDto } from './auth.dto';
@Controller('auth')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('register') register(@Body() body: RegisterDto) {
    return this.auth.register(body);
  }
  @Post('login') login(@Body() body: LoginDto) {
    return this.auth.login(body);
  }
  @Post('refresh') refresh(@Body() body: RefreshDto) {
    return this.auth.refresh(body.refreshToken);
  }
  @Post('logout') logout(@Body() body: RefreshDto) {
    return this.auth.logout(body.refreshToken);
  }
}
@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_ACCESS_SECRET;
        if (
          !secret ||
          Buffer.byteLength(secret) < 32 ||
          secret.startsWith('replace_')
        )
          throw new Error(
            'JWT_ACCESS_SECRET must be a random secret of at least 32 bytes',
          );
        return {
          secret,
          signOptions: {
            algorithm: 'HS256' as const,
            expiresIn: 900,
            issuer: 'whatsup-api',
            audience: 'whatsup',
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
