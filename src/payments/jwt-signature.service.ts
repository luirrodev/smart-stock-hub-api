import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface PayloadSignatureToken {}

@Injectable()
export class JwtSignatureService {
  private readonly logger = new Logger(JwtSignatureService.name);

  constructor(private readonly jwtService: JwtService) {}

  /** Firma un payload y devuelve el token JWT. */
  sign(payload: Record<string, any>, expiresIn = '30m'): string {
    return this.jwtService.sign(payload, { expiresIn });
  }

  /** Verifica un token JWT y devuelve el payload. Lanza BadRequestException si no es válido */
  verify(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch (err) {
      this.logger.warn('Invalid or expired signature');
      throw new BadRequestException('Invalid or expired signature');
    }
  }
}
