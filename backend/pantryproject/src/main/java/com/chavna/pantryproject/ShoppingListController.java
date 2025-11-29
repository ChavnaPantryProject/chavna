package com.chavna.pantryproject;

import static com.chavna.pantryproject.Database.SHOPPING_LIST_TABLE;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.chavna.pantryproject.Authorization.Login;

import jakarta.annotation.Nullable;
import jakarta.validation.Valid;

@RestController
public class ShoppingListController {
    public static class ShoppingListItem {
        public String name;
        @Nullable
        public Boolean isChecked;
    }

    public static class ShoppingList {
        public ArrayList<ShoppingListItem> items;

        public ShoppingList() {
            this.items = new ArrayList<>();
        }
    }

    @PostMapping("/update-shopping-list")
    public Response updateShoppingList(@RequestHeader("Authorization") String authorizationHeader, @Valid @RequestBody ShoppingList requestBody) {
        Login login = Authorization.authorize(authorizationHeader);

        Database.openDatabaseConnection((Connection con) -> {
            PreparedStatement delete = con.prepareStatement(String.format("""
                DELETE FROM %s
                WHERE user_id = ?
            """, SHOPPING_LIST_TABLE));
            delete.setObject(1, login.userId);
            delete.executeUpdate();

            if (requestBody.items.size() == 0)
                return Response.Success();

            String query = String.format("INSERT INTO %s (item_name, buy_item, user_id, order_index) VALUES", SHOPPING_LIST_TABLE);
            for (@SuppressWarnings("unused") var __ : requestBody.items) {
                query += " (?, ?, ?, ?),";
            }
            query = query.substring(0, query.length() - 1);
            PreparedStatement insert = con.prepareStatement(query);

            int i = 1;
            int order = 0;
            for (ShoppingListItem item : requestBody.items) {
                insert.setString(i, item.name);
                i++;

                boolean isChecked = item.isChecked != null && item.isChecked.booleanValue();
                insert.setBoolean(i, isChecked);
                i++;

                insert.setObject(i, login.userId);
                i++;

                insert.setInt(i, order);
                i++;

                order++;
            }

            insert.executeUpdate();

            return null;
        }).throwIfError();

        return Response.Success();
    }

    @PostMapping("/get-shopping-list")
    public Response getShoppingList(@RequestHeader("Authorization") String authorizationHeader) {
        Login login = Authorization.authorize(authorizationHeader);

        Database.openDatabaseConnection((Connection con) -> {
            PreparedStatement statement = con.prepareStatement(String.format("""
                SELECT item_name, buy_item FROM %s
                WHERE user_id = ?
                ORDER BY order_index;
            """, SHOPPING_LIST_TABLE));
            statement.setObject(1, login.userId);

            ResultSet result = statement.executeQuery();

            ShoppingList list = new ShoppingList();
            while (result.next()) {
                ShoppingListItem item = new ShoppingListItem();
                item.name = result.getString(1);
                item.isChecked = Boolean.valueOf(result.getBoolean(2));
                list.items.add(item);
            }

            return Response.Success(list);
        }).throwIfError();

        // This should be unreachable
        return null;
    }
}
