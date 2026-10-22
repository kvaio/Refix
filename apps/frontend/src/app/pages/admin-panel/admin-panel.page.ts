import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TimeoutError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import {
  AdminAccount,
  AdminAccountsService,
  AdminDashboard,
  AdminAccountPayload,
  ManagedRole,
  ManagedStatus,
} from '../../services/admin-accounts.service';

interface AdminAccountForm {
  role: 'CLIENT' | 'TECHNICIAN';
  firstNames: string;
  paternalSurname: string;
  maternalSurname: string;
  birthDate: string;
  sex: string;
  email: string;
  password: string;
  phone: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  neighborhood: string;
  municipality: string;
  state: string;
  postalCode: string;
  profession: string;
  yearsExperience: number | null;
  certifications: string;
  bio: string;
}

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.page.html',
  styleUrls: ['./admin-panel.page.scss'],
  standalone: false,
})
export class AdminPanelPage implements OnInit {
  readonly maxBirthDate = this.adultBirthDateLimit();
  dashboard: AdminDashboard | null = null;
  selectedAccount: AdminAccount | null = null;
  isFormOpen = false;
  isSavingForm = false;
  formMode: 'create' | 'edit' = 'create';
  formError = '';
  editingAccountId: string | null = null;
  accountForm: AdminAccountForm = this.emptyForm();
  searchTerm = '';
  roleFilter: 'ALL' | ManagedRole = 'ALL';
  statusFilter: 'ALL' | ManagedStatus = 'ALL';
  isLoading = false;
  busyAccountId: string | null = null;
  clearingRequestsAccountId: string | null = null;
  errorMessage = '';
  actionMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly adminAccounts: AdminAccountsService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  get adminName(): string {
    return this.authService.getUser()?.name || 'Administrador';
  }

  get adminId(): string {
    return this.authService.getUser()?.id || '';
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminAccounts
      .getDashboard({
        search: this.searchTerm.trim() || undefined,
        role: this.roleFilter === 'ALL' ? undefined : this.roleFilter,
        status: this.statusFilter === 'ALL' ? undefined : this.statusFilter,
      })
      .subscribe({
        next: (dashboard) => {
          this.dashboard = dashboard;
          this.isLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.errorMessage = error instanceof TimeoutError
            ? 'El servidor tardó demasiado en responder. Intenta actualizar de nuevo.'
            : error.status === 0
              ? 'No hay conexión con el backend.'
              : error.status === 403
                ? 'Tu cuenta no tiene permisos de administrador.'
                : 'No se pudieron cargar las cuentas.';
        },
      });
  }

  openCreateForm(): void {
    this.selectedAccount = null;
    this.formMode = 'create';
    this.editingAccountId = null;
    this.accountForm = this.emptyForm();
    this.formError = '';
    this.isFormOpen = true;
  }

  openEditForm(account: AdminAccount): void {
    this.closeAccount();
    this.formMode = 'edit';
    this.editingAccountId = account.id;
    this.formError = '';
    this.accountForm = {
      role: account.role === 'TECHNICIAN' ? 'TECHNICIAN' : 'CLIENT',
      firstNames: account.firstNames || '',
      paternalSurname: account.paternalSurname || '',
      maternalSurname: account.maternalSurname || '',
      birthDate: account.birthDate ? account.birthDate.slice(0, 10) : '',
      sex: account.sex || '',
      email: account.email,
      password: '',
      phone: account.phone || '',
      street: account.street || '',
      exteriorNumber: account.exteriorNumber || '',
      interiorNumber: account.interiorNumber || '',
      neighborhood: account.neighborhood || '',
      municipality: account.municipality || '',
      state: account.state || '',
      postalCode: account.postalCode || '',
      profession: account.technicianProfile?.profession || '',
      yearsExperience: account.technicianProfile?.yearsExperience ?? null,
      certifications: account.technicianProfile?.certifications || '',
      bio: account.technicianProfile?.bio || '',
    };
    this.isFormOpen = true;
  }

  closeForm(): void {
    this.isFormOpen = false;
    this.formError = '';
  }

