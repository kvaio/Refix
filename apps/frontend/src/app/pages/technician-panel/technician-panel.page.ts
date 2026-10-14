
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-technician-panel',
  templateUrl: './technician-panel.page.html',
  styleUrls: ['./technician-panel.page.scss'],
  standalone: false,
})
export class TechnicianPanelPage {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
