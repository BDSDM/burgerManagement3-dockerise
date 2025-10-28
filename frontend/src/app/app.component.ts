import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CookieService } from './core/services/cookie.service';
import { AuthService } from './core/services/auth.service';
import { ColorService } from './core/services/color.service';
import { CheckActivityService } from './core/services/check-activity.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'burgerManagementFrontend';
  private ignoredRoutes: string[] = ['/login', '/logout', '/register', '/'];

  constructor(
    private checkActivityService: CheckActivityService,
    private colorService: ColorService,
    private cookieService: CookieService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // 🕵️ Vérifie régulièrement si l'utilisateur est toujours actif
    this.checkActivityService.startChecking();

    // 🧠 Surveille l’état de connexion de l’utilisateur
    this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
      const email = this.authService.getUserEmail();

      if (isAuthenticated && email) {
        this.loadUserColor();
        this.loadLastVisitedPage(email);
        this.trackVisitedPages(); // ✅ Ne passe plus d'email ici
      } else {
        // Si pas connecté, fond blanc
        this.colorService.applyColorToBody('#ffffff', true);
      }
    });
  }

  /** ------------------ COULEUR UTILISATEUR ------------------ **/
  private loadUserColor(): void {
    this.colorService.getColorServer().subscribe({
      next: (res) => {
        if (res?.color) this.colorService.applyColorToBody(res.color, true);
      },
      error: (err) =>
        console.warn('Erreur lors du chargement de la couleur :', err),
    });
  }

  /** ------------------ CHARGEMENT DERNIÈRE PAGE ------------------ **/
  private loadLastVisitedPage(email: string): void {
    this.cookieService.getLastPage(email).subscribe({
      next: (res) => {
        const lastPage = res?.lastPage || '/burgerspage';

        if (!this.isIgnoredRoute(lastPage) && lastPage !== this.router.url) {
          console.log(`📦 Dernière page pour ${email} : ${lastPage}`);
          this.router.navigateByUrl(lastPage);
        }
      },
      error: () => {
        this.router.navigateByUrl('/burgerspage');
      },
    });
  }

  /** ------------------ TRACKING DE PAGE ------------------ **/
  private trackVisitedPages(): void {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((event) => {
        const page = event.urlAfterRedirects;
        const email = this.authService.getUserEmail(); // ✅ récupère dynamiquement l'utilisateur connecté

        if (!email) {
          console.log(
            '🚫 Aucun utilisateur connecté — pas de sauvegarde de page.'
          );
          return;
        }

        if (!this.isIgnoredRoute(page)) {
          console.log(`🧭 Sauvegarde de la page "${page}" pour ${email}`);

          // ✅ Sauvegarde uniquement pour l'utilisateur actuellement connecté
          this.cookieService.setLastPage(page, email).subscribe({
            next: () =>
              console.log(`✅ Cookie mis à jour pour ${email} → ${page}`),
            error: (err) =>
              console.error(`⚠️ Erreur sauvegarde page pour ${email}`, err),
          });
        }
      });
  }

  /** ------------------ ROUTES À IGNORER ------------------ **/
  private isIgnoredRoute(route: string): boolean {
    const cleanRoute = route.split('?')[0].split('#')[0];
    return this.ignoredRoutes.includes(cleanRoute);
  }
}
