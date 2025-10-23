import { Component, OnInit } from '@angular/core';
import { MenuService } from 'src/app/core/services/menu.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Burger, BurgerService } from 'src/app/core/services/burger.service';
import { DrinkService } from 'src/app/core/services/drink.service';
import { DessertService } from 'src/app/core/services/dessert.service';
import { Menu } from 'src/app/core/models/menu.model';
import { Drink } from 'src/app/core/models/drink.model';
import { Dessert } from 'src/app/core/models/dessert.model';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { EmailService } from 'src/app/core/services/email.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface MenuWithPrices {
  burger?: string;
  burgerPrice?: number;
  drink?: string;
  drinkPrice?: number;
  dessert?: string;
  dessertPrice?: number;
}

@Component({
  selector: 'app-basket',
  templateUrl: './basket.component.html',
  styleUrls: ['./basket.component.css'],
})
export class BasketComponent implements OnInit {
  menus: Menu[] = [];
  menusWithPrices: MenuWithPrices[] = [];
  totalPrice: number = 0;
  burgers: Burger[] = [];
  drinks: Drink[] = [];
  desserts: Dessert[] = [];
  isSending: boolean = false;

  constructor(
    private menuService: MenuService,
    private authService: AuthService,
    private burgerService: BurgerService,
    private drinkService: DrinkService,
    private dessertService: DessertService,
    private router: Router,
    private emailService: EmailService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const currentUserId = this.authService.getUserId();

    // Récupérer tous les menus de l'utilisateur
    this.menuService.getMenusByUser(currentUserId).subscribe({
      next: (menus) => {
        this.menus = menus;

        // Récupérer tous les produits en parallèle
        forkJoin({
          burgers: this.burgerService.getAllBurgers(),
          drinks: this.drinkService.getAllDrinks(),
          desserts: this.dessertService.getAllDesserts(),
        }).subscribe({
          next: ({ burgers, drinks, desserts }) => {
            this.burgers = burgers;
            this.drinks = drinks;
            this.desserts = desserts;

            // Préparer menus avec prix
            this.prepareMenusWithPrices();
          },
          error: (err) => console.error('Erreur récupération produits', err),
        });
      },
      error: (err) => console.error('Erreur récupération menus', err),
    });
  }

  prepareMenusWithPrices() {
    this.menusWithPrices = this.menus.map((menu) => {
      const burgerObj = this.burgers.find((b) => b.name === menu.burger);
      const drinkObj = this.drinks.find((d) => d.name === menu.drink);
      const dessertObj = this.desserts.find((ds) => ds.name === menu.dessert);

      return {
        burger: menu.burger,
        burgerPrice: burgerObj?.price || 0,
        drink: menu.drink,
        drinkPrice: drinkObj?.price || 0,
        dessert: menu.dessert,
        dessertPrice: dessertObj?.price || 0,
      };
    });

    // Calculer le total du panier
    this.totalPrice = this.menusWithPrices.reduce((sum, menu) => {
      return (
        sum +
        (menu.burgerPrice || 0) +
        (menu.drinkPrice || 0) +
        (menu.dessertPrice || 0)
      );
    }, 0);
  }
  confirmOrder() {
    if (this.menus.length === 0) return;

    this.isSending = true;
    const userEmail = this.authService.getUserEmail() || '';
    const subject = 'Votre facture - Confirmation de commande';
    const body = this.buildInvoiceEmail();
    this.emailService
      .sendInvoiceWithPdfAndDownload(
        userEmail,
        subject,
        body,
        this.totalPrice,
        this.menusWithPrices
      )
      .subscribe({
        next: (pdfBlob) => {
          // ✅ Téléchargement côté frontend
          const blob = new Blob([pdfBlob], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'facture.pdf';
          link.click();
          window.URL.revokeObjectURL(url);

          // Message snackbar
          this.snackBar.open(
            'La facture de votre commande vous a été envoyée par mail et téléchargée',
            'Fermer',
            {
              duration: 5000,
              verticalPosition: 'top',
              horizontalPosition: 'center',
            }
          );

          // Vider le panier
          const deleteRequests = this.menus
            .filter((menu) => menu.id !== undefined)
            .map((menu) => this.menuService.deleteMenu(menu.id!));

          forkJoin(deleteRequests).subscribe({
            next: () => {
              this.menus = [];
              this.prepareMenusWithPrices();
              this.isSending = false;
            },
            error: (err) => {
              console.error('Erreur lors de la suppression des menus', err);
              this.isSending = false;
            },
          });
        },
        error: (err) => {
          console.error(
            "Erreur lors de l'envoi de l'email ou téléchargement",
            err
          );
          this.isSending = false;
        },
      });
  }

  private buildInvoiceEmail(): string {
    let body = 'Voici le récapitulatif de votre commande :\n\n';

    this.menusWithPrices.forEach((menu, index) => {
      body += `Menu ${index + 1}:\n`;
      if (menu.burger) {
        body += `🍔 Burger : ${menu.burger} - ${menu.burgerPrice} €\n`;
      }
      if (menu.drink) {
        body += `🥤 Boisson : ${menu.drink} - ${menu.drinkPrice} €\n`;
      }
      if (menu.dessert) {
        body += `🍰 Dessert : ${menu.dessert} - ${menu.dessertPrice} €\n`;
      }
      body += '\n';
    });

    body += `💰 Total : ${this.totalPrice} €\n\nMerci pour votre commande !`;

    return body;
  }
  cancelOrder() {
    if (this.menus.length === 0) return;

    // 2️⃣ Puis suppression des menus
    const deleteRequests = this.menus
      .filter((menu) => menu.id !== undefined)
      .map((menu) => this.menuService.deleteMenu(menu.id!));

    forkJoin(deleteRequests).subscribe({
      next: () => {
        this.menus = [];
        this.prepareMenusWithPrices();
        console.log('Commande confirmée et panier vidé ✅');
      },
      error: (err) =>
        console.error('Erreur lors de la suppression des menus', err),
    });
  }
}
