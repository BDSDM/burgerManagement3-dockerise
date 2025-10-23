package com.burgerManagement.restImpl;

import com.burgerManagement.Util.EmailUtil;
import com.burgerManagement.Util.PdfGenerator;
import com.burgerManagement.pojo.MenuWithPrices;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/email")
public class EmailRestController {

    @Autowired
    private EmailUtil emailUtil;

    @Autowired
    private PdfGenerator pdfGenerator;

    @PostMapping("/send-pdf")
    public ResponseEntity<byte[]> sendEmailWithPdf(
            @RequestParam("to") String to,
            @RequestParam("subject") String subject,
            @RequestParam("body") String body,
            @RequestParam("totalPrice") double totalPrice,
            @RequestBody List<MenuWithPrices> menus
    ) throws MessagingException {

        byte[] pdfBytes = pdfGenerator.generateInvoicePdf(to, menus, totalPrice);
        emailUtil.sendEmailWithPdf(to, subject, body, pdfBytes);

        // Renvoie le PDF pour téléchargement
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=facture.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

}
