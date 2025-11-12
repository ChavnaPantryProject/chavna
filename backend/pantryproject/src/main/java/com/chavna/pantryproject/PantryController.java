package com.chavna.pantryproject;

import static com.chavna.pantryproject.Database.FOOD_ITEMS_TABLE;
import static com.chavna.pantryproject.Database.FOOD_ITEM_TEMPLATES_TABLE;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.UUID;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.chavna.pantryproject.Authorization.Login;
import com.chavna.pantryproject.UserAccountController.FoodItemTemplate;

import jakarta.annotation.Nullable;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;

@RestController
public class PantryController {
    
    @PostMapping("/create-food-item-template")
    public Response createFoodItemTemplate(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody FoodItemTemplate requestBody) {
        Login login = Authorization.authorize(authorizationHeader);

        try {
            Connection con = Database.getRemoteConnection();

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
        } catch (SQLException ex) {
            ex.printStackTrace();
            return Database.getSQLErrorHTTPResponse();
        }
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
        
        if (requestBody == null)
            requestBody = new GetFoodItemTemplatesRequest();

        try {
            Connection con = Database.getRemoteConnection();

            String query = String.format("""
                SELECT * FROM %s
                WHERE owner = ?
            """, FOOD_ITEM_TEMPLATES_TABLE);

            if (requestBody.search != null)
                query += " AND name LIKE ?";

            PreparedStatement statement;
            statement = con.prepareStatement(query);
            statement.setObject(1, login.userId);

            if (requestBody.search != null) {
                String like = '%' + requestBody.search + '%';
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
        } catch (SQLException ex) {
            ex.printStackTrace();
            
            return Database.getSQLErrorHTTPResponse();
        }
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

        try {
            Connection con = Database.getRemoteConnection();

            String values = "";
            for (@SuppressWarnings("unused") var __ : requestBody.items)
                values += "(CAST(? AS uuid), ?, now()::date, ?),";
            
            values = values.substring(0, values.length() - 1);
            String query = String.format("""
                INSERT INTO %s
                SELECT id, inserted.amount, expiration + INTERVAL '1 day' * shelf_life_days, unit_price, template_id FROM (
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

            statement.setObject(i, login.userId);

            int updated = statement.executeUpdate();

            if (updated == 0)
                return Response.Fail("No items added.");

            return Response.Success("Items added: " + updated);
        } catch (SQLException ex) {
            ex.printStackTrace();
            return Database.getSQLErrorHTTPResponse();
        }
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

        if (requestBody == null)
            requestBody = new GetFoodItemsRequest();

        try {
            Connection con = Database.getRemoteConnection();

            String query = String.format("""
                SELECT * FROM %s
                INNER JOIN %s
                ON template_id = %<s.id
                WHERE owner = ? 
            """, FOOD_ITEMS_TABLE, FOOD_ITEM_TEMPLATES_TABLE);

            if (requestBody.category != null)
                query += "AND category = ?";

            System.out.println(query);

            PreparedStatement statement = con.prepareStatement(query);
            statement.setObject(1, login.userId);

            if (requestBody.category != null)
                statement.setString(2, requestBody.category);

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
        } catch (SQLException ex) {
            ex.printStackTrace();
            return Database.getSQLErrorHTTPResponse();
        }
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

        try {
            Connection con = Database.getRemoteConnection();

            if (requestBody.newAmount > 0) {
                PreparedStatement statement = con.prepareStatement(String.format("""
                    UPDATE %1$s
                    SET amount = ?, last_used = now()::date
                    FROM %2$s
                    WHERE %1$s.id = ? AND %2$s.owner = ?;
                """, FOOD_ITEMS_TABLE, FOOD_ITEM_TEMPLATES_TABLE));
                statement.setDouble(1, requestBody.newAmount);
                statement.setObject(2, requestBody.foodItemId);
                statement.setObject(3, login.userId);

                statement.executeUpdate();
            } else {

            }
        } catch (SQLException ex) {
            ex.printStackTrace();
            return Database.getSQLErrorHTTPResponse();
        }
        return Response.Success();
    }
}
