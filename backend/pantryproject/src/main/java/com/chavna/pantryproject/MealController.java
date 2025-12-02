package com.chavna.pantryproject;

import static com.chavna.pantryproject.Database.FOOD_ITEMS_TABLE;
import static com.chavna.pantryproject.Database.FOOD_ITEM_TEMPLATES_TABLE;
import static com.chavna.pantryproject.Env.CHAVNA_URL;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.springframework.http.HttpStatus;
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
public class MealController {
    public static class Ingredient {
        @NotNull
        public UUID templateId;
        @NotNull
        public Double amount;
    }

    private static int insertMealIngredients(Connection con, UUID mealId, List<Ingredient> ingredients) throws SQLException {
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
        public List<Ingredient> ingredients;
    }

    @AllArgsConstructor
    public static class CreateMealResponse {
        public UUID mealId;
        public int ingredientsAdded;
    }

    @PostMapping("/create-meal")
    public Response createMeal(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody CreateMealRequest requestBody) {
        Login login = Authorization.authorize(authorizationHeader);
        UUID familyOwner = Authorization.getFamilyOwnerId(login);

        Database.openConnection((Connection con) -> {
            PreparedStatement statement = con.prepareStatement(String.format("""
                INSERT INTO %s (owner, name)
                VALUES (?, ?)
                RETURNING id;   
            """, Database.MEALS_TABLE));

            statement.setObject(1, familyOwner);
            statement.setString(2, requestBody.name);

            ResultSet result = statement.executeQuery();

            result.next();

            UUID mealId = (UUID) result.getObject(1);
            
            int added = insertMealIngredients(con, mealId, requestBody.ingredients);

            if (added < requestBody.ingredients.size())
                return Response.Fail("Failed to add some ingredients.", new CreateMealResponse(mealId, added));

            return Response.Success(new CreateMealResponse(mealId, added));
        }).onSQLError((SQLException ex) -> {
            if (ex.getSQLState().equals("23505"))
                return Response.Fail("Meal with that name already exists.");

            return null;
        })
        .throwIfError()
        .throwResponse();

        // This should be unreachable
        return null;
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
        public boolean isFavorite;
        public String mealPictureURL;
        public List<FlattenedIngredient> ingredients;
    }

    @AllArgsConstructor
    public static class GetMealResponse {
        public FlattenedMeal meal;
    }

    private FlattenedMeal getFlattenedMeal(Connection con, UUID mealId, UUID owner) throws SQLException {
        String query = String.format("""
            SELECT %2$s.name, %3$s.id, %1$s.amount, %3$s.name, %3$s.unit, %2$s.is_favorite, %2$s.meal_picture FROM %1$s
            INNER JOIN %3$s
            ON %1$s.template_id = %3$s.id
            INNER JOIN %2$s
            ON %1$s.meal_id = %2$s.id
            WHERE %2$s.id = ? AND %2$s.owner = ? AND %3$s.owner = ?
            ORDER BY order_index;
        """, Database.MEAL_INGREDIENTS_TABLE, Database.MEALS_TABLE, Database.FOOD_ITEM_TEMPLATES_TABLE);
        PreparedStatement statement = con.prepareStatement(query);

        statement.setObject(1, mealId);
        statement.setObject(2, owner);
        statement.setObject(3, owner);

        ResultSet result = statement.executeQuery();

        List<FlattenedIngredient> ingredients = new ArrayList<>();
        String mealName = null;
        Boolean isFavorite = null;
        String mealPicture = null;
        while (result.next()) {
            mealName = result.getString(1);

            FlattenedIngredient ingredient = new FlattenedIngredient();
            ingredient.templateId = (UUID) result.getObject(2);
            ingredient.amount = result.getDouble(3);
            ingredient.name = result.getString(4);
            ingredient.unit = result.getString(5);
            isFavorite = result.getBoolean(6);
            mealPicture = result.getString(7);

            ingredients.add(ingredient);
        }

        if (mealName == null)
            throw new ResponseException(Response.Fail("Meal not found."));

        FlattenedMeal meal = new FlattenedMeal();
        meal.name = mealName;
        meal.ingredients = ingredients;
        meal.isFavorite = isFavorite != null && isFavorite;
        meal.mealPictureURL = CHAVNA_URL + "/images/" + mealPicture;

        return meal;
    }

