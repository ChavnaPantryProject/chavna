package com.chavna.pantryproject;

import static com.chavna.pantryproject.Database.CATEGORIES_TABLE;
import static com.chavna.pantryproject.Database.FOOD_ITEMS_TABLE;
import static com.chavna.pantryproject.Database.FOOD_ITEM_TEMPLATES_TABLE;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.chavna.pantryproject.Authorization.Login;

import jakarta.annotation.Nullable;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;

@RestController
public class PantryController {
    public static class FoodItemTemplate {
        @NotNull
        public String name;
        @NotNull
        public Double amount;
        @NotNull
        public String unit;
        @NotNull
        public Integer shelfLifeDays;
        @NotNull
        public String category;
    }
    
    @PostMapping("/create-food-item-template")
    public Response createFoodItemTemplate(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody FoodItemTemplate requestBody) {
        Login login = Authorization.authorize(authorizationHeader);

        Database.openConnection((Connection con) -> {
            PreparedStatement statement = con.prepareStatement(String.format("""
                INSERT INTO %s (name, owner, amount, unit, shelf_life_days, category)
                VALUES (?, ?, ?, ?, ?, ?)
                RETURNING id;
            """, FOOD_ITEM_TEMPLATES_TABLE));

            statement.setString(1, requestBody.name);
            statement.setObject(2, login.userId);
            statement.setDouble(3, requestBody.amount);
            statement.setString(4, requestBody.unit);
            statement.setInt(5, requestBody.shelfLifeDays);
            statement.setString(6, requestBody.category);

            ResultSet result = statement.executeQuery();
            result.next();

            UUID templateId = (UUID) result.getObject(1);

            RegisteredFoodItemTemplate template = new RegisteredFoodItemTemplate();
            template.templateId = templateId;
            template.template = requestBody;

            return Response.Success(template);
        }).onSQLError((SQLException ex) -> {
            if (ex.getSQLState().equals("23503"))
                return Response.Fail("Category does not exist.");
            
            return null;
        })
        .throwIfError()
        .throwResponse();

        // This should be unreachable
        return null;
    }

    public static class RegisteredFoodItemTemplate {
        public UUID templateId;
        public FoodItemTemplate template;
    }

    public static class GetFoodItemTemplatesRequest {
        @Nullable
        public String search;
    }

    @AllArgsConstructor
    public static class GetFoodItemTemplatesResponse {
        public ArrayList<RegisteredFoodItemTemplate> templates;
    }

    @PostMapping("/get-food-item-templates")
    public Response getFoodItemTemplates(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody(required = false) GetFoodItemTemplatesRequest requestBody) {
        Login login = Authorization.authorize(authorizationHeader);
        UUID familyOwner = Authorization.getFamilyOwnerId(login);
        
        if (requestBody == null)
            requestBody = new GetFoodItemTemplatesRequest();

        final var body = requestBody;

        Database.openConnection((Connection con) -> {
            String query = String.format("""
                SELECT * FROM %s
                WHERE owner = ?
            """, FOOD_ITEM_TEMPLATES_TABLE);

            if (body.search != null)
                query += " AND name LIKE ?";

            PreparedStatement statement;
            statement = con.prepareStatement(query);
            statement.setObject(1, familyOwner);

            if (body.search != null) {
                String like = '%' + body.search + '%';
                statement.setString(2, like);
            }

            ResultSet result = statement.executeQuery();

            ArrayList<RegisteredFoodItemTemplate> templates = new ArrayList<>();
            while (result.next()) {
                FoodItemTemplate template = new FoodItemTemplate();

                template.amount = result.getDouble("amount");
                template.category = result.getString("category");
                template.name = result.getString("name");
                template.shelfLifeDays = result.getInt("shelf_life_days");
                template.unit = result.getString("unit");

                RegisteredFoodItemTemplate registered = new RegisteredFoodItemTemplate();
                registered.templateId = (UUID) result.getObject("id");
                registered.template = template;

                templates.add(registered);
            }

            return Response.Success(templates);
        })
        .throwIfError()
        .throwResponse();

        // This should be unreachable
        return null;
    }

    public static class FoodItemFromTemplate {
        @NotNull
        public UUID templateId;
        @NotNull
        public Double amount;
        @NotNull
        public Double unitPrice;
    }

    public static class AddFoodItemRequest {
        @NotNull
        public ArrayList<FoodItemFromTemplate> items;
    }

