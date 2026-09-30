import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred';
    let code = 'INTERNAL_ERROR';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body) {
        const b = body as Record<string, unknown>;
        message = (b.message as string) || exception.message;
        code = (b.code as string) || exception.name;
        details = b.message;
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.stack);
    }

    response.status(status).json({
      success: false,
      message: Array.isArray(message) ? message[0] : message,
      code,
      ...(process.env.NODE_ENV === 'development' && details && Array.isArray(details)
        ? { details }
        : {}),
    });
  }
}