    @PostMapping("/get-meal")
    public Response getMeal(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody GetMealRequest requestBody) {
        Login login = Authorization.authorize(authorizationHeader);
        UUID familyOwner = Authorization.getFamilyOwnerId(login);

        Database.openConnection((Connection con) -> {
            FlattenedMeal meal = getFlattenedMeal(con, requestBody.mealId, familyOwner);

            return Response.Success(new GetMealResponse(meal));
        })
        .throwIfError()
        .throwResponse();

        // This should be unreachable
        return null;
    }

    public static class Meal {
        @Nullable
        public String name;
        @Nullable
        public List<Ingredient> ingredients;
        @Nullable
        public Boolean isFavorite;
        @Nullable
        String mealPictureBase64;
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
        UUID familyOwner = Authorization.getFamilyOwnerId(login);

        if (requestBody.meal.mealPictureBase64 != null) {
            BufferedImage image;
            // Attempt to decode the image
            try {
                // I blatanly copy pasted this from Gemini

                // Remove the "data:image/png;base64," prefix if present
                if (requestBody.meal.mealPictureBase64.startsWith("data:image"))
                    requestBody.meal.mealPictureBase64 = requestBody.meal.mealPictureBase64.substring(requestBody.meal.mealPictureBase64.indexOf(",") + 1);
                
                // Decode the Base64 string to a byte array
                byte[] decodedBytes = Base64.getDecoder().decode(requestBody.meal.mealPictureBase64);
                ByteArrayInputStream bytes = new ByteArrayInputStream(decodedBytes);

                image = ImageIO.read(bytes);
            } catch (IllegalArgumentException ex) {
                return Response.Error(HttpStatus.BAD_REQUEST, "Meal picture is not a valid base64 string.");
            } catch (IOException ex) {
                return Response.Error(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to decode image.", ex);
            }

            String mealKey = S3.getImageKey("meal", requestBody.mealId);
            try {
                S3.uploadImage(image, mealKey);
            } catch (Exception ex) {
                return Response.Error(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to upload image.");
            }
        }

        Database.openConnection((Connection con) -> {
            if (requestBody.meal.name != null) {
                PreparedStatement updateStatement = con.prepareStatement(String.format("""
                    UPDATE %s
                    SET name = ?
                    WHERE id = ? AND owner = ?;
                """, Database.MEALS_TABLE));

                updateStatement.setString(1, requestBody.meal.name);
                updateStatement.setObject(2, requestBody.mealId);
                updateStatement.setObject(3, familyOwner);

                if (updateStatement.executeUpdate() < 1)
                    return Response.Fail("Meal ID Not Found.");
            }

            if (requestBody.meal.isFavorite != null) {
                PreparedStatement updateStatement = con.prepareStatement(String.format("""
                    UPDATE %s
                    SET is_favorite = ?
                    WHERE id = ? AND owner = ?;
                """, Database.MEALS_TABLE));

                updateStatement.setBoolean(1, requestBody.meal.isFavorite);
                updateStatement.setObject(2, requestBody.mealId);
                updateStatement.setObject(3, familyOwner);

                if (updateStatement.executeUpdate() < 1)
                    return Response.Fail("Meal ID Not Found.");
            }

            int added = 0;
            if (requestBody.meal.ingredients != null) {
                PreparedStatement deleteStatement = con.prepareStatement(String.format("""
                    DELETE FROM %1$s
                    USING %2$s
                    WHERE meal_id = %2$s.id
                    AND meal_id = ?
                    AND owner = ?;
                """, Database.MEAL_INGREDIENTS_TABLE, Database.MEALS_TABLE));
                deleteStatement.setObject(1, requestBody.mealId);
                deleteStatement.setObject(2, familyOwner);

                deleteStatement.executeUpdate();

                added = insertMealIngredients(con, requestBody.mealId, requestBody.meal.ingredients);

                if (added < requestBody.meal.ingredients.size())
                    return Response.Fail("Failed to add some ingredients.", new UpdateMealResponse(added));
            }

            return Response.Success(new UpdateMealResponse(added));
        })
        .throwIfError()
        .throwResponse();

        // This should be unreachable
        return null;
    }

    public static class MealResponse {
        public UUID mealId;
        public String name;
        public boolean isFavorite;
        public String mealPictureURL;
    }

    public static class GetMealsResponse {
        public List<MealResponse> meals;

        public GetMealsResponse() {
            meals = new ArrayList<>();
        }
    }

    @GetMapping("/get-meals")
    public Response getMeals(@RequestHeader("Authorization") String authorizationHeader) {
        Login login = Authorization.authorize(authorizationHeader);
        UUID familyOwner = Authorization.getFamilyOwnerId(login);

        Database.openConnection((Connection con) -> {
            PreparedStatement statement = con.prepareStatement(String.format("""
                SELECT id, name, is_favorite FROM %s
                WHERE owner = ?
            """, Database.MEALS_TABLE));
            statement.setObject(1, familyOwner);

            ResultSet result = statement.executeQuery();

            GetMealsResponse response = new GetMealsResponse();

            while (result.next()) {
                MealResponse meal = new MealResponse();
                meal.mealId = (UUID) result.getObject(1);
                meal.name = result.getString(2);
                meal.isFavorite = result.getBoolean(3);

                response.meals.add(meal);
            }

            return Response.Success(response);
        })
        .throwIfError()
        .throwResponse();

        // This should be unreachable
        return null;
    }

    public static class CalculateMealPriceRequest {
        @NotNull
        public UUID mealId;
    }

    @AllArgsConstructor
    public static class CalculateMealPriceResponse {
        public Double price;
    }

    @PostMapping("/calculate-meal-price")
    public Response calculateMealPrice(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody CalculateMealPriceRequest requestBody) {
        Login login = Authorization.authorize(authorizationHeader);
        UUID familyOwner = Authorization.getFamilyOwnerId(login);

        Database.openConnection((Connection con) -> {
            FlattenedMeal meal = getFlattenedMeal(con, requestBody.mealId, familyOwner);

            Double total = Double.valueOf(0);
            for (FlattenedIngredient ingredient : meal.ingredients) {
                // Get oldest item
                PreparedStatement itemStatement = con.prepareStatement(String.format("""
                    SELECT unit_price FROM %1$s
                    INNER JOIN %2$s
                    ON %2$s.id = %1$s.template_id
                    WHERE owner = ? AND %1$s.template_id = ?
                    ORDER BY add_date
                    LIMIT 1;
                """, FOOD_ITEMS_TABLE, FOOD_ITEM_TEMPLATES_TABLE));
                
                itemStatement.setObject(1, familyOwner);
                itemStatement.setObject(2, ingredient.templateId);

                ResultSet result = itemStatement.executeQuery();

                double unitPrice = 0;
                if (result.next())
                    unitPrice = result.getDouble(1);
                else {
                    PreparedStatement lastPriceStatement = con.prepareStatement(String.format("""
                        SELECT most_recent_unit_price FROM %s
                        WHERE id = ?;
                    """, FOOD_ITEM_TEMPLATES_TABLE));

                    lastPriceStatement.setObject(1, ingredient.templateId);

                    ResultSet lastPriceResult = lastPriceStatement.executeQuery();
                    
                    if (lastPriceResult.next()) {
                        unitPrice = lastPriceResult.getDouble(1);

                        if (lastPriceResult.wasNull()) {
                            total = null;
                            break;
                        }
                    }
                }

                total += unitPrice * ingredient.amount;
            }

            return Response.Success(new CalculateMealPriceResponse(total));
        })
        .throwIfError()
        .throwResponse();

        return null;
    }
}
