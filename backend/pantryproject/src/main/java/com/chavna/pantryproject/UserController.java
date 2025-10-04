package com.chavna.pantryproject;

import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import org.apache.coyote.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder.BCryptVersion;
import org.springframework.validation.Errors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

@RestController
public class UserController {
    private static Logger logger = LoggerFactory.getLogger(UserController.class);
    private static final String USERS_TABLE = "users";

    private static Connection getRemoteConnection() {
        try {
            Class.forName("org.postgresql.Driver");
            String use = System.getenv("USE_NEON_DATABASE");
            System.err.println("USE_NEON_DATABASE=\"" + use + "\"");
            if (use != null && use.equals("1")) {
                String jdbcUrl = "jdbc:" + System.getenv("DATABASE_URL");
                return DriverManager.getConnection(jdbcUrl);
            }
                
            String hostname = System.getenv("RDS_HOSTNAME");
            if (hostname != null) {
                String dbName = System.getenv("RDS_DB_NAME");
                String userName = System.getenv("RDS_USERNAME");
                String password = System.getenv("RDS_PASSWORD");
                String port = System.getenv("RDS_PORT");
                String jdbcUrl = "jdbc:postgresql://" + hostname + ":" + port + "/" + dbName + "?user=" + userName + "&password=" + password;
                return DriverManager.getConnection(jdbcUrl);
            }
        }
        // Rethrow exceptions as RuntimeExceptions since spring boot is going to automatically catch them anyway.
        // I'd rather not be forced to explicitly deal with them if they arent going to crash the whole server.
        // Probably bad practice, but idc.
        catch (RuntimeException ex) { throw ex; }
        catch (Exception ex) { throw new RuntimeException(ex); }

        throw new RuntimeException("nothing happened.");
    }

    public static class LoginRequest {
        @NotNull
        public String email;
        @NotNull
        public String password;
    }

    @PostMapping("/login")
    public void login(@Valid @RequestBody LoginRequest request, Errors errors) throws BadRequestException, SQLException {
        if (errors.hasErrors())
           throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errors.getAllErrors().get(0).toString());
        
        var con = getRemoteConnection();

        PreparedStatement statement = con.prepareStatement("SELECT password_hash FROM " + USERS_TABLE + " where email = ?");
        statement.setString(1, request.email);
        ResultSet results = statement.executeQuery();

        if (results.next()) {
            byte[] hash = results.getBytes(1);

            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(BCryptVersion.$2B, 8);
            if (encoder.matches(request.password, new String(hash, StandardCharsets.UTF_8))) {

                throw new ResponseStatusException(HttpStatus.OK, "Sucessful Login.");
            }
        }

        throw new ResponseStatusException(HttpStatus.OK, "Invalid Login Credentials.");
    }

    public static class UserExistsRequest {
        @NotNull
        public String email;
    }

    @GetMapping("/user-exists")
    public void userExists(@Valid @RequestBody UserExistsRequest request, Errors errors) throws SQLException {
        if (errors.hasErrors())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errors.getAllErrors().get(0).toString());

        var con = getRemoteConnection();

        PreparedStatement statement = con.prepareStatement("SELECT 1 FROM " + USERS_TABLE + " where email = ?");
        statement.setString(1, request.email);
        ResultSet results = statement.executeQuery();

        if (results.next())
            throw new ResponseStatusException(HttpStatus.OK, Boolean.toString(results.getInt(1) == 1));

        throw new ResponseStatusException(HttpStatus.OK, "false");
    }

    public static class CreateAccountRequest {
        @NotNull
        public String email;
        @NotNull
        public String password;
    }

    @PostMapping("/create-account")
    public void createAccount(@Valid @RequestBody CreateAccountRequest request, Errors errors) throws SQLException {
        if (errors.hasErrors())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errors.getAllErrors().get(0).toString());
        
        var con = getRemoteConnection();

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
                // return ResponseEntity.internalServerError().body("User with email already exists.");

            throw ex;
        }

        // This feels wrong, but I can't find another way to get an
        // auto generated JSON response
        throw new ResponseStatusException(HttpStatus.OK, "Account created succesfully");
    }
}