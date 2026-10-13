import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  userRole: string = 'usuario';

  constructor(private router: Router) {}

  onLogin() {
    if (this.userRole === 'usuario') {
      this.router.navigate(['/user-home']);
    } else if (this.userRole === 'tecnico') {
      this.router.navigate(['/technician-panel']);
    } else if (this.userRole === 'admin') {
      this.router.navigate(['/admin-panel']);
    }
  }
}