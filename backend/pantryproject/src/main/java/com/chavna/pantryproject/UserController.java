package com.chavna.pantryproject;

import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.apache.coyote.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwe;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwt;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.JwtVisitor;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@RestController
public class UserController {
    private static Logger logger = LoggerFactory.getLogger(UserController.class);
    private static final String USERS_TABLE = "users";
    private static final Duration TOKEN_DURATION = Duration.ofDays(14);

    public static class OkResponse {
        @Getter
        private String success;
        @Getter
        private Object payload;
        @Getter
        private String message;

        private OkResponse(String success, Object payload, String message) {
            this.success = success;
            this.payload = payload;
            this.message = message;
        }

        public static OkResponse Success() {
            return new OkResponse("success", null, null);
        }

        public static OkResponse Success(String message) {
            return new OkResponse("success", null, message);
        }

        public static OkResponse Success(Object payload) {
            return new OkResponse("success", payload, null);
        }

        public static OkResponse Success(String message, Object payload) {
            return new OkResponse("success", payload, message);
        }

        public static OkResponse Error() {
            return new OkResponse("error", null, null);
        }

        public static OkResponse Error(String message) {
            return new OkResponse("error", null, message);
        }
    }

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

    public static class LoginPayload {
        public String jwtToken;

        public LoginPayload(String jwtToken) {
            this.jwtToken = jwtToken;
        }
    }

    public static SecretKey getJWTKey() {
        String secret = System.getenv("JWT_SECRET");
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }

    private static String createToken() {
        String jws = Jwts.builder()
            .issuedAt(Date.from(Instant.now()))
            .expiration(Date.from(Instant.now().plus(TOKEN_DURATION)))
            .signWith(getJWTKey())
            .compact();
        
        return jws;
    }

    @PostMapping("/login")
    public ResponseEntity<OkResponse> login(@Valid @RequestBody LoginRequest request, Errors errors) throws BadRequestException, SQLException {
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
                String jws = createToken();
                        
                return ResponseEntity.ok(OkResponse.Success("Succesful login.", new LoginPayload(jws)));
            }
        }

        return ResponseEntity.ok(OkResponse.Error("Invalid login credentials"));
    }

    public static class UserExistsRequest {
        @NotNull
        public String email;
    }

    public static class UserExistsResponse {
        public boolean exists;
    }

    @GetMapping("/user-exists")
    public ResponseEntity<OkResponse> userExists(@Valid @RequestBody UserExistsRequest request, Errors errors) throws SQLException {
        if (errors.hasErrors())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errors.getAllErrors().get(0).toString());

        var con = getRemoteConnection();

        PreparedStatement statement = con.prepareStatement("SELECT 1 FROM " + USERS_TABLE + " where email = ?");
        statement.setString(1, request.email);
        ResultSet results = statement.executeQuery();

        if (results.next())
            return ResponseEntity.ok(OkResponse.Success(results.getInt(1) == 1));

        return ResponseEntity.ok(OkResponse.Success(false));
    }

    public static class CreateAccountRequest {
        @NotNull
        public String email;
        @NotNull
        public String password;
    }

    public static class ParsedJWT {
        private Object value;

        private ParsedJWT(Object value) {
            this.value = value;
        }
        
        public Claims asClaims() {
            if (value instanceof Claims)
                return (Claims) value;
            
            throw new RuntimeException("Not a Claims value.");
        }

        public byte[] asBytes() {
            if (value instanceof byte[])
                return (byte[]) value;
            
            throw new RuntimeException("Not a byte[] value.");
        }

        public boolean isClaims() {
            return value instanceof Claims;
        }

        public boolean isBytes() {
            return value instanceof byte[];
        }
    }

    @PostMapping("/create-account")
    public ResponseEntity<OkResponse> createAccount(@Valid @RequestBody CreateAccountRequest request, Errors errors) throws SQLException {
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
        return ResponseEntity.ok(OkResponse.Success("Account created succesfully"));
    }

    private ParsedJWT authorize(String authorizationHeader) {
        String[] split = authorizationHeader.split(" ");
        System.err.println(authorizationHeader);

        if (split.length != 2 || !split[0].equals("Bearer"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid authorization header.");

        String token = split[1];

        var parser = Jwts.parser()
            .verifyWith(getJWTKey())
            .build();

        var parsed = parser.parse(token);

        var visitor = new JwtVisitor<ParsedJWT>() {

            @Override
            public ParsedJWT visit(Jwt<?, ?> jwt) {
                throw new UnsupportedOperationException("Unimplemented method 'visit'");
            }

            @Override
            public ParsedJWT visit(Jws<?> jws) {
                Object payload = jws.getPayload();

                return new ParsedJWT(payload);
            }

            @Override
            public ParsedJWT visit(Jwe<?> jwe) {
                throw new UnsupportedOperationException("Unimplemented method 'visit'");
            }
            
        };

        return parsed.accept(visitor);
    }

    @GetMapping("/test-auth")
    public ResponseEntity<OkResponse> testAuth(@RequestHeader("Authorization") String authorizationHeader) throws SQLException {
        try {
            authorize(authorizationHeader);
        } catch (JwtException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, ex.toString());
        }

        return ResponseEntity.ok(OkResponse.Success("Authorized."));
    }

    @GetMapping("/refresh-token")
    public ResponseEntity<OkResponse> refreshToken(@RequestHeader("Authorization") String authorizationHeader) {
        try {
            authorize(authorizationHeader);
        } catch (JwtException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, ex.toString());
        }

        String newToken = createToken();

        return ResponseEntity.ok(OkResponse.Success("Authorized.", new LoginPayload(newToken)));
    }
}