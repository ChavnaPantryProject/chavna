package com.chavna.pantryproject;

import java.nio.charset.StandardCharsets;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Duration;
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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import io.jsonwebtoken.JwtException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import lombok.AllArgsConstructor;

@RestController
public class UserController {
    public static final String USERS_TABLE = "users";
    public static final Duration TOKEN_DURATION = Duration.ofDays(14);

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
    public ResponseEntity<OkResponse> createAccount(@Valid @RequestBody CreateAccountRequest request, Errors errors) throws SQLException {
        if (errors.hasErrors())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errors.getAllErrors().get(0).toString());
        
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

        return ResponseEntity.ok(OkResponse.Success("Account created succesfully"));
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
}