package com.chavna.pantryproject;

import java.sql.Connection;
import java.sql.DriverManager;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwe;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwt;
import io.jsonwebtoken.JwtVisitor;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

public class HelperFunctions {
    
    public static String getenvNotNull(String name) {
        String env = System.getenv(name);

        if (env == null)
            throw new RuntimeException("Environment variable '" + name + "' not set.");

        return env;
    }

    public static Connection getRemoteConnection() {
        try {
            Class.forName("org.postgresql.Driver");
            String use = System.getenv("USE_NEON_DATABASE");
            if (use != null && use.equals("1")) {
                String jdbcUrl = "jdbc:" + getenvNotNull("DATABASE_URL");
                return DriverManager.getConnection(jdbcUrl);
            }
                
            String hostname = getenvNotNull("RDS_HOSTNAME");
            String dbName = getenvNotNull("RDS_DB_NAME");
            String userName = getenvNotNull("RDS_USERNAME");
            String password = getenvNotNull("RDS_PASSWORD");
            String port = getenvNotNull("RDS_PORT");
            String jdbcUrl = "jdbc:postgresql://" + hostname + ":" + port + "/" + dbName + "?user=" + userName + "&password=" + password;
            return DriverManager.getConnection(jdbcUrl);
        }
        // Rethrow exceptions as RuntimeExceptions since spring boot is going to automatically catch them anyway.
        // I'd rather not be forced to explicitly deal with them if they arent going to crash the whole server.
        // Probably bad practice, but idc.
        catch (RuntimeException ex) { throw ex; }
        catch (Exception ex) { throw new RuntimeException(ex); }
    }

    public static SecretKey getJWTKey() {
        String secret = getenvNotNull("JWT_SECRET");
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }

    public static String createToken(UUID userId) {
        String jws = Jwts.builder()
            .issuedAt(Date.from(Instant.now()))
            .claim("UserId", userId)
            .expiration(Date.from(Instant.now().plus(UserController.TOKEN_DURATION)))
            .signWith(getJWTKey())
            .compact();
        
        return jws;
    }
    
    /**
    * Verifies JWS token and returns the user id associated with it.
    * @param  authorizationHeader  the full HTTP header containing the JWS token
    * @return      the user id assocciated with the token.
    */
    public static UUID authorize(String authorizationHeader) {
        String[] split = authorizationHeader.split(" ");
        System.err.println(authorizationHeader);

        if (split.length != 2 || !split[0].equals("Bearer"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid authorization header.");

        String token = split[1];

        var parser = Jwts.parser()
            .verifyWith(getJWTKey())
            .build();

        var parsed = parser.parse(token);

        var visitor = new JwtVisitor<UUID>() {

            @Override
            public UUID visit(Jwt<?, ?> jwt) {
                throw new UnsupportedOperationException("Unimplemented method 'visit'");
            }

            @Override
            public UUID visit(Jws<?> jws) {
                Claims payload = (Claims) jws.getPayload();

                return UUID.fromString((String) payload.get("UserId"));
            }

            @Override
            public UUID visit(Jwe<?> jwe) {
                throw new UnsupportedOperationException("Unimplemented method 'visit'");
            }
            
        };

        return parsed.accept(visitor);
    }
}
