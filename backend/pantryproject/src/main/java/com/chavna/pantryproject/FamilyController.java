package com.chavna.pantryproject;

import static com.chavna.pantryproject.Database.FAMILY_MEMBER_TABLE;
import static com.chavna.pantryproject.Database.FAMILY_TABLE;
import static com.chavna.pantryproject.Database.USERS_TABLE;

import static com.chavna.pantryproject.Env.CHAVNA_URL;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.JwtVisitor;
import io.jsonwebtoken.Jwts;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;

@RestController
public class FamilyController {
    public static enum FamilyRole {
        None,
        Owner,
        Member
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
            throw Database.getSQLErrorHTTPResponse();
        }

        return OkResponse.Success("Family created");
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
            throw Database.getSQLErrorHTTPResponse();
        }

        return OkResponse.Success("Left family");
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
            throw Database.getSQLErrorHTTPResponse();
        }

        return OkResponse.Success("Deleted family");
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
            throw Database.getSQLErrorHTTPResponse();
        }

        return OkResponse.Success("Invitation sent.");
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
            throw Database.getSQLErrorHTTPResponse();
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

            return OkResponse.Success(new GetFamilyMemembersResponse(members));
        } catch (SQLException ex) {
            ex.printStackTrace();
            throw Database.getSQLErrorHTTPResponse();
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

            return OkResponse.Success("Member removed.");
        } catch (SQLException ex) {
            ex.printStackTrace();
            throw Database.getSQLErrorHTTPResponse();
        }
    }
}
