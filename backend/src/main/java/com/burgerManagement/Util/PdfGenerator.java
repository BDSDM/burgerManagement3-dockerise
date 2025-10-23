package com.burgerManagement.Util;

import com.burgerManagement.dao.UserDao;
import com.burgerManagement.pojo.MenuWithPrices;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.stream.Stream;

@Component
public class PdfGenerator {
    @Autowired
    private UserDao userDao;


    public byte[] generateInvoicePdf(String email, List<MenuWithPrices> menus, double totalPrice) {
        try {
            Document document = new Document();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter.getInstance(document, out);
            document.open();
            // Titre
            Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Paragraph title = new Paragraph("Facture de commande", fontTitle);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            document.add(new Paragraph("\nClient : " + userDao.findByEmail(email).get().getName() + "\n\n"));

            // Table des menus
            PdfPTable table = new PdfPTable(4); // Burger, Boisson, Dessert, Prix
            table.setWidthPercentage(100);
            table.setWidths(new int[]{3, 3, 3, 2});

            // Header
            Stream.of("Burger", "Boisson", "Dessert", "Prix").forEach(headerTitle -> {
                PdfPCell header = new PdfPCell();
                Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD);
                header.setPhrase(new Phrase(headerTitle, headFont));
                header.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(header);
            });

            // Contenu
            for (MenuWithPrices menu : menus) {
                table.addCell(menu.getBurger() != null ? menu.getBurger() : "-");
                table.addCell(menu.getDrink() != null ? menu.getDrink() : "-");
                table.addCell(menu.getDessert() != null ? menu.getDessert() : "-");
                double price = (menu.getBurgerPrice() != null ? menu.getBurgerPrice() : 0)
                        + (menu.getDrinkPrice() != null ? menu.getDrinkPrice() : 0)
                        + (menu.getDessertPrice() != null ? menu.getDessertPrice() : 0);
                table.addCell(String.format("%.2f €", price));
            }

            document.add(table);

            document.add(new Paragraph("\nTotal : " + String.format("%.2f €", totalPrice)));

            document.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            throw new RuntimeException("Erreur génération PDF : " + e.getMessage());
        }
    }
}
