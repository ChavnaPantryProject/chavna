package com.chavna.pantryproject;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.UUID;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.chavna.pantryproject.Authorization.Login;

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

    public static class CreateMealRequest {
        @NotNull
        public String name;
    }

    @AllArgsConstructor
    public static class CreateMealResponse {
        public UUID mealId;
    }

    @PostMapping("/create-meal")
    public Response createMeal(@RequestHeader("Authorization") String authorizationHeader, @Valid CreateMealRequest requestBody) {
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
            

            return Response.Success(new CreateMealResponse(mealId));
        } catch (SQLException ex) {
            ex.printStackTrace();

            return Database.getSQLErrorHTTPResponse();
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
    public Response getMeal(@RequestHeader("Authorization") String authorizationHeader, @Valid GetMealRequest requestBody) {
        Login login = Authorization.authorize(authorizationHeader);

        try {
            Connection con = Database.getRemoteConnection();

            PreparedStatement statement = con.prepareStatement(String.format("""
                SELECT * FROM %1$s
                INNER JOIN %2$s
                ON %1$s.owner = %2$s.id
                INNER JOIN %3$s
                ON %1$s.template_id = %3$s.id
                WHERE $2$s.id = ? AND %1$s.owner = ?;
            """, Database.MEAL_INGREDIENTS_TABLE, Database.MEALS_TABLE, Database.FOOD_ITEM_TEMPLATES_TABLE));

            statement.setObject(1, requestBody.mealId);
            statement.setObject(2, login.userId);

            ResultSet result = statement.executeQuery();

            ArrayList<FlattenedIngredient> ingredients = new ArrayList<>();
            String mealName = null;
            
            while (result.next()) {
                mealName = result.getString(Database.MEALS_TABLE + ".name");

                FlattenedIngredient ingredient = new FlattenedIngredient();
                ingredient.templateId = (UUID) result.getObject(Database.FOOD_ITEM_TEMPLATES_TABLE + ".id");
                ingredient.amount = result.getDouble(Database.MEAL_INGREDIENTS_TABLE + ".amount");
                ingredient.name = result.getString(Database.FOOD_ITEM_TEMPLATES_TABLE + ".name");
                ingredient.unit = result.getString(Database.FOOD_ITEM_TEMPLATES_TABLE + ".unit");

                ingredients.add(ingredient);
            }

            FlattenedMeal meal = new FlattenedMeal();
            meal.name = mealName;
            meal.ingredients = ingredients;

            return Response.Success(new GetMealResponse(meal));
        } catch (SQLException ex) {
            ex.printStackTrace();

            return Database.getSQLErrorHTTPResponse();
        }
    }

    public static class Meal {
        public String name;
        public ArrayList<Ingredient> ingredients;
    }

    public static class UpdateMealRequest {
        Meal meal;
    }

    @PostMapping("/update-meal")
    public Response setMeal(@RequestHeader("Authorization") String authorizationHeader, @Valid GetMealRequest requestBody) {
        Login login = Authorization.authorize(authorizationHeader);

        try {
            Connection con = Database.getRemoteConnection();

            PreparedStatement statement = con.prepareStatement(String.format("""
                SELECT * FROM %1$s
                INNER JOIN %2$s
                ON %1$s.owner = %2$s.id
                INNER JOIN %3$s
                ON %1$s.template_id = %3$s.id
                WHERE $2$s.id = ? AND %1$s.owner = ?;
            """, Database.MEAL_INGREDIENTS_TABLE, Database.MEALS_TABLE, Database.FOOD_ITEM_TEMPLATES_TABLE));

            statement.setObject(1, requestBody.mealId);
            statement.setObject(2, login.userId);

            ResultSet result = statement.executeQuery();

            ArrayList<FlattenedIngredient> ingredients = new ArrayList<>();
            String mealName = null;
            
            while (result.next()) {
                mealName = result.getString(Database.MEALS_TABLE + ".name");

                FlattenedIngredient ingredient = new FlattenedIngredient();
                ingredient.templateId = (UUID) result.getObject(Database.FOOD_ITEM_TEMPLATES_TABLE + ".id");
                ingredient.amount = result.getDouble(Database.MEAL_INGREDIENTS_TABLE + ".amount");
                ingredient.name = result.getString(Database.FOOD_ITEM_TEMPLATES_TABLE + ".name");
                ingredient.unit = result.getString(Database.FOOD_ITEM_TEMPLATES_TABLE + ".unit");

                ingredients.add(ingredient);
            }

            FlattenedMeal meal = new FlattenedMeal();
            meal.name = mealName;
            meal.ingredients = ingredients;

            return Response.Success(new GetMealResponse(meal));
        } catch (SQLException ex) {
            ex.printStackTrace();

            return Database.getSQLErrorHTTPResponse();
        }
    }
}
