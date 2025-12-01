package com.chavna.pantryproject;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.http.HttpStatus;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwe;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwt;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.JwtVisitor;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;

public class Authorization {
    public static SecretKey encryptionKey = Jwts.ENC.A256CBC_HS512.key().build();
    public static SecretKey jwtKey = getJWTKey();

    public static final Duration TOKEN_DURATION = Duration.ofDays(14);
    public static final Duration INVITE_DURATION = Duration.ofDays(30);

    public static SecretKey getJWTKey() {
        String secret = Env.getenvNotNull("JWT_SECRET");
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }

    public static String createGmailLoginToken(UUID userId, String googleToken) {
        String jws = Jwts.builder()
            .issuedAt(Date.from(Instant.now()))
            .claim("user_id", userId)
            .claim("google_token", googleToken)
            .expiration(Date.from(Instant.now().plus(TOKEN_DURATION)))
            .signWith(jwtKey)
            .compact();
        
        return jws;
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

    public static abstract class Login {
        public UUID userId;
    }

    public static class NormalLogin extends Login {
        public UUID loginState;
    }

    public static class GoogleLogin extends Login {
        public String googleToken;
    }

    /**
    * Verifies JWS token and returns the user id associated with it.
    * @param  authorizationHeader  the full HTTP header containing the JWS token
    * @return      the user id assocciated with the token.
    */
    public static Login authorize(String authorizationHeader) {
        String[] split = authorizationHeader.split(" ");

        if (split.length != 2 || !split[0].equals("Bearer"))
            throw new ResponseException(Response.Error(HttpStatus.BAD_REQUEST, "Invalid authorization header."));

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

                Login login;
                if (payload.containsKey("google_token")) {
                    GoogleLogin googleLogin = new GoogleLogin();
                    googleLogin.userId = UUID.fromString((String) payload.get("user_id"));
                    googleLogin.googleToken = (String) payload.get("google_token");

                    login = googleLogin;
                } else {
                    NormalLogin normalLogin = new NormalLogin();
                    normalLogin.userId = UUID.fromString((String) payload.get("user_id"));
                    normalLogin.loginState = UUID.fromString((String) payload.get("login_state"));

                    login = normalLogin;
                }

                return login;
            }

            @Override
            public Login visit(Jwe<?> jwe) {
                throw new UnsupportedOperationException("Unimplemented method 'visit'");
            }
            
        };

        Login login = parsed.accept(visitor);

        if (login instanceof NormalLogin) {
            // Get current login state
            Database.openConnection((Connection con) -> {
                PreparedStatement query = con.prepareStatement(String.format(
                    """
                    SELECT login_state FROM %s
                    WHERE id = ?
                    """, Database.USERS_TABLE));
                query.setObject(1, login.userId);
                ResultSet result = query.executeQuery();
                
                if (!result.next())
                    throw new ResponseException(Response.Error(HttpStatus.NOT_FOUND, "User does not exist."));
                
                UUID loginState = (UUID) result.getObject(1);

                if (!loginState.equals(((NormalLogin) login).loginState))
                    throw new ResponseException(Response.Error(HttpStatus.UNAUTHORIZED, "Invalid login token."));

                return null;
            })
            .throwIfError()
            .throwResponse();
        } else {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Arrays.asList(Env.getenvNotNull("GOOGLE_CLIENT_ID")))
                .build();

            GoogleIdToken googleIdToken;
            try {
                googleIdToken = verifier.verify(((GoogleLogin) login).googleToken);
            } catch (GeneralSecurityException | IOException ex) {
                ex.printStackTrace();
                throw new ResponseException(Response.Error(HttpStatus.INTERNAL_SERVER_ERROR, "Google login error."));
            }

            if (googleIdToken == null)
                throw new ResponseException(Response.Error(HttpStatus.UNAUTHORIZED, "Invalid google login token."));
        }

        return login;
    }
}
