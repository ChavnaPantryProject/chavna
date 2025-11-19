package com.chavna.pantryproject;

import java.sql.Connection;
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

import jakarta.annotation.Nullable;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;

@RestController
public class MealController {
    public static class Ingredient {
        @NotNull
        public UUID templateId;
        @NotNull
        public Double amount;
    }

    private static int insertMealIngredients(Connection con, UUID mealId, ArrayList<Ingredient> ingredients) throws SQLException {
            if (ingredients.size() == 0)
                return 0;

            String query = String.format("INSERT INTO %s (amount, template_id, meal_id, order_index) VALUES", Database.MEAL_INGREDIENTS_TABLE);
            for (@SuppressWarnings("unused") var __ : ingredients) {
                query += " (?, ?, ?, ?),";
            }
            query = query.substring(0, query.length() - 1);
            PreparedStatement insert = con.prepareStatement(query);

            int i = 1;
            int order = 0;
            for (Ingredient ingredient : ingredients) {
                insert.setDouble(i, ingredient.amount);
                i++;

                insert.setObject(i, ingredient.templateId);
                i++;

                insert.setObject(i, mealId);
                i++;

                insert.setInt(i, order);
                i++;

                order++;
            }

            return insert.executeUpdate();
    }

    public static class CreateMealRequest {
        @NotNull
        public String name;
        @NotNull
        public ArrayList<Ingredient> ingredients;
    }

    @AllArgsConstructor
    public static class CreateMealResponse {
        public UUID mealId;
        public int ingredientsAdded;
    }

    @PostMapping("/create-meal")
    public Response createMeal(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody CreateMealRequest requestBody) {
        Login login = Authorization.authorize(authorizationHeader);

        try {
            Connection con = Database.getRemoteConnection();

            PreparedStatement statement = con.prepareStatement(String.format("""
                INSERT INTO %s (owner, name)
                VALUES (?, ?)
                RETURNING id;   
            """, Database.MEALS_TABLE));

            statement.setObject(1, login.userId);
            statement.setString(2, requestBody.name);

            ResultSet result = statement.executeQuery();

            result.next();

            UUID mealId = (UUID) result.getObject(1);
            
            int added = insertMealIngredients(con, mealId, requestBody.ingredients);

            if (added < requestBody.ingredients.size())
                return Response.Fail("Failed to add some ingredients.", new CreateMealResponse(mealId, added));

            return Response.Success(new CreateMealResponse(mealId, added));
        } catch (SQLException ex) {
            if (ex.getSQLState() == "23505")
                return Response.Fail("Meal with that name already exists.");

            return Database.getSQLErrorHTTPResponse(ex);
        }
    }

    public static class FlattenedIngredient {
        public UUID templateId;
        public String name;
        public double amount;
        public String unit;
    }

    public static class GetMealRequest {
        @NotNull
        public UUID mealId;
    }

    public static class FlattenedMeal {
        public String name;
        public ArrayList<FlattenedIngredient> ingredients;
    }

    @AllArgsConstructor
    public static class GetMealResponse {
        public FlattenedMeal meal;
    }

    @PostMapping("/get-meal")
    public Response getMeal(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody GetMealRequest requestBody) {
        Login login = Authorization.authorize(authorizationHeader);

        try {
            Connection con = Database.getRemoteConnection();

            String query = String.format("""
                SELECT %2$s.name, %3$s.id, %1$s.amount, %3$s.name, %3$s.unit FROM %1$s
                INNER JOIN %3$s
                ON %1$s.template_id = %3$s.id
                INNER JOIN %2$s
                ON %1$s.meal_id = %2$s.id
                WHERE %2$s.id = ? AND %2$s.owner = ? AND %3$s.owner = ?
                ORDER BY order_index;
            """, Database.MEAL_INGREDIENTS_TABLE, Database.MEALS_TABLE, Database.FOOD_ITEM_TEMPLATES_TABLE);
            System.out.println(query);
            PreparedStatement statement = con.prepareStatement(query);

            statement.setObject(1, requestBody.mealId);
            statement.setObject(2, login.userId);
            statement.setObject(3, login.userId);

            ResultSet result = statement.executeQuery();

            ArrayList<FlattenedIngredient> ingredients = new ArrayList<>();
            String mealName = null;
            
            while (result.next()) {
                mealName = result.getString(1);

                FlattenedIngredient ingredient = new FlattenedIngredient();
                ingredient.templateId = (UUID) result.getObject(2);
                ingredient.amount = result.getDouble(3);
                ingredient.name = result.getString(4);
                ingredient.unit = result.getString(5);

                ingredients.add(ingredient);
            }

            FlattenedMeal meal = new FlattenedMeal();
            meal.name = mealName;
            meal.ingredients = ingredients;

            return Response.Success(new GetMealResponse(meal));
        } catch (SQLException ex) {
            

            return Database.getSQLErrorHTTPResponse(ex);
        }
    }

    public static class Meal {
        @Nullable
        public String name;
        @Nullable
        public ArrayList<Ingredient> ingredients;
    }

    public static class UpdateMealRequest {
        @NotNull
        public UUID mealId;
        @NotNull
        public Meal meal;
    }

    @AllArgsConstructor
    public static class UpdateMealResponse {
        public int ingredientsAdded;
    }

    @PostMapping("/update-meal")
    public Response setMeal(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody UpdateMealRequest requestBody) {
        Login login = Authorization.authorize(authorizationHeader);

        try {
            Connection con = Database.getRemoteConnection();

            PreparedStatement deleteStatement = con.prepareStatement(String.format("""
                DELETE FROM %1$s
                USING %2$s
                WHERE meal_id = %2$s.id
                  AND meal_id = ?
                  AND owner = ?;
            """, Database.MEAL_INGREDIENTS_TABLE, Database.MEALS_TABLE));
            deleteStatement.setObject(1, requestBody.mealId);
            deleteStatement.setObject(2, login.userId);

            deleteStatement.executeUpdate();

            if (requestBody.meal.name != null) {
                PreparedStatement updateStatement = con.prepareStatement(String.format("""
                    UPDATE %s
                    SET name = ?
                    WHERE id = ? AND owner = ?;
                """, Database.MEALS_TABLE));

                updateStatement.setString(1, requestBody.meal.name);
                updateStatement.setObject(2, requestBody.mealId);
                updateStatement.setObject(3, login.userId);

                if (updateStatement.executeUpdate() < 1)
                    return Response.Fail("Meal ID Not Found.");
            }

            int added = 0;
            if (requestBody.meal.ingredients != null) {
                added = insertMealIngredients(con, requestBody.mealId, requestBody.meal.ingredients);

                if (added < requestBody.meal.ingredients.size())
                    return Response.Fail("Failed to add some ingredients.", new UpdateMealResponse(added));
            }

            return Response.Success(new UpdateMealResponse(added));
        } catch (SQLException ex) {
            return Database.getSQLErrorHTTPResponse(ex);
        }
    }
}
