
import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    const apiBase = new URL(
      environment.apiUrl,
      window.location.origin,
    );

    const requestUrl = new URL(
      request.url,
      window.location.origin,
    );

    const basePath = apiBase.pathname.replace(/\/+$/, '');

    const isApiRequest =
      requestUrl.origin === apiBase.origin &&
      (
        requestUrl.pathname === basePath ||
        requestUrl.pathname.startsWith(`${basePath}/`)
      );

    const isAuthRequest =
      requestUrl.pathname === `${basePath}/auth/login` ||
      requestUrl.pathname === `${basePath}/auth/register`;

    const token = this.authService.getToken();

    // Adjuntar el token únicamente a solicitudes de nuestra API.
    // No hace falta enviarlo al iniciar sesión o registrarse.
    const outgoingRequest =
      token && isApiRequest && !isAuthRequest
        ? request.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          })
        : request;

    return next.handle(outgoingRequest).pipe(
      catchError((error: unknown) => {
        if (
          error instanceof HttpErrorResponse &&
          error.status === 401 &&
          isApiRequest &&
          !isAuthRequest &&
          token
        ) {
          this.authService.logout();
          void this.router.navigateByUrl('/login');
        }

        return throwError(() => error);
      }),
    );
  }
}
