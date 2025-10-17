package com.chavna.pantryproject;

import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.UUID;

import org.apache.coyote.BadRequestException;
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
import org.springframework.web.server.ResponseStatusException;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwe;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwt;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.JwtVisitor;
import io.jsonwebtoken.Jwts;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import lombok.AllArgsConstructor;

@RestController
public class UserController {
    public static final String USERS_TABLE = "users";
    public static final String PERSONAL_INFO_TABLE = "personal_info";
    public static final Duration TOKEN_DURATION = Duration.ofDays(14);
    public static final String CHAVNA_URL = "https://api.chavnapantry.com/";

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
    public ResponseEntity<OkResponse> login(@Valid @RequestBody LoginRequest request, Errors errors) throws BadRequestException, SQLException {
        if (errors.hasErrors())
           throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errors.getAllErrors().get(0).toString());
        
        var con = HelperFunctions.getRemoteConnection();

        PreparedStatement statement = con.prepareStatement("SELECT password_hash, id FROM " + USERS_TABLE + " where email = ?");
        statement.setString(1, request.email);
        ResultSet results = statement.executeQuery();

        if (results.next()) {
            byte[] hash = results.getBytes(1);
            UUID id = (UUID) results.getObject(2);

            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(BCryptVersion.$2B, 8);
            if (encoder.matches(request.password, new String(hash, StandardCharsets.UTF_8))) {
                String jws = HelperFunctions.createToken(id);
                        
                return ResponseEntity.ok(OkResponse.Success("Succesful login.", new LoginResponse(jws)));
            }
        }

