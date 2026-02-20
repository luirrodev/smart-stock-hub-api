import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

export interface PayloadSignatureToken {
  orderId: number;
  storeId: number;
}

@Injectable()
export class JwtSignatureService {
  private readonly logger = new Logger(JwtSignatureService.name);

  constructor(private readonly jwtService: JwtService) {}

  /** Firma un payload y devuelve el token JWT. */
  sign(payload: PayloadSignatureToken): string {
    const options: JwtSignOptions = {
      algorithm: 'HS256',
      expiresIn: '30m',
    };

    const token = this.jwtService.sign(payload, options);
    const safeToken = encodeURIComponent(token);
    return safeToken;
  }

  /** Verifica un token JWT y devuelve el payload. Lanza BadRequestException si no es válido */
  verify(token: string): any {
    const decodedToken = decodeURIComponent(token);
    try {
      return this.jwtService.verify(decodedToken, { algorithms: ['HS256'] });
    } catch (err) {
      throw new BadRequestException(
        'La firma proporcionada es inválida o ha caducado',
      );
    }
  }
}
