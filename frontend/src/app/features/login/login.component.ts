import { Component, ChangeDetectorRef, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
} from '@angular/material/dialog';
import { RegisterComponent } from '../register/register.component';
import { RequestResetPasswordComponent } from '../request-reset-password/request-reset-password.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { CookieService } from 'src/app/core/services/cookie.service';
import { ColorService } from 'src/app/core/services/color.service';
import { User } from 'src/app/core/models/user.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  loginError = false;
  isSubmitting = false;
  showPassword = false;
  user: User = { id: 0, name: '', email: '', password: '' };
  emailPattern: string = '^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$';

  private ignoredRoutes: string[] = ['/login', '/logout', '/register', '/'];

  constructor(
    private authService: AuthService,
    private cookieService: CookieService,
    private router: Router,
    private dialog: MatDialog,
    private cdRef: ChangeDetectorRef,
    private colorService: ColorService,
    @Inject(MAT_DIALOG_DATA) public data: { email: string; password: string },
    private dialogRef: MatDialogRef<LoginComponent>
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.email = this.data.email;
      this.password = this.data.password;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.loginError = false;
    this.isSubmitting = true;

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        // Sauvegarde des tokens
        this.authService.saveToken(response.token, response.refreshToken);
        this.dialogRef.close();

        const userEmail = this.authService.getUserEmail();
        if (!userEmail) {
          this.router.navigate(['/burgerspage']);
          this.isSubmitting = false;
          return;
        }

        // Appliquer couleur utilisateur
        this.colorService.getColorServer().subscribe({
          next: (res) => {
            if (res?.color) this.colorService.applyColorToBody(res.color, true);
          },
          error: (err) =>
            console.warn('Impossible de récupérer la couleur :', err),
        });

        // Récupérer la dernière page visitée pour cet utilisateur (cookie uniquement)
        this.cookieService.getLastPage(userEmail).subscribe({
          next: (res) => {
            let lastPage = res?.lastPage || '/burgerspage';

            if (
              this.ignoredRoutes.includes(lastPage) ||
              lastPage.startsWith('/login')
            ) {
              lastPage = '/burgerspage';
            }

            console.log(
              `Redirection vers la dernière page pour ${userEmail} : ${lastPage}`
            );
            this.router.navigateByUrl(lastPage);
            this.isSubmitting = false;
          },
          error: () => {
            // En cas d'erreur serveur, on redirige vers la page par défaut
            this.router.navigateByUrl('/burgerspage');
            this.isSubmitting = false;
          },
        });
      },
      error: () => {
        this.loginError = true;
        this.isSubmitting = false;
        this.cdRef.detectChanges();
      },
    });
  }

  changePassword(): void {
    this.dialogRef.close();
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.width = '400px';
    this.dialog.open(RequestResetPasswordComponent, dialogConfig);
  }

  openRegisterDialog(): void {
    this.dialogRef.close();
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.width = '400px';
    this.dialog.open(RegisterComponent, dialogConfig);
  }
}
