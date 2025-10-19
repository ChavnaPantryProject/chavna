package com.chavna.pantryproject;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
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

import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sesv2.SesV2Client;
import software.amazon.awssdk.services.sesv2.model.Body;
import software.amazon.awssdk.services.sesv2.model.Content;
import software.amazon.awssdk.services.sesv2.model.Destination;
import software.amazon.awssdk.services.sesv2.model.EmailContent;
import software.amazon.awssdk.services.sesv2.model.Message;
import software.amazon.awssdk.services.sesv2.model.SendEmailRequest;

public class HelperFunctions {
    public static SecretKey encryptionKey = Jwts.ENC.A256CBC_HS512.key().build();
    public static SecretKey jwtKey = getJWTKey();

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

    public static String createToken(UUID user_id) {
        String jws = Jwts.builder()
            .issuedAt(Date.from(Instant.now()))
            .claim("user_id", user_id)
            .expiration(Date.from(Instant.now().plus(UserController.TOKEN_DURATION)))
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

    public static String shortenString(String string, int amount) {
        return string.substring(0, Math.max(string.length() - amount, 0));
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

    public static HashMap<String, Object> objectFromResultSet(ResultSet resultSet) throws SQLException {
        ResultSetMetaData metadata = resultSet.getMetaData();

        HashMap<String, Object> map = new HashMap<>();
        for (int i = 1; i <= metadata.getColumnCount(); i++) {
            String columnName = metadata.getColumnName(i);
            Object obj = resultSet.getObject(i);
            map.put(columnName, obj);
        }

        return map;
    }

    public static HashMap<String, Object> getDefaultTableEntry(Connection dbConnection, String tableName) throws SQLException {
        HashMap<String, Object> object = new HashMap<>();

        PreparedStatement statement = dbConnection.prepareStatement("""
            SELECT column_name, column_default, data_type
            FROM information_schema.columns
            WHERE (table_schema, table_name) = ('public', ?)
            ORDER BY ordinal_position;
        """);
        statement.setString(1, tableName);
        ResultSet result = statement.executeQuery();

        while (result.next()) {
            String name = result.getString("column_name");
            String default_value = result.getString("column_default");
            String data_type = result.getString("data_type");

            // Schema stores default values as strings, so it must be cast to the correct type.
            // Unfortunately, I can't find a good way to do this in java rather than an sql query for each field.
            PreparedStatement castStatement = dbConnection.prepareStatement(String.format("""
                SELECT CAST(casted_value AS %s) FROM (VALUES (?)) AS temp_values (casted_value)
            """, data_type));
            castStatement.setString(1, default_value);
            ResultSet casted = castStatement.executeQuery();

            if (casted.next())
                object.put(name, casted.getObject(1));
        }

        return object;
    }

    public static void sendEmail(String from, String to, String htmlContent, String subject) {
        Region region = Region.US_EAST_1;
        SesV2Client client = SesV2Client.builder()
            .region(region)
            .build();
        
        Destination dest = Destination.builder()
            .toAddresses(to)
            .build();

        Content content = Content.builder()
            .data(htmlContent)
            .build();

        Content sub = Content.builder()
            .data(subject)
            .build();

        Body body = Body.builder()
            .html(content)
            .build();
        
        Message message = Message.builder()
            .subject(sub)
            .body(body)
            .build();

        EmailContent email = EmailContent.builder()
            .simple(message)
            .build();

        SendEmailRequest emailRequest = SendEmailRequest.builder()
            .destination(dest)
            .content(email)
            .fromEmailAddress(from)
            .build();

        client.sendEmail(emailRequest);
    }
}
