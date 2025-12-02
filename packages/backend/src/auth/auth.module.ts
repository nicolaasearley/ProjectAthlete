import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_ACCESS_SECRET') 
          || process.env.JWT_ACCESS_SECRET 
          || 'default-secret-change-in-production';
        
        if (!secret || secret === 'default-secret-change-in-production') {
          console.warn('⚠️  WARNING: Using default JWT secret. Set JWT_ACCESS_SECRET in .env file!');
        }
        
        return {
          secret,
          signOptions: {
            expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES_IN') || process.env.JWT_ACCESS_EXPIRES_IN || '15m',
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshTokenStrategy],
  exports: [AuthService],
})
export class AuthModule {}
