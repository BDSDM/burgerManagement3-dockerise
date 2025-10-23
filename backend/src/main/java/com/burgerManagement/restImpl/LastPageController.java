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
import java.util.Map;

@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
@RestController
@RequestMapping("/cookies")
public class LastPageController {

    private static final int ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

    /** ✅ Crée ou met à jour le cookie de dernière page (lié à un utilisateur) */
    @PostMapping("/last-page")
    public ResponseEntity<?> setLastPage(@RequestBody Map<String, String> body, HttpServletResponse response) {
        String page = body.get("page");
        String email = body.get("email");

        if (page == null || page.trim().isEmpty()) {
            System.out.println("[setLastPage] Page manquante");
            return ResponseEntity.badRequest().body(Map.of("error", "Page missing"));
        }
        if (email == null || email.trim().isEmpty()) {
            System.out.println("[setLastPage] Email manquant");
            return ResponseEntity.badRequest().body(Map.of("error", "Email missing"));
        }

        // Normalise et encode l’email
        String encodedEmail = URLEncoder.encode(email.trim().toLowerCase(), StandardCharsets.UTF_8);
        String cookieName = "lastPage_" + encodedEmail;

        ResponseCookie rc = ResponseCookie.from(cookieName, URLEncoder.encode(page.trim(), StandardCharsets.UTF_8))
                .path("/")
                .maxAge(ONE_YEAR_SECONDS)
                .httpOnly(false)
                .secure(false)
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, rc.toString());

        System.out.println("[setLastPage] Cookie créé/mis à jour : " + cookieName + " = " + page);

        return ResponseEntity.ok(Map.of("lastPage", page));
    }

    /** ✅ Récupère la dernière page visitée pour un utilisateur donné */
    @GetMapping("/last-page")
    public ResponseEntity<?> getLastPage(@RequestParam("email") String email, HttpServletRequest request) {
        if (email == null || email.trim().isEmpty()) {
            System.out.println("[getLastPage] Email manquant");
            return ResponseEntity.badRequest().body(Map.of("error", "Email missing"));
        }

        String encodedEmail = URLEncoder.encode(email.trim().toLowerCase(), StandardCharsets.UTF_8);
        String cookieName = "lastPage_" + encodedEmail;

        System.out.println("[getLastPage] Recherche du cookie : " + cookieName);

        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie c : request.getCookies()) {
                System.out.println("[getLastPage] Cookie trouvé : " + c.getName() + " = " + c.getValue());
                if (cookieName.equals(c.getName())) {
                    String decoded = URLDecoder.decode(c.getValue(), StandardCharsets.UTF_8);
                    System.out.println("[getLastPage] Dernière page trouvée pour " + email + " : " + decoded);
                    return ResponseEntity.ok(Map.of("lastPage", decoded));
                }
            }
        }

        System.out.println("[getLastPage] Aucun cookie trouvé pour " + email + ", valeur par défaut '/'");
        return ResponseEntity.ok(Map.of("lastPage", "/"));
    }

    /** ✅ Supprime le cookie de dernière page pour un utilisateur donné */
    @DeleteMapping("/last-page")
    public ResponseEntity<?> deleteLastPage(@RequestParam("email") String email, HttpServletResponse response) {
        if (email == null || email.trim().isEmpty()) {
            System.out.println("[deleteLastPage] Email manquant");
            return ResponseEntity.badRequest().body(Map.of("error", "Email missing"));
        }

        String encodedEmail = URLEncoder.encode(email.trim().toLowerCase(), StandardCharsets.UTF_8);
        String cookieName = "lastPage_" + encodedEmail;

        ResponseCookie rc = ResponseCookie.from(cookieName, "")
                .path("/")
                .maxAge(0)
                .httpOnly(false)
                .secure(false)
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, rc.toString());
        System.out.println("[deleteLastPage] Cookie supprimé : " + cookieName);

        return ResponseEntity.ok(Map.of("message", "lastPage deleted"));
    }

    /** ✅ Récupère tous les cookies lastPage existants */
    @GetMapping("/all-last-pages")
    public ResponseEntity<?> getAllLastPages(HttpServletRequest request) {
        if (request.getCookies() == null) {
            System.out.println("[getAllLastPages] Aucun cookie trouvé");
            return ResponseEntity.ok(Map.of()); // aucun cookie
        }

        Map<String, String> lastPages = new java.util.HashMap<>();

        for (jakarta.servlet.http.Cookie c : request.getCookies()) {
            if (c.getName().startsWith("lastPage_")) {
                String decoded = URLDecoder.decode(c.getValue(), StandardCharsets.UTF_8);
                lastPages.put(c.getName(), decoded);
                System.out.println("[getAllLastPages] Cookie lastPage trouvé : " + c.getName() + " = " + decoded);
            }
        }

        return ResponseEntity.ok(lastPages);
    }

}
