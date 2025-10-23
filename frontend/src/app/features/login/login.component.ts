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
import { User } from 'src/app/core/models/user.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { CookieService } from 'src/app/core/services/cookie.service';
import { ColorService } from 'src/app/core/services/color.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  loginError: boolean = false;
  user: User = { id: 0, name: '', email: '', password: '' };
  showPassword: boolean = false;
  isSubmitting: boolean = false;
  emailPattern: string = '^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$';

  // Routes à ignorer pour la redirection après login
  private ignoredRoutes: string[] = ['/login', '/logout', '/register', '/'];

  constructor(
    private authService: AuthService,
    private cookieService: CookieService,
    private router: Router,
    private dialog: MatDialog,
    private cdRef: ChangeDetectorRef,
    private colorService: ColorService, // ✅ Utilisé pour gérer la couleur après login
    @Inject(MAT_DIALOG_DATA) public data: { email: string; password: string },
    private dialogRef: MatDialogRef<LoginComponent>
  ) {}

  ngOnInit(): void {
    // Si le composant reçoit des données (ex: depuis Register), préremplit le formulaire
    if (this.data) {
      this.user.email = this.data.email;
      this.user.password = this.data.password;
      this.email = this.data.email;
      this.password = this.data.password;
    }
  }

  /** ✅ Affiche ou masque le mot de passe */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /** ✅ Soumission du formulaire de login */
  onSubmit(): void {
    this.loginError = false;
    this.isSubmitting = true;

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        // ✅ Sauvegarde des tokens JWT
        this.authService.saveToken(response.token, response.refreshToken);

        // ✅ Ferme la fenêtre de login
        this.dialogRef.close();

        // 🔹 Recharge immédiatement la couleur de fond utilisateur
        this.colorService.getColorServer().subscribe({
          next: (res) => {
            if (res && res.color) {
              this.colorService.applyColorToBody(res.color, true);
            }
          },
          error: (err) => {
            console.warn('Impossible de récupérer la couleur :', err);
          },
        });

        // 🔹 Récupère l'email depuis le token JWT
        const userEmail = this.authService.getUserEmail();
        if (!userEmail) {
          console.error('Impossible de récupérer l’email depuis le token.');
          this.router.navigate(['/burgerspage']);
          this.isSubmitting = false;
          return;
        }

        // 🔹 Récupère la dernière page visitée pour cet utilisateur
        this.cookieService.getLastPage(userEmail).subscribe({
          next: (res) => {
            let lastPage = res?.lastPage || '/burgerspage';

            console.log('[DEBUG] Dernière page reçue du backend :', lastPage);
            console.log('[DEBUG] Routes ignorées :', this.ignoredRoutes);

            // Vérifie si la dernière page est dans les routes ignorées
            const isIgnored = this.ignoredRoutes.some(
              (route) => lastPage === route || lastPage.startsWith(route + '/')
            );

            if (isIgnored) {
              console.log(
                '[DEBUG] La page est ignorée, redirection vers /burgerspage'
              );
              lastPage = '/burgerspage';
            } else {
              console.log(
                '[DEBUG] Redirection vers la dernière page trouvée :',
                lastPage
              );
            }

            // ✅ Redirection vers la page correcte
            this.router.navigateByUrl(lastPage);
            this.isSubmitting = false;
          },
          error: (err) => {
            console.error(
              'Erreur lors de la récupération de la dernière page :',
              err
            );
            this.router.navigate(['/burgerspage']);
            this.isSubmitting = false;
          },
        });
      },
      error: (err) => {
        console.error('Erreur lors du login', err);
        this.loginError = true;
        this.isSubmitting = false;
        this.cdRef.detectChanges();
      },
    });
  }

  /** ✅ Ouvre la popup de réinitialisation du mot de passe */
  changePassword(): void {
    this.dialogRef.close();

    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.width = '400px';

    this.dialog.open(RequestResetPasswordComponent, dialogConfig);
  }

  /** ✅ Ouvre la popup d’inscription */
  openRegisterDialog(): void {
    this.dialogRef.close();

    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.width = '400px';

    this.dialog.open(RegisterComponent, dialogConfig);
  }
}
