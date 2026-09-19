import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { ProblemDetails } from '@tuite/shared-types';

/**
 * Global exception filter that formats ALL errors into RFC 7807
 * Problem Details JSON responses. Stack traces are only included
 * in non-production environments.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7807
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { status, title, detail, type } = this.extractErrorInfo(exception);
    const requestId = (request.headers['x-request-id'] as string) || 'unknown';

    // Log the full error server-side
    this.logger.error(
      {
        requestId,
        statusCode: status,
        path: request.url,
        method: request.method,
        ...(exception instanceof Error && !this.isProduction
          ? { stack: exception.stack }
          : {}),
      },
      `${status} ${title}: ${detail}`,
    );

    const problemDetails: ProblemDetails = {
      type,
      title,
      status,
      detail,
      instance: request.url,
      requestId,
    };

    // Include validation errors if available
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        if (resp.message && Array.isArray(resp.message)) {
          problemDetails.errors = { validation: resp.message as string[] };
        }
      }
    }

    // Never expose stack traces in production
    if (!this.isProduction && exception instanceof Error) {
      (problemDetails as unknown as Record<string, unknown>).stack = exception.stack;
    }

    response.status(status).json(problemDetails);
  }

  private extractErrorInfo(exception: unknown): {
    status: number;
    title: string;
    detail: string;
    type: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const detail =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as Record<string, unknown>).message?.toString() ||
            exception.message;

      return {
        status,
        title: this.getHttpTitle(status),
        detail,
        type: `https://api.tuite.com/errors/${this.getErrorType(status)}`,
      };
    }

    // Prisma known errors
    if (this.isPrismaError(exception)) {
      return this.handlePrismaError(exception);
    }

    // Unknown errors
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      title: 'Internal Server Error',
      detail: this.isProduction
        ? 'An unexpected error occurred'
        : (exception as Error)?.message || 'Unknown error',
      type: 'https://api.tuite.com/errors/internal-server-error',
    };
  }

  private isPrismaError(exception: unknown): exception is { code: string; meta?: Record<string, unknown> } {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      typeof (exception as Record<string, unknown>).code === 'string'
    );
  }

  private handlePrismaError(error: { code: string; meta?: Record<string, unknown> }): {
    status: number;
    title: string;
    detail: string;
    type: string;
  } {
    switch (error.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          title: 'Conflict',
          detail: `A record with this value already exists: ${JSON.stringify(error.meta?.target)}`,
          type: 'https://api.tuite.com/errors/conflict',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          title: 'Not Found',
          detail: 'The requested record was not found',
          type: 'https://api.tuite.com/errors/not-found',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          title: 'Database Error',
          detail: this.isProduction ? 'A database error occurred' : `Prisma error: ${error.code}`,
          type: 'https://api.tuite.com/errors/database-error',
        };
    }
  }

  private getHttpTitle(status: number): string {
    const titles: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
    };
    return titles[status] || 'Error';
  }

  private getErrorType(status: number): string {
    const types: Record<number, string> = {
      400: 'bad-request',
      401: 'unauthorized',
      403: 'forbidden',
      404: 'not-found',
      409: 'conflict',
      422: 'unprocessable-entity',
      429: 'too-many-requests',
      500: 'internal-server-error',
    };
    return types[status] || 'error';
  }
}
