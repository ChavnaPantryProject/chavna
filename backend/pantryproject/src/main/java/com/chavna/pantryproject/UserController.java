package com.chavna.pantryproject;

import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
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

import com.chavna.pantryproject.Authorization.Login;

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

import static com.chavna.pantryproject.Database.FAMILY_MEMBER_TABLE;
import static com.chavna.pantryproject.Database.FAMILY_TABLE;
import static com.chavna.pantryproject.Database.PERSONAL_INFO_TABLE;
import static com.chavna.pantryproject.Database.USERS_TABLE;

import lombok.AllArgsConstructor;

@RestController
public class UserController {
    public static final String CHAVNA_URL = Env.getenvNotNull("SERVER_URL");

    public static enum FamilyRole {
        None,
        Owner,
        Member
    }

    //                          //
    //  USER RELATED REQUESTS   //
    //                          //

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

    @PostMapping("/user-exists")
    public ResponseEntity<OkResponse> userExists(@Valid @RequestBody UserExistsRequest request, Errors errors) throws SQLException {
        if (errors.hasErrors())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errors.getAllErrors().get(0).toString());

        Connection con = Database.getRemoteConnection();

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

        try {
            Connection con = Database.getRemoteConnection();

            PreparedStatement statement = con.prepareStatement("SELECT 1 FROM " + USERS_TABLE + " where email = ?");
            statement.setString(1, request.email);
            ResultSet results = statement.executeQuery();

            if (results.next())
                throw new ResponseStatusException(HttpStatus.CONFLICT, "User with email already exists.");
        } catch (SQLException ex) {
            ex.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, null);
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