  saveAccountForm(): void {
    if (this.isSavingForm) return;
    this.formError = '';
    if (this.accountForm.birthDate && this.accountForm.birthDate > this.maxBirthDate) {
      this.formError = 'La cuenta debe corresponder a una persona de 18 años o más.';
      return;
    }
    if (this.accountForm.role === 'TECHNICIAN' && this.accountForm.yearsExperience === null) {
      this.formError = 'Completa los años de experiencia del técnico.';
      return;
    }
    const payload = this.accountFormPayload();
    if (this.formMode === 'create') {
      if (!this.accountForm.password) {
        this.formError = 'La contraseña inicial es obligatoria.';
        return;
      }
      this.isSavingForm = true;
      this.adminAccounts.createAccount({ ...payload, password: this.accountForm.password }).subscribe({
        next: () => this.onFormSaved('La cuenta se creó correctamente.'),
        error: (error: HttpErrorResponse) => this.onFormError(error),
      });
      return;
    }

    if (!this.editingAccountId) return;
    this.isSavingForm = true;
    const form = this.accountForm;
    const editPayload: Partial<AdminAccountPayload> = {
      email: form.email.trim(),
      ...(form.firstNames.trim() ? { firstNames: form.firstNames.trim() } : {}),
      ...(form.paternalSurname.trim() ? { paternalSurname: form.paternalSurname.trim() } : {}),
      ...(form.maternalSurname.trim() ? { maternalSurname: form.maternalSurname.trim() } : {}),
      ...(form.birthDate ? { birthDate: form.birthDate } : {}),
      ...(form.sex ? { sex: form.sex } : {}),
      phone: form.phone.trim() || null,
      ...(form.street.trim() ? { street: form.street.trim() } : {}),
      ...(form.exteriorNumber.trim() ? { exteriorNumber: form.exteriorNumber.trim() } : {}),
      interiorNumber: form.interiorNumber.trim() || null,
      ...(form.neighborhood.trim() ? { neighborhood: form.neighborhood.trim() } : {}),
      ...(form.municipality.trim() ? { municipality: form.municipality.trim() } : {}),
      ...(form.state.trim() ? { state: form.state.trim() } : {}),
      postalCode: form.postalCode.trim() || null,
    };
    if (form.role === 'TECHNICIAN' && form.yearsExperience !== null && form.profession.trim() && form.bio.trim()) {
      editPayload.technicianProfile = {
        profession: form.profession.trim(),
        yearsExperience: form.yearsExperience,
        bio: form.bio.trim(),
        certifications: form.certifications.trim() || null,
      };
    }
    if (form.password) editPayload.password = form.password;

    this.adminAccounts.updateAccount(this.editingAccountId, editPayload).subscribe({
      next: () => this.onFormSaved('Los cambios se guardaron correctamente.'),
      error: (error: HttpErrorResponse) => this.onFormError(error),
    });
  }

  deleteAccount(account: AdminAccount): void {
    if (!account.canDelete) {
      this.actionMessage = 'No se puede eliminar: tiene solicitudes o historial. Suspéndela para conservar esos registros.';
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm('Eliminar permanentemente la cuenta de ' + account.name + '?')) return;
    this.busyAccountId = account.id;
    this.actionMessage = '';
    this.adminAccounts.deleteAccount(account.id).subscribe({
      next: () => {
        this.busyAccountId = null;
        this.closeAccount();
        this.actionMessage = 'La cuenta fue eliminada.';
        this.loadDashboard();
      },
      error: (error: HttpErrorResponse) => {
        this.busyAccountId = null;
        this.actionMessage = error instanceof TimeoutError
          ? 'El servidor tardó demasiado en responder. Actualiza la lista antes de volver a intentarlo.'
          : typeof error.error?.message === 'string'
          ? error.error.message
          : 'No se pudo eliminar la cuenta.';
      },
    });
  }

  clearAccountRequests(account: AdminAccount): void {
    const requestCount = account._count.serviceRequests + account._count.assignedServices;
    if (requestCount === 0 || this.clearingRequestsAccountId) return;
    const confirmation =
      `Se borrarán ${requestCount} pedido(s) relacionado(s) con ${account.name}, incluyendo sus conversaciones, ` +
      'historial y reseñas. También desaparecerán del historial del otro participante. La cuenta y ambos perfiles se conservan. ¿Continuar?';
    if (typeof window !== 'undefined' && !window.confirm(confirmation)) return;

    this.clearingRequestsAccountId = account.id;
    this.actionMessage = '';
    this.adminAccounts.clearServiceRequests(account.id).subscribe({
      next: (result) => {
        this.clearingRequestsAccountId = null;
        this.closeAccount();
        this.actionMessage = result.deletedRequests
          ? `Se borraron ${result.deletedRequests} pedido(s) de ${account.name}. La cuenta y el perfil se conservaron.`
          : 'La cuenta ya no tenía pedidos relacionados.';
        this.loadDashboard();
      },
      error: (error: HttpErrorResponse) => {
        this.clearingRequestsAccountId = null;
        this.actionMessage = error instanceof TimeoutError
          ? 'El servidor tardó demasiado en responder. Actualiza la lista antes de volver a intentarlo.'
          : typeof error.error?.message === 'string'
            ? error.error.message
            : 'No se pudieron borrar los pedidos de la cuenta.';
      },
    });
  }

