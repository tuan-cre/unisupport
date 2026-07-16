import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object') {
        const obj = res as Record<string, unknown>;
        message = Array.isArray(obj.message)
          ? (obj.message as string[])[0]
          : ((obj.message as string) ?? message);
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error(`Prisma error ${exception.code}: ${exception.message}`);
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'A record with that value already exists';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
      } else {
        status = HttpStatus.BAD_REQUEST;
        message = 'Database error';
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      this.logger.error(`Prisma validation error: ${exception.message}`);
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid data';
    } else {
      this.logger.error(`Unhandled exception: ${exception instanceof Error ? exception.message : exception}`);
    }

    response.status(status).json({
      success: false,
      message,
    });
  }
}
