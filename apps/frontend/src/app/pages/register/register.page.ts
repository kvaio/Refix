import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage {
  name = '';
  email = '';
  password = '';
  phone = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  onRegister(): void {
    if (this.isLoading) return;

    this.errorMessage = '';
    this.isLoading = true;

    this.authService.register({
      name: this.name.trim(),
      email: this.email.trim(),
      password: this.password,
      ...(this.phone.trim() ? { phone: this.phone.trim() } : {}),
    }).subscribe({
      next: () => {
        this.isLoading = false;
        void this.router.navigate(['/user-home']);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;

        if (error.status === 409) {
          this.errorMessage = 'Ese correo ya tiene una cuenta. Intenta iniciar sesión.';
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con ReFix. Verifica que el backend esté activo.';
        } else if (Array.isArray(error.error?.message)) {
          this.errorMessage = error.error.message.join(' ');
        } else {
          this.errorMessage =
            typeof error.error?.message === 'string'
              ? error.error.message
              : 'No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo.';
        }
      },
    });
  }
}
