import { IsString, IsEnum } from 'class-validator';
import { OAuthProvider } from '../../common/types/enums';

export class OAuthLoginDto {
  @IsEnum(OAuthProvider)
  provider: OAuthProvider;

  @IsString()
  code: string;
}

