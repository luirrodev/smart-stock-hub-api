import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggingService } from 'src/logs/services/logging.service';

/**
 * Global Exception Filter que captura todos los errores no manejados
 * y los loguea automáticamente SIN BLOQUEAR la respuesta
 *
 * Los logs se emiten como eventos y se procesan en background
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private loggingService: LoggingService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Obtener información del request
    const status = this.getStatus(exception);
    const message = this.getMessage(exception);
    const exceptionType = this.getExceptionType(exception);
    const error =
      exception instanceof Error ? exception : new Error(String(exception));

    // El log se procesa en background vía eventos
    this.logErrorAsync(request, message, error, status, exceptionType);

    // ✅ Responder inmediatamente al cliente
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    };

    response.status(status).json(errorResponse);
  }

  /**
   * Log asincrónico sin bloquear
   * Se ejecuta en background después de responder al cliente
   */
  private logErrorAsync(
    request: Request,
    message: string,
    error: Error,
    status: number,
    exceptionType: string,
  ): void {
    // Usar setImmediate para ejecutar DESPUÉS de responder al cliente
    setImmediate(() => {
      try {
        const logContext = this.loggingService.createHttpContext(request);

        this.loggingService.error(
          `Unhandled Exception: ${message}`,
          logContext,
          error,
          {
            statusCode: status,
            exceptionType,
          },
        );
      } catch (loggingError) {
        // Si falla el logging, solo log fallback (no afecta cliente)
        this.logger.error(
          'Error logging exception:',
          loggingError instanceof Error
            ? loggingError.message
            : String(loggingError),
        );
      }
    });
  }

  /**
   * Obtiene el tipo real del exception
   * Debe llamarse ANTES de normalizar a Error
   */
  private getExceptionType(exception: unknown): string {
    if (exception instanceof HttpException) {
      return exception.constructor.name; // BadRequestException, NotFoundException, etc
    }
    if (exception instanceof Error) {
      return exception.constructor.name; // TypeError, ReferenceError, etc
    }
    return typeof exception === 'object' && exception !== null
      ? ((exception as any).constructor?.name ?? 'Unknown')
      : typeof exception;
  }

  /**
   * Obtiene el status code del exception
   */
  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Obtiene el mensaje del exception
   */
  private getMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (typeof response === 'object' && 'message' in response) {
        return (response as any).message;
      }
    }
    if (exception instanceof Error) {
      return exception.message;
    }
    return 'Internal Server Error';
  }
}
