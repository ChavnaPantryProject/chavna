package com.chavna.pantryproject;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder.BCryptVersion;
import org.springframework.validation.Errors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.chavna.pantryproject.Authorization.GoogleLogin;
import com.chavna.pantryproject.Authorization.Login;
import com.chavna.pantryproject.Authorization.NormalLogin;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwe;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwt;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.JwtVisitor;
import io.jsonwebtoken.Jwts;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import static com.chavna.pantryproject.Database.USERS_TABLE;

import static com.chavna.pantryproject.Env.CHAVNA_URL;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import lombok.AllArgsConstructor;

@RestController
public class UserAccountController {
    public static final Pattern emailValidation = Pattern.compile("(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|\"(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21\\x23-\\x5b\\x5d-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])*\")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21-\\x5a\\x53-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])+)\\])");

    public static class LoginRequest {
        @NotNull
        public String email;
        @NotNull
        public String password;
    }

    public static class LoginResponse {
        public String jwt;

        public LoginResponse(String jwt) {
            this.jwt = jwt;
        }
    }

    @PostMapping("/login")
    public Response login(@Valid @RequestBody LoginRequest request, Errors errors) throws SQLException {
        if (errors.hasErrors())
           return Response.Error(HttpStatus.BAD_REQUEST, errors.getAllErrors().get(0).toString());
        
        Connection con = Database.getRemoteConnection();

        PreparedStatement statement = con.prepareStatement("SELECT password_hash, id, login_state FROM " + USERS_TABLE + " where email = ?");
        statement.setString(1, request.email);
        ResultSet results = statement.executeQuery();

        if (results.next()) {
            byte[] hash = results.getBytes(1);
            UUID id = (UUID) results.getObject(2);
            UUID loginState = (UUID) results.getObject(3);

            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(BCryptVersion.$2B, 8);
            if (encoder.matches(request.password, new String(hash, StandardCharsets.UTF_8))) {
                String jws = Authorization.createLoginToken(id, loginState);
                        
                return Response.Success("Succesful login.", new LoginResponse(jws));
            }
        }

        return Response.Fail("Invalid login credentials");
    }

    static final String GOOGLE_PASSWORD_STRING = "GoogleAccount";
    static final byte[] GOOGLE_PASSWORD_HASH = createGoogleHash();

    static byte[] createGoogleHash() {
        byte[] bytes = GOOGLE_PASSWORD_STRING.getBytes();

        byte[] hash = new byte[60];

        for (int i = 0; i < bytes.length; i++) {
            hash[i] = bytes[i];
        }
        
        return hash;
    }