        return ResponseEntity.ok(OkResponse.Success("Confirmation email sent."));
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
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "User with email already exists.");

            throw ex;
        }

        return ResponseEntity.ok("Account succesfully created.");
    }

    @GetMapping("/refresh-token")
    public ResponseEntity<OkResponse> refreshToken(@RequestHeader("Authorization") String authorizationHeader) {
        try {
            Login login = Authorization.authorize(authorizationHeader);

            String newToken = Authorization.createLoginToken(login.userId, login.loginState);
            return ResponseEntity.ok(OkResponse.Success("Authorized.", new LoginResponse(newToken)));
        } catch (JwtException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, ex.toString());
        }
    }

    //                          //
    //  PERSONAL INFO REQUESTS  //
    //                          //

    private static class GetPersonalInfoRequest {
        public String email;
        public UUID userId;
    }

    @AllArgsConstructor
    private static class GetPersonalInfoResponse {
        @SuppressWarnings("unused")
        public HashMap<String, Object> personal_info;
    }

    @PostMapping("/get-personal-info")
    public ResponseEntity<OkResponse> getPersonalInfo(@RequestHeader(value = "Authorization", required = false) String authorizationHeader, @RequestBody GetPersonalInfoRequest requestBody) {
        if (requestBody == null || (requestBody.email == null && requestBody.userId == null))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body must contain a user email or a user id.");
        else if (requestBody.email != null && requestBody.userId != null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body may only contain email or user id, not both.");

        Connection con = Database.getRemoteConnection();

        UUID authorizedUser;
        if (authorizationHeader != null)
            authorizedUser = Authorization.authorize(authorizationHeader).userId;
        else
            authorizedUser = null;
        
        UUID requestedUser;
        try {
            if (requestBody.email != null) {
                // Check if user exists
                PreparedStatement idFromEmailStatement = con.prepareStatement(String.format("""
                    SELECT id FROM %s WHERE email = ?
                """, USERS_TABLE));
                idFromEmailStatement.setString(1, requestBody.email);
                ResultSet query = idFromEmailStatement.executeQuery();

                if (query.next())
                    requestedUser = (UUID) query.getObject(1);
                else
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User with provided e-mail does not exist.");
            } else {
                requestedUser = requestBody.userId;

                PreparedStatement userExistsStatement = con.prepareStatement(String.format(
                """
                    SELECT 1 FROM %s WHERE id = ?
                """, USERS_TABLE));
                userExistsStatement.setObject(1, requestedUser);
                ResultSet result = userExistsStatement.executeQuery();

                if (!result.next())
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User with provided id does not exist.");
            }

            HashMap<String, Object> jsonObject = Database.getUserPersonalInfo(con, requestedUser);

            // Check authorization if user's profie isn't public
            if (!(boolean) jsonObject.get("public")) {

                if (!requestedUser.equals(authorizedUser))
                    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User has private personal info. Authorization required.");
            }

            return ResponseEntity.ok().body(OkResponse.Success(jsonObject));
        } catch (SQLException ex) {
            ex.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, null, ex);
        }
    }

    private static String shortenString(String string, int amount) {
        return string.substring(0, Math.max(string.length() - amount, 0));
    }

    @PostMapping("/set-personal-info")
    public ResponseEntity<OkResponse> setPersonalInfo(@RequestHeader("Authorization") String authorizationHeader, @RequestBody HashMap<String, Object> requestBody) {
        Connection con = Database.getRemoteConnection();
        UUID user = Authorization.authorize(authorizationHeader).userId;
        if (requestBody.containsKey("user_id"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid column: \"user_id\"");
        
        requestBody.put("user_id", user);

        try {
            HashMap<String, Object> defaultInfo = Database.getDefaultTableEntry(con, PERSONAL_INFO_TABLE);
            String valuesString = "(";
            String columnsString = "(";
            String updateString = "";
            ArrayList<String> columns = new ArrayList<>();
            for (String columnName : requestBody.keySet()) {
                // Column name comes directly from our database schema, so no chance of SQL injection
                if (defaultInfo.containsKey(columnName)) {
                    valuesString += "?, ";
                    columnsString += columnName + ", ";
                    updateString += columnName + " = ?,\n";
                    
                    columns.add(columnName);
                } else
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, String.format("Invalid column: \"%s\"", columnName));
            }
            valuesString = shortenString(valuesString, 2) + ")";
            columnsString = shortenString(columnsString, 2) + ")";
            updateString = shortenString(updateString, 2) + ";";

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

    //                  //
    //  FAMILY REQUESTS //
    //                  //

    @PostMapping("create-family")
    public ResponseEntity<OkResponse> createFamily(@RequestHeader("Authorization") String authorizationHeader) {
        UUID user = Authorization.authorize(authorizationHeader).userId;
        
        try {
            Connection con = Database.getRemoteConnection();

            // Error if alreayd part of family
            PreparedStatement checkFamilyQuery = con.prepareStatement(String.format(
                """
                SELECT family_membership FROM %s WHERE id = ?
                """, USERS_TABLE));
            checkFamilyQuery.setObject(1, user);
            ResultSet result = checkFamilyQuery.executeQuery();

            if (result.next()) {
                UUID memberId = (UUID) result.getObject(1);

                if (memberId != null)
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "User already part of a family.");
            }

            // Create the family
            PreparedStatement createFamilyQuery = con.prepareStatement(String.format(
                """
                INSERT INTO %s DEFAULT VALUES
                RETURNING family_id;
                """, FAMILY_TABLE));
            result = createFamilyQuery.executeQuery();
            result.next();
            UUID familyId = (UUID) result.getObject(1);

            // Create family membership
            PreparedStatement createMembershipQuery = con.prepareStatement(String.format(
                """
                INSERT INTO %s (role, family_id)
                VALUES (?, ?)
                RETURNING member_id;
                """, FAMILY_MEMBER_TABLE));
            createMembershipQuery.setInt(1, FamilyRole.Owner.ordinal());
            createMembershipQuery.setObject(2, familyId);
            result = createMembershipQuery.executeQuery();
            result.next();
            UUID memberId = (UUID) result.getObject(1);

            // Update member_id
            PreparedStatement updateQuery = con.prepareStatement(String.format(
                """
                UPDATE %s
                SET family_membership = ?
                WHERE id = ?;
                """, USERS_TABLE));
            updateQuery.setObject(1, memberId);
            updateQuery.setObject(2, user);
            updateQuery.executeUpdate();
        } catch (SQLException ex) {
            ex.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "SQL Error");
        }

        return ResponseEntity.ok().body(OkResponse.Success("Family created"));
    }

    @PostMapping("leave-family")
    public ResponseEntity<OkResponse> leaveFamily(@RequestHeader("Authorization") String authorizationHeader) {
        UUID user = Authorization.authorize(authorizationHeader).userId;
        
        try {
            Connection con = Database.getRemoteConnection();

            // Get membership
            PreparedStatement checkFamilyQuery = con.prepareStatement(String.format(
                """ 
                SELECT id, role, member_id FROM %s
                INNER JOIN %s
                ON family_membership = member_id
                WHERE id = ?;
                """, FAMILY_MEMBER_TABLE, USERS_TABLE));
            checkFamilyQuery.setObject(1, user);
            ResultSet result = checkFamilyQuery.executeQuery();

            if (!result.next())
                throw new ResponseStatusException(HttpStatus.CONFLICT, "User not part of a family.");

            FamilyRole role = FamilyRole.values()[result.getInt(2)];
            UUID memberId = (UUID) result.getObject(3);

            if (role == FamilyRole.Owner)
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot leave family as owner.");

            // Remove member
            PreparedStatement removeMemberQuery = con.prepareStatement(String.format(
                """
                DELETE FROM %s
                WHERE member_id = ?;
                """, FAMILY_MEMBER_TABLE));
            removeMemberQuery.setObject(1, memberId);
            removeMemberQuery.executeUpdate();
        } catch (SQLException ex) {
            ex.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "SQL Error");
        }

        return ResponseEntity.ok().body(OkResponse.Success("Left family"));
    }

    @PostMapping("delete-family")
    public ResponseEntity<OkResponse> deleteFamily(@RequestHeader("Authorization") String authorizationHeader) {
        UUID user = Authorization.authorize(authorizationHeader).userId;
        
        try {
            Connection con = Database.getRemoteConnection();

            // Get membership
            PreparedStatement checkFamilyQuery = con.prepareStatement(String.format(
                """ 
                SELECT id, role, family_id FROM %s
                INNER JOIN %s
                ON family_membership = member_id
                WHERE id = ?;
                """, FAMILY_MEMBER_TABLE, USERS_TABLE));
            checkFamilyQuery.setObject(1, user);
            ResultSet result = checkFamilyQuery.executeQuery();

            if (!result.next())
                throw new ResponseStatusException(HttpStatus.CONFLICT, "User not part of a family.");

            FamilyRole role = FamilyRole.values()[result.getInt(2)];
            UUID familyId = (UUID) result.getObject(3);

            if (role != FamilyRole.Owner)
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Only owner can delete family.");

            // Remove family
            PreparedStatement removeFamily = con.prepareStatement(String.format(
                """
                DELETE FROM %s
                WHERE family_id = ?;
                """, FAMILY_TABLE));
            removeFamily.setObject(1, familyId);
            removeFamily.executeUpdate();
        } catch (SQLException ex) {
            ex.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "SQL Error");
        }

        return ResponseEntity.ok().body(OkResponse.Success("Deleted family"));
    }

    public static class InvitationRequest {
        @NotNull
        public String email;
    }

    @PostMapping("/invite-to-family")
    public ResponseEntity<OkResponse> inviteToFamily(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody InvitationRequest requestBody, Errors errors) {
        if (errors.hasErrors())
           throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errors.getAllErrors().get(0).toString());
        UUID user = Authorization.authorize(authorizationHeader).userId;
        
        try {
            Connection con = Database.getRemoteConnection();
            // Verify email
            PreparedStatement emailQuery = con.prepareStatement(String.format(
                """
                SELECT id, invite_state FROM %s WHERE email = ?
                """, USERS_TABLE));
            emailQuery.setString(1, requestBody.email);
            ResultSet result = emailQuery.executeQuery();

            if (!result.next())
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User with email does not exist.");
            
            UUID recipientId = (UUID) result.getObject(1);
            UUID inviteState = (UUID) result.getObject(2);

            if (recipientId.equals(user))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot invite yourself.");

            // Get membership info
            PreparedStatement checkFamilyQuery = con.prepareStatement(String.format(
                """
                SELECT id, role, family_id FROM %s
                INNER JOIN %s
                ON family_membership = member_id
                WHERE id = ?;
                """, FAMILY_MEMBER_TABLE, USERS_TABLE));
            checkFamilyQuery.setObject(1, user);
            result = checkFamilyQuery.executeQuery();

            if (!result.next())
                throw new ResponseStatusException(HttpStatus.CONFLICT, "User not part of a family.");

            FamilyRole role = FamilyRole.values()[result.getInt(2)];
            UUID familyId = (UUID) result.getObject(3);

            if (role != FamilyRole.Owner)
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Only owner can invite members.");

            String token = Authorization.createInviteToken(recipientId, familyId, inviteState);

            String userIdentity = String.format("the family of %s", Database.getUserEmail(con, user));
            String url = CHAVNA_URL + "accept-invite?token=" + token;

            HashMap<String, Object> personalInfo = Database.getUserPersonalInfo(con, user);
            String name = (String) personalInfo.get("first_name");
            if (name != null)
                userIdentity = String.format("%s's", name);

            String message = String.format("You have been invited to %s family.", userIdentity);

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
                    %s<br><a href="%s">Click here to accept the invitation.</a>
                </body>
                </html>
                """
            , message, url);

            Email.sendEmail("noreply@email.chavnapantry.com", requestBody.email, emailContent, "Family Invitation Request.");
        } catch (SQLException ex) {
            ex.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "SQL Error.");
        }

        return ResponseEntity.ok().body(OkResponse.Success("Invitation sent."));
    }

    @GetMapping("/accept-invite")
    public ResponseEntity<String> acceptInvite(@RequestParam("token") String token) {
        JwtParser parser = Jwts.parser()
            .verifyWith(Authorization.jwtKey)
            .build();

        Jwt<?, ?> parsed = parser.parse(token);

        class Invite {
            public UUID recipientId;
            public UUID familyId;
            public UUID inviteState;
        }

        JwtVisitor<Invite> visitor = new JwtVisitor<Invite>() {
            @Override
            public Invite visit(Jwt<?, ?> jwt) {
                throw new UnsupportedOperationException("Unimplemented method 'visit'");
            }

            @Override
            public Invite visit(Jws<?> jws) {
                Claims payload = (Claims) jws.getPayload();

                Invite claim = new Invite();
                claim.recipientId = UUID.fromString((String) payload.get("recipient"));
                claim.familyId = UUID.fromString((String) payload.get("family_id"));
                claim.inviteState = UUID.fromString((String) payload.get("invite_state"));

                return claim;
            }

            @Override
            public Invite visit(Jwe<?> jwe) {
                throw new UnsupportedOperationException("Unimplemented method 'visit'");
            }
            
        };

        Invite invite = parsed.accept(visitor);

        try {
            Connection con = Database.getRemoteConnection();

            PreparedStatement checkFamilyQuery = con.prepareStatement(String.format(
                """
                SELECT family_membership, invite_state FROM %s WHERE id = ?
                """, USERS_TABLE));
            checkFamilyQuery.setObject(1, invite.recipientId);
            ResultSet result = checkFamilyQuery.executeQuery();

            if (!result.next())
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient id not found.");

            UUID memberId = (UUID) result.getObject(1);
            UUID inviteState = (UUID) result.getObject(2);

            // Error if alreayd part of family
            if (memberId != null)
                return ResponseEntity.ok("You are already part of a family.");

            // Check invite_state
            if (!inviteState.equals(invite.inviteState))
                return ResponseEntity.ok("Invalid invite.");

            // Create family membership
            PreparedStatement createMembershipQuery = con.prepareStatement(String.format(
                """
                INSERT INTO %s (role, family_id)
                VALUES (?, ?)
                RETURNING member_id;
                """, FAMILY_MEMBER_TABLE));
            createMembershipQuery.setInt(1, FamilyRole.Member.ordinal());
            createMembershipQuery.setObject(2, invite.familyId);
            result = createMembershipQuery.executeQuery();
            result.next();
            memberId = (UUID) result.getObject(1);

            // Update member_id and invite_state
            PreparedStatement updateQuery = con.prepareStatement(String.format(
                """
                UPDATE %s
                SET family_membership = ?, invite_state = gen_random_uuid()
                WHERE id = ?;
                """, USERS_TABLE));
            updateQuery.setObject(1, memberId);
            updateQuery.setObject(2, invite.recipientId);
            updateQuery.executeUpdate();
        } catch (SQLException ex) {
            ex.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "SQL Error");
        }
        
        return ResponseEntity.ok("Invite accepted.");
    }

    @AllArgsConstructor
    public static class FamilyMember {
        public UUID userId;
        public String email;
        public FamilyRole role;
    }

    @AllArgsConstructor
    public static class GetFamilyMemembersResponse {
        public ArrayList<FamilyMember> members;
    }

    @GetMapping("/get-family-members")
    public ResponseEntity<OkResponse> getFamilyMembers(@RequestHeader("Authorization") String authorizationHeader) {
        UUID user = Authorization.authorize(authorizationHeader).userId;

        try {
            Connection con = Database.getRemoteConnection();

            PreparedStatement query = con.prepareStatement(String.format(
                """
                WITH m AS (
                    SELECT id, family_id, email, role FROM %s
                    INNER JOIN %s
                    ON family_membership = member_id
                )

                SELECT id, email, role FROM m
                WHERE family_id = (
                    SELECT family_id FROM m
                    WHERE id = ?
                );
                """, FAMILY_MEMBER_TABLE, USERS_TABLE));
            query.setObject(1, user);
            ResultSet result = query.executeQuery();

            ArrayList<FamilyMember> members = new ArrayList<>();
            while (result.next()) {
                UUID id = (UUID) result.getObject(1);
                String email = result.getString(2);
                FamilyRole role = FamilyRole.values()[result.getInt(3)];

                members.add(new FamilyMember(id, email, role));
            }

            return ResponseEntity.ok().body(OkResponse.Success(new GetFamilyMemembersResponse(members)));
        } catch (SQLException ex) {
            ex.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "SQL Error");
        }
    }

    private static class RemoveFamilyMemberRequest {
        public String email;
        public UUID userId;
    }

    @PostMapping("/remove-family-member")
    public ResponseEntity<OkResponse> removeFamilyMember(@RequestHeader(value = "Authorization") String authorizationHeader, @RequestBody RemoveFamilyMemberRequest requestBody) {
        if (requestBody == null || (requestBody.email == null && requestBody.userId == null))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body must contain a user email or a user id.");
        else if (requestBody.email != null && requestBody.userId != null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body may only contain email or user id, not both.");

        UUID user = Authorization.authorize(authorizationHeader).userId;
        
        try {
            Connection con = Database.getRemoteConnection();

            // Get membership
            PreparedStatement checkFamilyQuery = con.prepareStatement(String.format(
                """ 
                SELECT id, role, family_id FROM %s
                INNER JOIN %s
                ON family_membership = member_id
                WHERE id = ?;
                """, FAMILY_MEMBER_TABLE, USERS_TABLE));
            checkFamilyQuery.setObject(1, user);
            ResultSet result = checkFamilyQuery.executeQuery();

            if (!result.next())
                throw new ResponseStatusException(HttpStatus.CONFLICT, "User not part of a family.");

            FamilyRole role = FamilyRole.values()[result.getInt(2)];
            UUID familyId = (UUID) result.getObject(3);

            if (role != FamilyRole.Owner)
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Only owner can delete family.");
            
            // Verify requested user
            UUID requestedUser;
            if (requestBody.email != null) {
                // Check if user exists
                PreparedStatement idFromEmailStatement = con.prepareStatement(String.format("""
                    SELECT id FROM %s WHERE email = ?
                """, USERS_TABLE));
                idFromEmailStatement.setString(1, requestBody.email);
                ResultSet query = idFromEmailStatement.executeQuery();

                if (query.next())
                    requestedUser = (UUID) query.getObject(1);
                else
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User with provided e-mail does not exist.");
            } else {
                requestedUser = requestBody.userId;

                PreparedStatement userExistsStatement = con.prepareStatement(String.format(
                """
                    SELECT 1 FROM %s WHERE id = ?
                """, USERS_TABLE));
                userExistsStatement.setObject(1, requestedUser);
                result = userExistsStatement.executeQuery();

                if (!result.next())
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User with provided id does not exist.");
            }

            if (user.equals(requestedUser))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot remove yourself.");

            // Verify requested user is part of family

            PreparedStatement checkFamilyQuery2 = con.prepareStatement(String.format(
                """ 
                SELECT member_id FROM %s
                INNER JOIN %s
                ON family_membership = member_id
                WHERE id = ? and family_id = ?;
                """, FAMILY_MEMBER_TABLE, USERS_TABLE));
            
            checkFamilyQuery2.setObject(1, requestedUser);
            checkFamilyQuery2.setObject(2, familyId);
            result = checkFamilyQuery2.executeQuery();

            if (!result.next())
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Requested user does not belong to your family.");

            UUID memberId = (UUID) result.getObject(1);

            // Remove member
            PreparedStatement removeMemberQuery = con.prepareStatement(String.format(
                """
                DELETE FROM %s
                WHERE member_id = ?;
                """, FAMILY_MEMBER_TABLE));
            removeMemberQuery.setObject(1, memberId);

            removeMemberQuery.executeUpdate();

            return ResponseEntity.ok().body(OkResponse.Success("Member removed."));
        } catch (SQLException ex) {
            ex.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, null, ex);
        }
    }

    @GetMapping("/verify")
    public ResponseEntity<String> sendVerificationEmail(@RequestParam("email") String email) {
        Email.verifyEmailAddress(email);

        return ResponseEntity.ok("Verification email sent.");
    }
}