    @PostMapping("/add-food-items")
    public Response addFoodItem(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody AddFoodItemRequest requestBody) {
        if (requestBody.items.size() == 0)
            return Response.Success();

        Login login = Authorization.authorize(authorizationHeader);
        UUID familyOwner = Authorization.getFamilyOwnerId(login);

        Database.openConnection((Connection con) -> {
            String values = "";
            for (@SuppressWarnings("unused") var __ : requestBody.items)
                values += "(CAST(? AS uuid), ?, now()::date, ?),";
            
            values = values.substring(0, values.length() - 1);
            String query = String.format("""
                INSERT INTO %s (amount, expiration, unit_price, template_id)
                SELECT inserted.amount, expiration + INTERVAL '1 day' * shelf_life_days, unit_price, template_id FROM (
                    VALUES
                        %s
                ) AS inserted (template_id, amount , expiration, unit_price)
                INNER JOIN %s
                ON id = template_id AND owner = ?;
            """, FOOD_ITEMS_TABLE, values, FOOD_ITEM_TEMPLATES_TABLE);

            PreparedStatement statement = con.prepareStatement(query);

            int i = 1;
            for (FoodItemFromTemplate item : requestBody.items) {
                statement.setObject(i, item.templateId);
                i++;
                statement.setDouble(i, item.amount);
                i++;
                statement.setDouble(i, item.unitPrice);
                i++;
            }

            statement.setObject(i, familyOwner);

            int updated = statement.executeUpdate();

            if (updated == 0)
                return Response.Fail("No items added.");

            return Response.Success("Items added: " + updated);
        })
        .throwIfError()
        .throwResponse();

        // This should be unreachable
        return null;
    }

    public static class GetFoodItemsRequest {
        @Nullable
        public String category;
    }

    public static class FoodItem {
        public UUID id;
        public String name;
        public double amount;
        public String unit;
        public Date expiration;
        public Date lastUsed;
        public double unitPrice;
        public Date addDate;
        public String category;
    }

    @AllArgsConstructor
    public static class GetFoodItemsResponse {
        public ArrayList<FoodItem> items;
    }

    @PostMapping("/get-food-items")
    public Response getFoodItems(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody(required = false) GetFoodItemsRequest requestBody) {
        Login login = Authorization.authorize(authorizationHeader);
        UUID familyOwner = Authorization.getFamilyOwnerId(login);

        if (requestBody == null)
            requestBody = new GetFoodItemsRequest();

        final var body = requestBody;

        Database.openConnection((Connection con) -> {
            String query = String.format("""
                SELECT * FROM %s
                INNER JOIN %s
                ON template_id = %<s.id
                WHERE owner = ? 
            """, FOOD_ITEMS_TABLE, FOOD_ITEM_TEMPLATES_TABLE);

            if (body.category != null)
                query += "AND category = ?";

            PreparedStatement statement = con.prepareStatement(query);
            statement.setObject(1, familyOwner);

            if (body.category != null)
                statement.setString(2, body.category);

            ResultSet result = statement.executeQuery();

            ArrayList<FoodItem> items = new ArrayList<>();
            while (result.next()) {
                FoodItem item = new FoodItem();

                item.id = (UUID) result.getObject("id");
                item.addDate = result.getDate("add_date");
                item.amount = result.getDouble("amount");
                item.category = result.getString("category");
                item.expiration = result.getDate("expiration");
                item.name = result.getString("name");
                item.unit = result.getString("unit");
                item.unitPrice = result.getDouble("unit_price");
                item.lastUsed = result.getDate("last_used");

                items.add(item);
            }

            return Response.Success(new GetFoodItemsResponse(items));
        })
        .throwIfError()
        .throwResponse();

        // This should be unreachable
        return null;
    }

    public static class UpdateFoodItemRequest {
        @NotNull
        public UUID foodItemId;
        @NotNull
        public Double newAmount;
    }

    @PostMapping("/update-food-item")
    public Response updateFoodItem(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody UpdateFoodItemRequest requestBody) {
        Login login = Authorization.authorize(authorizationHeader);
        UUID familyOwner = Authorization.getFamilyOwnerId(login);

        Database.openConnection((Connection con) -> {
            if (requestBody.newAmount > 0) {
                PreparedStatement statement = con.prepareStatement(String.format("""
                    UPDATE %1$s
                    SET amount = ?, last_used = now()::date
                    FROM %2$s
                    WHERE %1$s.template_id = %2$s.id
                      AND %1$s.id = ? AND %2$s.owner = ?;
                """, FOOD_ITEMS_TABLE, FOOD_ITEM_TEMPLATES_TABLE));
                statement.setDouble(1, requestBody.newAmount);
                statement.setObject(2, requestBody.foodItemId);
                statement.setObject(3, familyOwner);

                if (statement.executeUpdate() < 1)
                    return Response.Fail("Food item not updated.");
            } else {
                PreparedStatement statement = con.prepareStatement(String.format("""
                    DELETE FROM %1$s
                    USING %2$s
                    WHERE %1$s.template_id = %2$s.id
                      AND %1$s.id = ? AND %2$s.owner = ?;
                """, Database.FOOD_ITEMS_TABLE, Database.FOOD_ITEM_TEMPLATES_TABLE));

                statement.setObject(1, requestBody.foodItemId);
                statement.setObject(2, familyOwner);

                if (statement.executeUpdate() < 1)
                    return Response.Fail("Food item not updated.");
            }

            return null;
        })
        .throwIfError()
        .throwResponse();

        return Response.Success("Food item updated");
    }

