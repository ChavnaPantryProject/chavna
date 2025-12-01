package com.chavna.pantryproject;

import static com.chavna.pantryproject.Database.PERSONAL_INFO_TABLE;
import static com.chavna.pantryproject.Database.USERS_TABLE;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import lombok.AllArgsConstructor;

@RestController
public class PersonalInfoController {
    private static class GetPersonalInfoRequest {
        public String email;
        public UUID userId;
    }

    @AllArgsConstructor
    public static class GetPersonalInfoResponse {
        public Map<String, Object> personal_info;
    }

    @PostMapping("/get-personal-info")
    public Response getPersonalInfo(@RequestHeader(value = "Authorization", required = false) String authorizationHeader, @RequestBody GetPersonalInfoRequest requestBody) {
        if (requestBody == null || (requestBody.email == null && requestBody.userId == null))
            return Response.Error(HttpStatus.BAD_REQUEST, "Request body must contain a user email or a user id.");
        else if (requestBody.email != null && requestBody.userId != null)
            return Response.Error(HttpStatus.BAD_REQUEST, "Request body may only contain email or user id, not both.");

        UUID authorizedUser;
        if (authorizationHeader != null)
            authorizedUser = Authorization.authorize(authorizationHeader).userId;
        else
            authorizedUser = null;
        
        Database.openConnection((Connection con) -> {
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
                    return Response.Error(HttpStatus.NOT_FOUND, "User with provided e-mail does not exist.");
            } else {
                requestedUser = requestBody.userId;

                PreparedStatement userExistsStatement = con.prepareStatement(String.format(
                """
                    SELECT 1 FROM %s WHERE id = ?
                """, USERS_TABLE));
                userExistsStatement.setObject(1, requestedUser);
                ResultSet result = userExistsStatement.executeQuery();

                if (!result.next())
                    return Response.Error(HttpStatus.NOT_FOUND, "User with provided id does not exist.");
            }

            Map<String, Object> jsonObject = Database.getUserPersonalInfo(con, requestedUser);

            // Check authorization if user's profie isn't public
            if (!(boolean) jsonObject.get("public")) {

                if (!requestedUser.equals(authorizedUser))
                    return Response.Error(HttpStatus.UNAUTHORIZED, "User has private personal info. Authorization required.");
            }

            return Response.Success(new GetPersonalInfoResponse(jsonObject));
        })
        .throwIfError()
        .throwResponse();

        // This should be unreachable
        return null;
    }

    private static String shortenString(String string, int amount) {
        return string.substring(0, Math.max(string.length() - amount, 0));
    }

    @PostMapping("/set-personal-info")
    public Response setPersonalInfo(@RequestHeader("Authorization") String authorizationHeader, @RequestBody Map<String, Object> requestBody) {
        UUID user = Authorization.authorize(authorizationHeader).userId;
        if (requestBody.containsKey("user_id"))
            return Response.Error(HttpStatus.BAD_REQUEST, "Invalid column: \"user_id\"");
        
        requestBody.put("user_id", user);

        Database.openConnection((Connection con) -> {
            Map<String, Object> defaultInfo = Database.getDefaultTableEntry(con, PERSONAL_INFO_TABLE);
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
                    return Response.Error(HttpStatus.BAD_REQUEST, String.format("Invalid column: \"%s\"", columnName));
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

            PreparedStatement statement = con.prepareStatement(statementString);

            for (int i = 1; i <= columns.size(); i++) {
                String columnName = columns.get(i - 1);
                Object obj = requestBody.get(columnName);
                statement.setObject(i, obj);
                statement.setObject(i + columns.size(), obj);
            }

            statement.executeUpdate();

            return null;
        })
        .throwIfError()
        .throwResponse();

        return Response.Success();
    }
}
