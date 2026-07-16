import { Injectable, ExecutionContext, NestInterceptor, CallHandler } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error.status && error.status < 500) {
          // Don't report 4xx errors to Sentry
          return throwError(() => error);
        }
        Sentry.captureException(error);
        return throwError(() => error);
      }),
    );
  }
}