    public static class CategoryRequest {
        @NotNull
        public String name;
    }

    @PostMapping("/create-category")
    public Response createCategory(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody CategoryRequest requestBody) {
        Login login = Authorization.authorize(authorizationHeader);
        UUID familyOwner = Authorization.getFamilyOwnerId(login);

        Database.openConnection((Connection con) -> {
            PreparedStatement statement = con.prepareStatement(String.format("""
                INSERT INTO %s (name, owner)
                VALUES (?, ?);
            """, CATEGORIES_TABLE));
            statement.setString(1, requestBody.name);
            statement.setObject(2, familyOwner);

            statement.executeUpdate();

            return null;
        }).onSQLError((SQLException ex) -> {
            if (ex.getSQLState().equals("23505"))
                return Response.Fail("Category already exists.");
            
            return null;
        })
        .throwIfError()
        .throwResponse();

        return Response.Success("Category created.");
    }

    @PostMapping("/remove-category")
    public Response removeCategory(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody CategoryRequest requestBody) {
        Login login = Authorization.authorize(authorizationHeader);
        UUID familyOwner = Authorization.getFamilyOwnerId(login);

        Database.openConnection((Connection con) -> {
            PreparedStatement statement = con.prepareStatement(String.format("""
                DELETE FROM %s
                WHERE name = ? AND owner = ?;
            """, CATEGORIES_TABLE));
            statement.setString(1, requestBody.name);
            statement.setObject(2, familyOwner);

            int removed = statement.executeUpdate();

            if (removed == 0)
                return Response.Fail("Category not found.");

            return null;
        })
        .throwIfError()
        .throwResponse();

        return Response.Success("Category removed.");
    }

    public static class GetCategoriesResponse {
        public ArrayList<String> categories;

        public GetCategoriesResponse() {
            categories = new ArrayList<>();
        }
    }

    @GetMapping("/get-categories")
    public Response getCategories(@RequestHeader("Authorization") String authorizationHeader) {
        Login login = Authorization.authorize(authorizationHeader);
        UUID familyOwner = Authorization.getFamilyOwnerId(login);

        Database.openConnection((Connection con) -> {
            PreparedStatement statement = con.prepareStatement(String.format("""
                SELECT name FROM %s
                WHERE owner = ?
            """, CATEGORIES_TABLE));
            statement.setObject(1, familyOwner);
            ResultSet result = statement.executeQuery();

            GetCategoriesResponse response = new GetCategoriesResponse();
            while (result.next()) {
                response.categories.add(result.getString(1));
            }

            return Response.Success(response);
        })
        .throwIfError()
        .throwResponse();

        // This should be unreachable
        return null;
    }

    public static class GetScanKeyRequest {
        @NotNull
        public String key;
    }

    @AllArgsConstructor
    public static class GetScanKeyResponse {
        public UUID templateId;
    }

    @PostMapping("get-scan-key")
    public Response getScanKey(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody GetScanKeyRequest requestBody) {
        Login login = Authorization.authorize(authorizationHeader);
        UUID familyOwner = Authorization.getFamilyOwnerId(login);

        UUID[] templateId = {null};
        Database.openConnection((Connection con) -> {
            PreparedStatement statement = con.prepareStatement("""
                SELECT template_id FROM scan_items
                WHERE scan_text = ? AND owner = ?;
            """);

            statement.setString(1, requestBody.key);
            statement.setObject(2, familyOwner);

            ResultSet result = statement.executeQuery();

            if (result.next())
                templateId[0] = (UUID) result.getObject(1);

            return null;
        })
        .throwIfError()
        .ignoreResponse();

        return Response.Success(new GetScanKeyResponse(templateId[0]));
    }

    public static class SetScanKeyRequest {
        @NotNull
        public String key;
        @Nullable
        public UUID templateId;
    }

    @PostMapping("/set-scan-key")
    public Response setScanKey(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody SetScanKeyRequest requestBody) {
        Login login = Authorization.authorize(authorizationHeader);
        UUID familyOwner = Authorization.getFamilyOwnerId(login);

        Database.openConnection((Connection con) -> {
            PreparedStatement deleteStatement = con.prepareStatement("""
                DELETE FROM scan_items
                WHERE scan_text = ? AND owner = ?;
            """);

            deleteStatement.setString(1, requestBody.key);
            deleteStatement.setObject(2, familyOwner);

            deleteStatement.executeUpdate();

            if (requestBody.templateId != null) {
                PreparedStatement statement = con.prepareStatement("""
                    INSERT INTO scan_items (scan_text, template_id, owner)
                    VALUES (?, ?, ?)
                """);

                statement.setString(1, requestBody.key);
                statement.setObject(2, requestBody.templateId);
                statement.setObject(3, familyOwner);

                statement.executeUpdate();
            }

            return null;
        })
        .throwIfError()
        .throwResponse();

        return Response.Success("Key added.");
    }
}
