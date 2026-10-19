import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MaxLength, Matches } from 'class-validator';
export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;
  @IsString() @Length(12, 128) password: string;
}
export class RegisterDto extends LoginDto {
  @IsString() @Length(1, 80) @Matches(/\S/) displayName: string;
}
export class RefreshDto {
  @IsString() @Matches(/^[a-f0-9]{96}$/) refreshToken: string;
}