    static final String GOOGLE_AUTH_FAIL = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Redirect</title>
        </head>
        <body>
            <script>
                window.location.replace("%s" + '?success=false&message="' + "%s" + '"');
            </script>
        </body>
        </html>
    """;

    @GetMapping("/google-login")
    public ResponseEntity<String> googleLogin(@RequestParam Map<String, String> params) {
        for (String param : params.keySet()) {
            System.out.println(param + ": " + params.get(param));
        }

        String authHTML;
        if (params.size() == 0) {
            authHTML = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Redirect</title>
                </head>
                <body>
                    <script>
                        if (window.location.hash.length > 1) {
                            var newloc = window.location.href.split('#')[0] + "?" + window.location.hash.substring(1);
                            console.log(newloc);
                            window.location.replace(newloc);
                        }
                        else
                            document.body.innerHTML = "args";
                    </script>
                </body>
                </html>
            """;
        } else {
            String clientId = Env.getenvNotNull("GOOGLE_CLIENT_ID");
            System.out.println();
            System.out.println(GsonFactory.getDefaultInstance());
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Arrays.asList(clientId))
                .build();

            System.out.println(verifier);

            String accessToken = params.get("id_token");

            GoogleIdToken googleIdToken;
            try {
                googleIdToken = verifier.verify(accessToken);
            } catch (GeneralSecurityException | IOException ex) {
                ex.printStackTrace();
                throw new ResponseException(Response.Error(HttpStatus.INTERNAL_SERVER_ERROR, "Google login error."));
            }

            String email = googleIdToken.getPayload().getEmail();
            System.out.println(email);
            String loginToken;

            // Check if account exists
            try {
                Connection con = Database.getRemoteConnection();

                PreparedStatement emailStatement = con.prepareStatement(String.format("""
                    SELECT id, password_hash FROM %s
                    WHERE email = ?
                """, USERS_TABLE));
                emailStatement.setString(1, email);
                ResultSet result = emailStatement.executeQuery();

                if (!result.next()) {
                    // Create user if not exists
                    PreparedStatement createUserStatement = con.prepareStatement(String.format("""
                        INSERT INTO %s (email, password_hash)
                        VALUES (?, ?)
                        RETURNING id, password_hash
                    """, USERS_TABLE));
                    createUserStatement.setString(1, email);
                    createUserStatement.setBytes(2, GOOGLE_PASSWORD_HASH);

                    result = createUserStatement.executeQuery();
                    result.next();
                }

                UUID userId = (UUID) result.getObject(1);
                byte[] passwordHash = result.getBytes(2);

                if (!Arrays.equals(passwordHash, GOOGLE_PASSWORD_HASH)) {
                    String html = String.format(GOOGLE_AUTH_FAIL, params.get("state"), "Non Google account with given email already exists.");

                    return ResponseEntity.ok(html);
                }

                loginToken = Authorization.createGmailLoginToken(userId, accessToken);
            } catch (SQLException ex) {
                ex.printStackTrace();
                throw Database.getSQLErrorHTTPResponseException();
            }

            authHTML = String.format("""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Redirect</title>
                </head>
                <body>
                    <script>
                        window.location.replace("%s")
                    </script>
                </body>
                </html>
            """, params.get("state") + "?success=true&token=" + loginToken);
        }
        return ResponseEntity.ok(authHTML);
    }
    
    public static class UserExistsRequest {
        @NotNull
        public String email;
    }

    @AllArgsConstructor
    public static class UserExistsResponse {
        public boolean exists;
    }

    @PostMapping("/user-exists")
    public Response userExists(@Valid @RequestBody UserExistsRequest request, Errors errors) throws SQLException {
        if (errors.hasErrors())
            return Response.Error(HttpStatus.BAD_REQUEST, errors.getAllErrors().get(0).toString());

        Connection con = Database.getRemoteConnection();

        PreparedStatement statement = con.prepareStatement("SELECT 1 FROM " + USERS_TABLE + " where email = ?");
        statement.setString(1, request.email);
        ResultSet results = statement.executeQuery();

        if (results.next())
            return Response.Success(new UserExistsResponse(results.getInt(1) == 1));

        return Response.Success(false);
    }

    public static class CreateAccountRequest {
        @NotNull
        public String email;
        @NotNull
        public String password;
    }

    @PostMapping("/create-account")
    public Response createAccount(@Valid @RequestBody CreateAccountRequest request, Errors errors) {
        if (errors.hasErrors())
            return Response.Error(HttpStatus.BAD_REQUEST, errors.getAllErrors().get(0).toString());

        if (!emailValidation.matcher(request.email).matches())
            return Response.Fail("Invalid email address.");

        try {
            Connection con = Database.getRemoteConnection();

            PreparedStatement statement = con.prepareStatement("SELECT 1 FROM " + USERS_TABLE + " where email = ?");
            statement.setString(1, request.email);
            ResultSet results = statement.executeQuery();

            if (results.next())
                return Response.Error(HttpStatus.CONFLICT, "User with email already exists.");
        } catch (SQLException ex) {
            ex.printStackTrace();
            return Database.getSQLErrorHTTPResponse();
        }
        
        String token = Authorization.createSingupToken(request.email, request.password);

        String url = CHAVNA_URL + "confirm-account?token=" + token;
        String emailContent = String.format(
            """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title></title>
            </head>
            <body>
                <a href="%s">Click here to confirm your email address.</a>
            </body>
            </html>
            """
        , url);

        Email.sendEmail("noreply@email.chavnapantry.com", request.email, emailContent, "Account Confirmation");

        return Response.Success("Confirmation email sent.");
    }

    @GetMapping("/confirm-account")
    public ResponseEntity<String> confirmAccount(@RequestParam("token") String token) throws SQLException {
        JwtParser parser = Jwts.parser()
            .decryptWith(Authorization.encryptionKey)
            .build();

        Jwt<?, ?> parsed = parser.parse(token);

        JwtVisitor<CreateAccountRequest> visitor = new JwtVisitor<CreateAccountRequest>() {

            @Override
            public CreateAccountRequest visit(Jwt<?, ?> jwt) {
                throw new UnsupportedOperationException("Unimplemented method 'visit'");
            }

            @Override
            public CreateAccountRequest visit(Jws<?> jws) {
                throw new UnsupportedOperationException("Unimplemented method 'visit'");
            }

            @Override
            public CreateAccountRequest visit(Jwe<?> jwe) {
                Claims payload = (Claims) jwe.getPayload();

                CreateAccountRequest request = new CreateAccountRequest();
                request.email = (String) payload.get("email");
                request.password = (String) payload.get("password");

                return request;
            }
            
        };

        CreateAccountRequest request = parsed.accept(visitor);

        Connection con = Database.getRemoteConnection();

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(BCryptVersion.$2B, 8);
        String hash = encoder.encode(request.password);

        try {
            PreparedStatement statement = con.prepareStatement(String.format(
            """
                INSERT INTO %s (email, password_hash)
                    VALUES (?, ?)
            """, USERS_TABLE));
            statement.setString(1, request.email);
            statement.setBytes(2, hash.getBytes());
            statement.executeUpdate();
        }
        catch (SQLException ex) {
            ex.printStackTrace();
            if (ex.getSQLState().equals("23505"))
                throw new ResponseException(Response.Error(HttpStatus.INTERNAL_SERVER_ERROR, "User with email already exists."));

            throw Database.getSQLErrorHTTPResponseException();
        }

        return ResponseEntity.ok("Account succesfully created.");
    }

    @GetMapping("/refresh-token")
    public Response refreshToken(@RequestHeader("Authorization") String authorizationHeader) {
        Login login = Authorization.authorize(authorizationHeader);
        String newToken;
        if (login instanceof NormalLogin) {
            try {
                newToken = Authorization.createLoginToken(login.userId, ((NormalLogin) login).loginState);
            } catch (JwtException ex) {
                return Response.Error(HttpStatus.UNAUTHORIZED, ex.toString());
            }
        } else {
            newToken = Authorization.createGmailLoginToken(login.userId, ((GoogleLogin) login).googleToken);
        }

        return Response.Success("Authorized.", new LoginResponse(newToken));
    }

    @GetMapping("/verify")
    public ResponseEntity<String> sendVerificationEmail(@RequestParam("email") String email) {
        Email.verifyEmailAddress(email);

        return ResponseEntity.ok("Verification email sent.");
    }

    public static class FoodItemTemplate {
        @NotNull
        public String name;
        @NotNull
        public Double amount;
        @NotNull
        public String unit;
        @NotNull
        public Integer shelfLifeDays;
        @NotNull
        public String category;
    }
}