package com.burgerManagement.restImpl;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
@RestController
@RequestMapping("/cookies")
public class LastPageController {

    private static final int ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

    // ✅ Memory store isolé par utilisateur
    // Clé = email encodé, Valeur = page
    private final Map<String, String> memoryStorePerUser = new HashMap<>();

    /** Encodage email → Base64 URL-safe */
    private String encodeEmailForCookie(String email) {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(email.trim().toLowerCase().getBytes(StandardCharsets.UTF_8));
    }

    /** Créer ou mettre à jour le cookie lastPage_<encodedEmail> */
    @PostMapping("/last-page")
    public ResponseEntity<Map<String, String>> setLastPage(
            @RequestBody Map<String, String> body,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String page = body.get("page");
        String email = body.get("email");

        if (page == null || email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Page ou email manquant"));
        }

        // 🔐 Encode l'email et construit le nom unique du cookie
        String encodedEmail = encodeEmailForCookie(email);
        String cookieName = "lastPage_" + encodedEmail;
        String encodedPage = URLEncoder.encode(page, StandardCharsets.UTF_8);

        // ✅ Stockage mémoire uniquement pour cet utilisateur
        memoryStorePerUser.put(encodedEmail, page);

        // 🚫 Supprime explicitement les anciens Set-Cookie avant d’ajouter le tien
        response.resetBuffer(); // empêche les anciens en-têtes d’être renvoyés

        // ✅ Ajoute UNIQUEMENT le cookie de cet utilisateur
        ResponseCookie cookie = ResponseCookie.from(cookieName, encodedPage)
                .path("/")
                .maxAge(ONE_YEAR_SECONDS)
                .httpOnly(false)
                .secure(false)
                .sameSite("Lax")
                .build();

        response.setHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        System.out.println("✅ Cookie mis à jour UNIQUEMENT pour " + email + " → " + page);

        return ResponseEntity.ok(Map.of(
                "cookieName", cookieName,
                "lastPage", page
        ));
    }


    /** Lire la dernière page pour un utilisateur */
    @GetMapping("/last-page")
    public ResponseEntity<Map<String, String>> getLastPage(
            @RequestParam("email") String email,
            HttpServletRequest request
    ) {
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email manquant"));
        }

        String encodedEmail = encodeEmailForCookie(email);
        String cookieName = "lastPage_" + encodedEmail;

        // 1️⃣ Vérifie le cookie navigateur
        if (request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                if (cookieName.equals(cookie.getName())) {
                    String decoded = URLDecoder.decode(cookie.getValue(), StandardCharsets.UTF_8);
                    return ResponseEntity.ok(Map.of("lastPage", decoded));
                }
            }
        }

        // 2️⃣ Fallback mémoire spécifique à l'utilisateur
        if (memoryStorePerUser.containsKey(encodedEmail)) {
            return ResponseEntity.ok(Map.of("lastPage", memoryStorePerUser.get(encodedEmail)));
        }

        // 3️⃣ Par défaut
        return ResponseEntity.ok(Map.of("lastPage", "/"));
    }

    /** Supprimer le cookie pour un utilisateur spécifique */
    @DeleteMapping("/last-page")
    public ResponseEntity<Map<String, String>> deleteLastPage(
            @RequestParam String email,
            HttpServletResponse response
    ) {
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email manquant"));
        }

        String encodedEmail = encodeEmailForCookie(email);
        String cookieName = "lastPage_" + encodedEmail;

        // ✅ Supprime seulement ce cookie pour l'utilisateur
        memoryStorePerUser.remove(encodedEmail);

        ResponseCookie rc = ResponseCookie.from(cookieName, "")
                .path("/")
                .maxAge(0)
                .httpOnly(false)
                .secure(false)
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, rc.toString());

        return ResponseEntity.ok(Map.of("message", "Cookie supprimé avec succès"));
    }

    /** Liste tous les cookies lastPage_* du navigateur */
    @GetMapping("/all-last-pages")
    public ResponseEntity<Map<String, String>> getAllLastPages(HttpServletRequest request) {
        Map<String, String> cookiesMap = new HashMap<>();

        if (request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                if (cookie.getName().startsWith("lastPage_")) {
                    String decoded = URLDecoder.decode(cookie.getValue(), StandardCharsets.UTF_8);
                    cookiesMap.put(cookie.getName(), decoded);
                }
            }
        }

        // ✅ On ne renvoie que le fallback mémoire spécifique pour les cookies absents
        memoryStorePerUser.forEach((encodedEmail, page) -> {
            String cookieName = "lastPage_" + encodedEmail;
            cookiesMap.putIfAbsent(cookieName, page);
        });

        return ResponseEntity.ok(cookiesMap);
    }
}
