package com.chavna.pantryproject;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
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
import io.jsonwebtoken.JwtParser;
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

    public static String createLoginToken(UUID userId, UUID loginState) {
        String jws = Jwts.builder()
            .issuedAt(Date.from(Instant.now()))
            .claim("user_id", userId)
            .claim("login_state", loginState)
            .expiration(Date.from(Instant.now().plus(TOKEN_DURATION)))
            .signWith(jwtKey)
            .compact();
        
        return jws;
    }

    public static String createInviteToken(UUID recipient, UUID familyId, UUID inviteState) {
        String jws = Jwts.builder()
            .issuedAt(Date.from(Instant.now()))
            .claim("recipient", recipient)
            .claim("family_id", familyId)
            .claim("invite_state", inviteState)
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

    public static class Login {
        public UUID userId;
        public UUID loginState;
    }

    /**
    * Verifies JWS token and returns the user id associated with it.
    * @param  authorizationHeader  the full HTTP header containing the JWS token
    * @return      the user id assocciated with the token.
    */
    public static Login authorize(String authorizationHeader) {
        String[] split = authorizationHeader.split(" ");

        if (split.length != 2 || !split[0].equals("Bearer"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid authorization header.");

        String token = split[1];

        JwtParser parser = Jwts.parser()
            .verifyWith(jwtKey)
            .build();

        Jwt<?, ?> parsed = parser.parse(token);

        var visitor = new JwtVisitor<Login>() {

            @Override
            public Login visit(Jwt<?, ?> jwt) {
                throw new UnsupportedOperationException("Unimplemented method 'visit'");
            }

            @Override
            public Login visit(Jws<?> jws) {
                Claims payload = (Claims) jws.getPayload();

                Login login = new Login();
                login.userId = UUID.fromString((String) payload.get("user_id"));
                login.loginState = UUID.fromString((String) payload.get("login_state"));

                return login;
            }

            @Override
            public Login visit(Jwe<?> jwe) {
                throw new UnsupportedOperationException("Unimplemented method 'visit'");
            }
            
        };

        Login login = parsed.accept(visitor);

        // Get current login state
        try {
            Connection con = Database.getRemoteConnection();

            PreparedStatement query = con.prepareStatement(String.format(
                """
                SELECT login_state FROM %s
                WHERE id = ?
                """, UserController.USERS_TABLE));
            query.setObject(1, login.userId);
            ResultSet result = query.executeQuery();
            
            if (!result.next())
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User does not exist.");
            
            UUID loginState = (UUID) result.getObject(1);

            if (!loginState.equals(login.loginState))
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid login token.");
        } catch (SQLException ex) {
            ex.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "SQL Error.");
        }

        return login;
    }
}
