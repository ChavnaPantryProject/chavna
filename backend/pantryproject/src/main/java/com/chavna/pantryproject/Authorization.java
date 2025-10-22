package com.chavna.pantryproject;

import java.time.Duration;
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

public class Authorization {
    public static SecretKey encryptionKey = Jwts.ENC.A256CBC_HS512.key().build();
    public static SecretKey jwtKey = getJWTKey();

    public static final Duration TOKEN_DURATION = Duration.ofDays(14);
    public static final Duration INVITE_DURATION = Duration.ofDays(30);

    public static SecretKey getJWTKey() {
        String secret = Env.getenvNotNull("JWT_SECRET");
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }

    public static String createToken(UUID user_id) {
        String jws = Jwts.builder()
            .issuedAt(Date.from(Instant.now()))
            .claim("user_id", user_id)
            .expiration(Date.from(Instant.now().plus(TOKEN_DURATION)))
            .signWith(jwtKey)
            .compact();
        
        return jws;
    }

    public static String createInviteToken(UUID recipient, UUID familyId) {
        String jws = Jwts.builder()
            .issuedAt(Date.from(Instant.now()))
            .claim("recipient", recipient)
            .claim("family_id", familyId)
            .expiration(Date.from(Instant.now().plus(INVITE_DURATION)))
            .signWith(jwtKey)
            .compact();

        return jws;
    }

    public static String createSingupToken(String email, String password) {
        String jwe = Jwts.builder()
            .issuedAt(Date.from(Instant.now()))
            .claim("email", email)
            .claim("password", password)
            .expiration(Date.from(Instant.now().plus(Duration.ofMinutes(30))))
            .encryptWith(encryptionKey, Jwts.ENC.A256CBC_HS512)
            .compact();

        return jwe;
    }

    /**
    * Verifies JWS token and returns the user id associated with it.
    * @param  authorizationHeader  the full HTTP header containing the JWS token
    * @return      the user id assocciated with the token.
    */
    public static UUID authorize(String authorizationHeader) {
        String[] split = authorizationHeader.split(" ");

        if (split.length != 2 || !split[0].equals("Bearer"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid authorization header.");

        String token = split[1];

        var parser = Jwts.parser()
            .verifyWith(jwtKey)
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

                return UUID.fromString((String) payload.get("user_id"));
            }

            @Override
            public UUID visit(Jwe<?> jwe) {
                throw new UnsupportedOperationException("Unimplemented method 'visit'");
            }
            
        };

        return parsed.accept(visitor);
    }
}