        return ResponseEntity.ok(OkResponse.Error("Invalid login credentials"));
    }

    public static class UserExistsRequest {
        @NotNull
        public String email;
    }

    @AllArgsConstructor
    public static class UserExistsResponse {
        public boolean exists;
    }

    @GetMapping("/user-exists")
    public ResponseEntity<OkResponse> userExists(@Valid @RequestBody UserExistsRequest request, Errors errors) throws SQLException {
        if (errors.hasErrors())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errors.getAllErrors().get(0).toString());

        var con = HelperFunctions.getRemoteConnection();

        PreparedStatement statement = con.prepareStatement("SELECT 1 FROM " + USERS_TABLE + " where email = ?");
        statement.setString(1, request.email);
        ResultSet results = statement.executeQuery();

        if (results.next())
            return ResponseEntity.ok(OkResponse.Success(new UserExistsResponse(results.getInt(1) == 1)));

        return ResponseEntity.ok(OkResponse.Success(false));
    }

    public static class CreateAccountRequest {
        @NotNull
        public String email;
        @NotNull
        public String password;
    }

    @PostMapping("/create-account")
    public ResponseEntity<OkResponse> createAccount(@Valid @RequestBody CreateAccountRequest request, Errors errors) {
        if (errors.hasErrors())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errors.getAllErrors().get(0).toString());
        
        String token = HelperFunctions.createSingupToken(request.email, request.password);

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
                Click <a href="%s">here</a> to confirm your email address.
            </body>
            </html>
            """
        , url);

        HelperFunctions.sendEmail("noreply@email.chavnapantry.com", request.email, emailContent, "Account Confirmation");

        return ResponseEntity.ok(OkResponse.Success("Confirmation email sent."));
    }

    @GetMapping("/confirm-account")
    public ResponseEntity<String> confirmAccount(@RequestParam("token") String token) throws SQLException {
        var parser = Jwts.parser()
            .decryptWith(HelperFunctions.encryptionKey)
            .build();

        var parsed = parser.parse(token);

        var visitor = new JwtVisitor<CreateAccountRequest>() {

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

        var con = HelperFunctions.getRemoteConnection();

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
            if (ex.getSQLState().equals("23505"))
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "User with email already exists.");

            throw ex;
        }

        return ResponseEntity.ok("Account succesfully created.");
    }
    
    @GetMapping("/test-auth")
    public ResponseEntity<OkResponse> testAuth(@RequestHeader("Authorization") String authorizationHeader) throws SQLException {
        try {
            UUID user = HelperFunctions.authorize(authorizationHeader);

            return ResponseEntity.ok(OkResponse.Success("Authorized as user id: " + user));
        } catch (JwtException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, ex.toString());
        }
    }

    @GetMapping("/refresh-token")
    public ResponseEntity<OkResponse> refreshToken(@RequestHeader("Authorization") String authorizationHeader) {
        try {
            UUID user = HelperFunctions.authorize(authorizationHeader);

            String newToken = HelperFunctions.createToken(user);
            return ResponseEntity.ok(OkResponse.Success("Authorized.", new LoginResponse(newToken)));
        } catch (JwtException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, ex.toString());
        }
    }

    private static class GetPersonalInfoRequest {
        public String email;
        public UUID userId;
    }

    @AllArgsConstructor
    private static class GetPersonalInfoResponse {
        @SuppressWarnings("unused")
        public HashMap<String, Object> personal_info;
    }

    @GetMapping("/get-personal-info")
    public ResponseEntity<OkResponse> getPersonalInfo(@RequestHeader(value = "Authorization", required = false) String authorizationHeader, @RequestBody GetPersonalInfoRequest requestBody) {
        if (requestBody == null || (requestBody.email == null && requestBody.userId == null))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body must contain a user email or a user id.");
        else if (requestBody.email != null && requestBody.userId != null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body may only contain email or user id, not both.");

        if (requestBody.email != null) {
            var con = HelperFunctions.getRemoteConnection();

            try {
                // Check if user exists
                PreparedStatement statement = con.prepareStatement(String.format("""
                    SELECT id FROM %s WHERE email = ?
                """, USERS_TABLE));
                statement.setString(1, requestBody.email);
                ResultSet query = statement.executeQuery();

                if (query.next()) {
                    UUID id = (UUID) query.getObject(1);
                    PreparedStatement statement2 = con.prepareStatement(String.format("""
                        SELECT * FROM %s WHERE user_id = ?
                    """, PERSONAL_INFO_TABLE));
                    statement2.setObject(1, id);
                    ResultSet query2 = statement2.executeQuery();
                    
                    HashMap<String, Object> jsonObject;
                    if (query2.next()) {
                        jsonObject = HelperFunctions.objectFromResultSet(query2);
                    } else {
                        jsonObject = HelperFunctions.getDefaultTableEntry(con, PERSONAL_INFO_TABLE);
                        jsonObject.put("user_id", id);
                    }

                    // Check authorization if user's profie isn't public
                    if (!(boolean) jsonObject.get("public")) {
                        UUID user;
                        if (authorizationHeader != null)
                            user = HelperFunctions.authorize(authorizationHeader);
                        else
                            user = null;

                        if (!id.equals(user))
                            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User has private personal info. Authorization required.");
                    }

                    return ResponseEntity.ok().body(OkResponse.Success(new GetPersonalInfoResponse(jsonObject)));
                }
            } catch (SQLException ex) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, null, ex);
            }
        } else {

        }

        return ResponseEntity.ok().body(null);
    }

    public static class Test {
        public String field;
    }

    @PostMapping("/set-personal-info")
    public ResponseEntity<OkResponse> setPersonalInfo(@RequestHeader("Authorization") String authorizationHeader, @RequestBody HashMap<String, Object> requestBody) {
        var con = HelperFunctions.getRemoteConnection();
        UUID user = HelperFunctions.authorize(authorizationHeader);
        requestBody.put("user_id", user);

        try {
            HashMap<String, Object> defaultInfo = HelperFunctions.getDefaultTableEntry(con, PERSONAL_INFO_TABLE);
            String valuesString = "(";
            String columnsString = "(";
            String updateString = "";
            ArrayList<String> columns = new ArrayList<>();
            for (String columnName : defaultInfo.keySet()) {
                // Column name comes directly from our database schema, so no chance of SQL injection
                if (requestBody.containsKey(columnName)) {
                    valuesString += "?, ";
                    columnsString += columnName + ", ";
                    updateString += columnName + " = ?,\n";
                    
                    columns.add(columnName);
                }
            }
            valuesString = HelperFunctions.shortenString(valuesString, 2) + ")";
            columnsString = HelperFunctions.shortenString(columnsString, 2) + ")";
            updateString = HelperFunctions.shortenString(updateString, 2) + ";";

            String statementString = String.format(
                """
                INSERT INTO %s %s
                VALUES %s
                ON CONFLICT (user_id) DO UPDATE SET
                """ + updateString, PERSONAL_INFO_TABLE, columnsString, valuesString);

            System.out.println(statementString);
            PreparedStatement statement = con.prepareStatement(statementString);

            for (int i = 1; i <= columns.size(); i++) {
                String columnName = columns.get(i - 1);
                Object obj = requestBody.get(columnName);
                statement.setObject(i, obj);
                statement.setObject(i + columns.size(), obj);
            }

            statement.executeUpdate();
        } catch (SQLException ex) {

        }

        return ResponseEntity.ok().body(OkResponse.Success());
    }

    @GetMapping("/")
    public ResponseEntity<String> index() {
        return ResponseEntity.ok().body("We have no website.");
    }
}