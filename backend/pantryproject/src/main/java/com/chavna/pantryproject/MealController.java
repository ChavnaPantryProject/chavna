package com.chavna.pantryproject;

import static com.chavna.pantryproject.Database.FOOD_ITEMS_TABLE;
import static com.chavna.pantryproject.Database.FOOD_ITEM_TEMPLATES_TABLE;
import static com.chavna.pantryproject.Database.MEALS_TABLE;
import static com.chavna.pantryproject.Database.MEAL_INGREDIENTS_TABLE;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.chavna.pantryproject.Authorization.Login;
import com.chavna.pantryproject.S3.S3Upload;
import com.chavna.pantryproject.Uploader.Upload;

import jakarta.annotation.Nullable;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;

@RestController
public class MealController {
    public static final String MEAL_PREFIX = "meal";

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

    public static class DeleteMealRequest {
        @NotNull
        public UUID mealId;
    }

    @PostMapping("delete-meal")
    public Response deleteMeal(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody DeleteMealRequest requestBody) {
        Login login = Authorization.authorize(authorizationHeader);
        
        UUID familyOwner = Authorization.getFamilyOwnerId(login);

        Database.openConnection((Connection con) -> {
            PreparedStatement statement = con.prepareStatement(String.format("""
                DELETE FROM %s
                WHERE owner = ? AND id = ?
            """, Database.MEALS_TABLE));

            statement.setObject(1, familyOwner);
            statement.setObject(2, requestBody.mealId);

            int result = statement.executeUpdate();

            if (result == 0)
                return Response.Fail("Failed to delete meal.");

            return Response.Success("Meal deleted.");
        })
        .throwIfError()
        .throwResponse();

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
        PreparedStatement mealStatement = con.prepareStatement(String.format("""
            SELECT name, is_favorite FROM %s
            WHERE owner = ? AND id = ?
        """, Database.MEALS_TABLE));
        mealStatement.setObject(1, owner);
        mealStatement.setObject(2, mealId);

        ResultSet mealResult = mealStatement.executeQuery();

        if (!mealResult.next())
            throw new ResponseException(Response.Fail("Meal not found."));

        String mealName = mealResult.getString(1);
        boolean isFavorite = mealResult.getBoolean(2);

        String query = String.format("""
            SELECT %2$s.id, %1$s.amount, %2$s.name, %2$s.unit FROM %1$s
            INNER JOIN %2$s
            ON %1$s.template_id = %2$s.id
            WHERE %1$s.meal_id = ? AND %2$s.owner = ?
            ORDER BY order_index;
        """, Database.MEAL_INGREDIENTS_TABLE, Database.FOOD_ITEM_TEMPLATES_TABLE);
        PreparedStatement ingredientsStatement = con.prepareStatement(query);

        ingredientsStatement.setObject(1, mealId);
        ingredientsStatement.setObject(2, owner);

        ResultSet result = ingredientsStatement.executeQuery();

        List<FlattenedIngredient> ingredients = new ArrayList<>();
        while (result.next()) {
            FlattenedIngredient ingredient = new FlattenedIngredient();
            ingredient.templateId = (UUID) result.getObject(1);
            ingredient.amount = result.getDouble(2);
            ingredient.name = result.getString(3);
            ingredient.unit = result.getString(4);

            ingredients.add(ingredient);
        }

        if (mealName == null)
            throw new ResponseException(Response.Fail("Meal not found."));

        FlattenedMeal meal = new FlattenedMeal();
        meal.name = mealName;
        meal.ingredients = ingredients;
        meal.isFavorite = isFavorite;

        String key = S3.getImageKey(MEAL_PREFIX, mealId);
        if (S3.imageExists(key))
            meal.mealPictureURL = S3.getImageURL(key);

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
        public String mealPictureBase64;
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
                image = S3.decodeBase64Image(requestBody.meal.mealPictureBase64);
            } catch (IllegalArgumentException ex) {
                return Response.Error(HttpStatus.BAD_REQUEST, "Meal picture is not a valid base64 string.");
            } catch (IOException ex) {
                return Response.Error(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to decode image.", ex);
            }

            if (image == null)
                return Response.Error(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to decode image.");

            String mealKey = S3.getImageKey(MEAL_PREFIX, requestBody.mealId);
            try {
                S3.uploadImage(image, mealKey);
            } catch (Exception ex) {
                return Response.Fail("Unable to upload image.");
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
                
                String key = S3.getImageKey(MEAL_PREFIX, meal.mealId);
                if (S3.imageExists(key))
                    meal.mealPictureURL = S3.getImageURL(key);

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

    public static class InitializeMealPictureUploadRequest {
        @NotNull
        public UUID mealId;
        public int fileSize;
    }

    @AllArgsConstructor
    public static class InitializeMealPictureUploadResponse {
        public UUID uploadId;
        public int chunkCount;
        public int chunkSize;
    }

    @PostMapping("/initialize-meal-picture-upload")
    public Response initializeMealPictureUpload(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody InitializeMealPictureUploadRequest requestBody) {
        if (requestBody.fileSize <= 0)
            return Response.Error(HttpStatus.BAD_REQUEST, "File size must be > 0.");
        
        Login login = Authorization.authorize(authorizationHeader);
        UUID familyOwner = Authorization.getFamilyOwnerId(login);

        Database.openConnection((Connection con) -> {
            PreparedStatement statement = con.prepareStatement(String.format("""
                SELECT * FROM %s
                WHERE id = ? AND owner = ?
            """, MEALS_TABLE));
            statement.setObject(1, requestBody.mealId);
            statement.setObject(2, familyOwner);

            ResultSet result = statement.executeQuery();

            if (!result.next())
                return Response.Fail("Meal does not exist or cannot be modified by current user.");

            return null;
        })
        .throwIfError()
        .throwResponse();

        String key = S3.getImageKey(MEAL_PREFIX, requestBody.mealId);
        S3Upload s3Upload = new S3Upload(key);
        Upload upload = UploadController.uploader.initializeUpload(UploadController.UPLOAD_CHUNK_SIZE, requestBody.fileSize, s3Upload);

        return Response.Success(new InitializeMealPictureUploadResponse(upload.getUploadId(), upload.getChunkCount(), upload.getChunkSize()));
    }

    public static class CookMealRequest {
        @NotNull
        public UUID mealId;
    }

    @PostMapping("/cook-meal")
    public Response cookMeal(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody CookMealRequest requestBody) {
        Login login = Authorization.authorize(authorizationHeader);
        UUID familyOwner = Authorization.getFamilyOwnerId(login);

        Database.openConnection((Connection con) -> {
            // Fetch necessary templates
            PreparedStatement templateStatement = con.prepareStatement(String.format("""
                SELECT template_id, %1$s.amount FROM %1$s
                INNER JOIN %2$s
                ON meal_id = %2$s.id
                WHERE meal_id = ? AND owner = ?;
            """, MEAL_INGREDIENTS_TABLE, MEALS_TABLE));

            templateStatement.setObject(1, requestBody.mealId);
            templateStatement.setObject(2, familyOwner);

            ResultSet templateResult = templateStatement.executeQuery();

            @AllArgsConstructor
            class MealTemplate {
                UUID templateId;
                double amount;
            }

            List<MealTemplate> templates = new ArrayList<>();
            while (templateResult.next())
                templates.add(new MealTemplate((UUID) templateResult.getObject(1), templateResult.getDouble(2)));

            if (templates.size() == 0)
                return Response.Fail("No ingredients found.");

            // Get ingredients in meal
            PreparedStatement ingredientStatement = con.prepareStatement(String.format("""
                SELECT %1$s.id, %1$s.template_id %1$s.amount FROM %1$s
                INNER JOIN %2$s
                ON %1$s.template_id = %1$s.id
                INNER JOIN %3$s
                ON %3$s.template_id = %1$s.template_id
                WHERE %3$s.meal_id = ?
                ORDER BY %1$s.add_date
            """, FOOD_ITEMS_TABLE, FOOD_ITEM_TEMPLATES_TABLE, MEAL_INGREDIENTS_TABLE));

            ingredientStatement.setObject(1, requestBody.mealId);

            ResultSet ingredientResult = ingredientStatement.executeQuery();

            class FoodItem {
                UUID id;
                double amount;
                Double newAmount = null;

                public FoodItem(UUID id, double amount) {
                    this.id = id;
                    this.amount = amount;
                }
            }

            Map<UUID, List<FoodItem>> foodItems = new HashMap<>();
            while (ingredientResult.next()) {
                UUID templateId = (UUID) ingredientResult.getObject(2);
                FoodItem foodItem = new FoodItem((UUID) ingredientResult.getObject(1), ingredientResult.getDouble(3));

                if (!foodItems.containsKey(templateId))
                    foodItems.put(templateId, new ArrayList<>());

                List<FoodItem> likeFoodItems = foodItems.get(templateId);
                likeFoodItems.add(foodItem);
            }

            // Attempt to cook the meal
            for (MealTemplate template : templates) {
                List<FoodItem> likeFoodItems = foodItems.get(template.templateId);

                if (likeFoodItems == null)
                    return Response.Fail("Insufficient ingredients.");

                double amountLeft = template.amount;
                for (FoodItem foodItem : likeFoodItems) {
                    double used = Math.min(amountLeft, foodItem.amount);

                    foodItem.newAmount = foodItem.amount - used;
                    amountLeft -= used;

                    if (amountLeft == 0)
                        break;
                }

                if (amountLeft > 0.001)
                    return Response.Fail("Insufficient ingredients.");
            }

            try {
                // Update ingredients
                con.setAutoCommit(false);
                for (List<FoodItem> likeFoodItems : foodItems.values()) {
                    for (FoodItem foodItem : likeFoodItems) {
                        if (foodItem.newAmount != null) {
                            PreparedStatement updateStatement = con.prepareStatement(String.format("""
                                UPDATE %s
                                SET amount = ?
                                WHERE id = ?;
                            """, FOOD_ITEMS_TABLE));

                            updateStatement.setDouble(1, foodItem.newAmount);
                            updateStatement.setObject(2, foodItem.id);

                            updateStatement.executeUpdate();
                        }
                    }
                }

                PreparedStatement deleteStatement = con.prepareStatement(String.format("""
                    DELETE FROM %s
                    WHERE amount <= 0;
                """, FOOD_ITEMS_TABLE));

                deleteStatement.executeUpdate();

                con.commit();
            } catch (SQLException ex) {
                con.rollback();

                throw ex;
            }

            return null;
        })
        .throwIfError()
        .throwResponse();

        return Response.Success("Inventory updated.");
    }
}
