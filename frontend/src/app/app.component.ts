import { Component, OnInit } from '@angular/core';
import { CheckActivityService } from './core/services/check-activity.service';
import { ColorService } from './core/services/color.service';
import { CookieService } from './core/services/cookie.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'burgerManagementFrontend';
  private ignoredRoutes: string[] = ['/'];

  constructor(
    private checkActivityService: CheckActivityService,
    private colorService: ColorService,
    private cookieService: CookieService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkActivityService.startChecking();

    // ✅ Quand l’utilisateur est connecté, on charge directement sa couleur
    const userEmail = this.authService.getUserEmail();
    if (userEmail) {
      this.loadUserColor();
      this.loadLastVisitedPage(userEmail);
      this.trackVisitedPages(userEmail);
    }

    // ✅ Écoute les changements d’état de connexion (si jamais login/logout change)
    this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        // Si connexion → recharge la couleur du backend
        this.loadUserColor();
      } else {
        // Si déconnexion → remet la couleur par défaut
        this.colorService.applyColorToBody('#ffffff', true);
      }
    });
  }

  /** 🔹 Récupère et applique la couleur de fond de l'utilisateur depuis le backend */
  private loadUserColor(): void {
    this.colorService.getColorServer().subscribe({
      next: (res) => {
        if (res && res.color) {
          this.colorService.applyColorToBody(res.color, true);
        } else {
          console.log('Aucune couleur trouvée pour cet utilisateur.');
        }
      },
      error: (err) => {
        console.warn(
          'Impossible de récupérer la couleur depuis le serveur :',
          err
        );
      },
    });
  }

  /** 🔹 Charge la dernière page visitée de l'utilisateur connecté */
  private loadLastVisitedPage(userEmail: string): void {
    this.cookieService.getAllLastPageCookies().subscribe({
      next: (res) => {
        const cookieName = `lastPage_${encodeURIComponent(
          userEmail.toLowerCase()
        )}`;
        const lastPage = res[cookieName] || '/burgerspage';

        if (!this.isIgnoredRoute(lastPage) && lastPage !== this.router.url) {
          this.router.navigateByUrl(lastPage);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des cookies :', err);
      },
    });
  }

  /** 🔹 Enregistre les pages visitées de l’utilisateur connecté */
  private trackVisitedPages(userEmail: string): void {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe((event) => {
        const lastPage = event.urlAfterRedirects;
        if (!this.isIgnoredRoute(lastPage)) {
          this.cookieService.setLastPage(lastPage, userEmail).subscribe({
            error: (err) =>
              console.error('Erreur d’enregistrement de la page :', err),
          });
        }
      });
  }

  /** 🔹 Vérifie si une route doit être ignorée */
  private isIgnoredRoute(route: string): boolean {
    const cleanRoute = route.split('?')[0].split('#')[0];
    return this.ignoredRoutes.includes(cleanRoute);
  }
}
