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
  role: 'CLIENT' | 'TECHNICIAN' = 'CLIENT';
  firstNames = '';
  paternalSurname = '';
  maternalSurname = '';
  birthDate = '';
  sex = '';
  email = '';
  password = '';
  phone = '';
  street = '';
  exteriorNumber = '';
  interiorNumber = '';
  neighborhood = '';
  municipality = '';
  state = '';
  postalCode = '';
  profession = '';
  yearsExperience: number | null = null;
  certifications = '';
  technicianBio = '';
  errorMessage = '';
  isLoading = false;

  readonly maxBirthDate = this.adultBirthDateLimit();

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  onRegister(): void {
    if (this.isLoading) return;
    if (this.birthDate > this.maxBirthDate) {
      this.errorMessage = 'Debes tener al menos 18 años para crear una cuenta.';
      return;
    }
    if (this.role === 'TECHNICIAN' && this.yearsExperience === null) {
      this.errorMessage = 'Completa tus datos profesionales.';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    this.authService.register({
      firstNames: this.firstNames.trim(),
      paternalSurname: this.paternalSurname.trim(),
      maternalSurname: this.maternalSurname.trim(),
      birthDate: this.birthDate,
      sex: this.sex,
      email: this.email.trim(),
      password: this.password,
      role: this.role,
      ...(this.phone.trim() ? { phone: this.phone.trim() } : {}),
      street: this.street.trim(),
      exteriorNumber: this.exteriorNumber.trim(),
      ...(this.interiorNumber.trim() ? { interiorNumber: this.interiorNumber.trim() } : {}),
      neighborhood: this.neighborhood.trim(),
      municipality: this.municipality.trim(),
      state: this.state.trim(),
      ...(this.postalCode.trim() ? { postalCode: this.postalCode.trim() } : {}),
      ...(this.role === 'TECHNICIAN'
        ? {
            technicianProfile: {
              profession: this.profession.trim(),
              yearsExperience: this.yearsExperience as number,
              ...(this.certifications.trim() ? { certifications: this.certifications.trim() } : {}),
              bio: this.technicianBio.trim(),
            },
          }
        : {}),
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        void this.router.navigate([
          response.user.role === 'TECHNICIAN' ? '/technician-panel' : '/user-home',
        ]);
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

  private adultBirthDateLimit(): string {
    const today = new Date();
    const year = today.getFullYear() - 18;
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
