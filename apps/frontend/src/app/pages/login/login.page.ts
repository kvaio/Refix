
import { ChangeDetectorRef, Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService, AuthUser } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  onLogin(): void {
    if (this.isLoading) {
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    this.authService
      .login(this.email.trim(), this.password)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.goToRoleHome(response.user);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error de login:', error.status, error.error);

          if (error.status === 401) {
            this.errorMessage = 'Correo o contraseña incorrectos.';
          } else if (error.status === 0) {
            this.errorMessage =
              'No se pudo conectar con ReFix. Verifica que el backend esté activo.';
          } else if (error.status === 404) {
            this.errorMessage =
              'No se encontró la ruta del login o el recurso solicitado.';
          } else {
            const message = error.error?.message;

            this.errorMessage = Array.isArray(message)
              ? message.join(', ')
              : typeof message === 'string'
                ? message
                : 'No se pudo iniciar sesión. Inténtalo de nuevo.';
          }

          this.cdr.markForCheck();
        },
      });
  }

  private goToRoleHome(user: AuthUser): void {
    switch (user.role) {
      case 'ADMIN':
        void this.router.navigate(['/admin-panel']);
        break;

      case 'TECHNICIAN':
        void this.router.navigate(['/technician-panel']);
        break;

      case 'CLIENT':
        void this.router.navigate(['/user-home']);
        break;

      default:
        this.authService.logout();
        this.errorMessage = 'Tu cuenta tiene un rol no reconocido.';
        this.cdr.markForCheck();
    }
  }
}
