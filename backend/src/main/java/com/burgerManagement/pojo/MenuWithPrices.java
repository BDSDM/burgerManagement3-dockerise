package com.burgerManagement.pojo;

public class MenuWithPrices {
    private String burger;
    private Double burgerPrice;
    private String drink;
    private Double drinkPrice;
    private String dessert;
    private Double dessertPrice;

    public MenuWithPrices() {
    }

    public MenuWithPrices(String burger, Double burgerPrice, String drink, Double drinkPrice, String dessert, Double dessertPrice) {
        this.burger = burger;
        this.burgerPrice = burgerPrice;
        this.drink = drink;
        this.drinkPrice = drinkPrice;
        this.dessert = dessert;
        this.dessertPrice = dessertPrice;
    }

    public String getBurger() {
        return burger;
    }

    public void setBurger(String burger) {
        this.burger = burger;
    }

    public Double getBurgerPrice() {
        return burgerPrice;
    }

    public void setBurgerPrice(Double burgerPrice) {
        this.burgerPrice = burgerPrice;
    }

    public String getDrink() {
        return drink;
    }

    public void setDrink(String drink) {
        this.drink = drink;
    }

    public Double getDrinkPrice() {
        return drinkPrice;
    }

    public void setDrinkPrice(Double drinkPrice) {
        this.drinkPrice = drinkPrice;
    }

    public String getDessert() {
        return dessert;
    }

    public void setDessert(String dessert) {
        this.dessert = dessert;
    }

    public Double getDessertPrice() {
        return dessertPrice;
    }

    public void setDessertPrice(Double dessertPrice) {
        this.dessertPrice = dessertPrice;
    }
}