  private accountFormPayload(): AdminAccountPayload {
    const form = this.accountForm;
    const payload: AdminAccountPayload = {
      firstNames: form.firstNames.trim(),
      paternalSurname: form.paternalSurname.trim(),
      maternalSurname: form.maternalSurname.trim(),
      birthDate: form.birthDate,
      sex: form.sex,
      email: form.email.trim(),
      role: form.role,
      street: form.street.trim(),
      exteriorNumber: form.exteriorNumber.trim(),
      neighborhood: form.neighborhood.trim(),
      municipality: form.municipality.trim(),
      state: form.state.trim(),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      ...(form.interiorNumber.trim() ? { interiorNumber: form.interiorNumber.trim() } : {}),
      ...(form.postalCode.trim() ? { postalCode: form.postalCode.trim() } : {}),
    };
    if (form.role === 'TECHNICIAN') {
      if (form.yearsExperience === null) {
        return payload;
      }
      payload.technicianProfile = {
        profession: form.profession.trim(),
        yearsExperience: form.yearsExperience,
        bio: form.bio.trim(),
        ...(form.certifications.trim() ? { certifications: form.certifications.trim() } : {}),
      };
    }
    return payload;
  }

  private onFormSaved(message: string): void {
    this.isSavingForm = false;
    this.isFormOpen = false;
    this.actionMessage = message;
    this.loadDashboard();
  }

  private onFormError(error: HttpErrorResponse): void {
    this.isSavingForm = false;
    this.formError = error instanceof TimeoutError
      ? 'El servidor tardó demasiado en responder. Actualiza la lista antes de volver a intentarlo.'
      : Array.isArray(error.error?.message)
      ? error.error.message.join(' ')
      : typeof error.error?.message === 'string'
        ? error.error.message
        : 'No se pudo guardar la cuenta.';
  }

  private emptyForm(): AdminAccountForm {
    return {
      role: 'CLIENT', firstNames: '', paternalSurname: '', maternalSurname: '',
      birthDate: '', sex: '', email: '', password: '', phone: '', street: '',
      exteriorNumber: '', interiorNumber: '', neighborhood: '', municipality: '',
      state: '', postalCode: '', profession: '', yearsExperience: null,
      certifications: '', bio: '',
    };
  }

  private adultBirthDateLimit(): string {
    const today = new Date();
    return `${today.getFullYear() - 18}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  openAccount(account: AdminAccount): void {
    this.selectedAccount = account;
  }

  closeAccount(): void {
    this.selectedAccount = null;
  }

  toggleAccount(account: AdminAccount): void {
    const nextActive = !account.isActive;
    if (
      !nextActive &&
      typeof window !== 'undefined' &&
      !window.confirm('¿Suspender la cuenta de ' + account.name + '?')
    ) {
      return;
    }

    this.busyAccountId = account.id;
    this.actionMessage = '';
    this.adminAccounts.setActive(account.id, nextActive).subscribe({
      next: () => {
        this.busyAccountId = null;
        this.actionMessage = nextActive
          ? 'La cuenta de ' + account.name + ' está activa.'
          : 'La cuenta de ' + account.name + ' fue suspendida.';
        this.closeAccount();
        this.loadDashboard();
      },
      error: (error: HttpErrorResponse) => {
        this.busyAccountId = null;
        this.actionMessage = error instanceof TimeoutError
          ? 'El servidor tardó demasiado en responder. Actualiza la lista antes de volver a intentarlo.'
          : typeof error.error?.message === 'string'
            ? error.error.message
            : 'No se pudo actualizar el estado de la cuenta.';
      },
    });
  }

  formatRole(role: ManagedRole): string {
    return {
      CLIENT: 'Cliente',
      TECHNICIAN: 'Técnico',
      ADMIN: 'Administrador',
    }[role];
  }

  formatAddress(account: AdminAccount): string {
    return [
      account.street && account.exteriorNumber
        ? account.street + ' ' + account.exteriorNumber
        : account.street || account.exteriorNumber,
      account.interiorNumber ? 'Interior ' + account.interiorNumber : null,
      account.neighborhood,
      account.municipality,
      account.state,
      account.postalCode,
    ]
      .filter(Boolean)
      .join(', ') || 'Sin domicilio registrado';
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
