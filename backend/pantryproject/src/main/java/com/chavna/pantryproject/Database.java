package com.chavna.pantryproject;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.apache.commons.dbcp2.BasicDataSource;

import org.springframework.http.HttpStatus;

import com.google.errorprone.annotations.CheckReturnValue;

import lombok.AllArgsConstructor;

public class Database {
    public static final String FAMILY_TABLE = "family";
    public static final String FAMILY_MEMBER_TABLE = "family_member";
    public static final String FOOD_ITEM_TEMPLATES_TABLE = "food_item_templates";
    public static final String FOOD_ITEMS_TABLE = "food_items";
    public static final String MEAL_INGREDIENTS_TABLE = "meal_ingredients";
    public static final String MEALS_TABLE = "meals";
    public static final String PERSONAL_INFO_TABLE = "personal_info";
    public static final String SCAN_ITEMS_TABLE = "scan_items";
    public static final String SHOPPING_LIST_TABLE = "shopping_list";
    public static final String USERS_TABLE = "users";
    public static final String CATEGORIES_TABLE = "user_categories";

    private static final String jdbcUrl = getConnectionUrl();
    private static final BasicDataSource dataSource = getDataSource();

    private static BasicDataSource getDataSource() {
        try {
            BasicDataSource dataSource = new BasicDataSource();
            dataSource.setDriverClassName("org.postgresql.Driver");
            dataSource.setUrl(jdbcUrl);

            dataSource.setInitialSize(10);
            dataSource.setMaxTotal(100);
            dataSource.setMaxIdle(20);
            dataSource.setMinIdle(10);
            dataSource.setMaxWait(Duration.ofSeconds(10));
            dataSource.setMaxConn(Duration.ofSeconds(10)); // This appears to not work, but i'm leaving it here just in case it starts working one day.
            dataSource.setDurationBetweenEvictionRuns(Duration.ofMinutes(30));

            return dataSource;
        }
        // Rethrow exceptions as RuntimeExceptions since spring boot is going to automatically catch them anyway.
        // I'd rather not be forced to explicitly deal with them if they arent going to crash the whole server.
        // Probably bad practice, but idc.
        catch (RuntimeException ex) { throw ex; }
        catch (Exception ex) { throw new RuntimeException(ex); }
    }

    private static String getConnectionUrl() {
        String use = System.getenv("USE_NEON_DATABASE");
        if (use != null && use.equals("1")) {
            String jdbcUrl = "jdbc:" + Env.getenvNotNull("DATABASE_URL");
            return jdbcUrl;
        }
            
        String hostname = Env.getenvNotNull("RDS_HOSTNAME");
        String dbName = Env.getenvNotNull("RDS_DB_NAME");
        String userName = Env.getenvNotNull("RDS_USERNAME");
        String password = Env.getenvNotNull("RDS_PASSWORD");
        String port = Env.getenvNotNull("RDS_PORT");
        String jdbcUrl = "jdbc:postgresql://" + hostname + ":" + port + "/" + dbName + "?user=" + userName + "&password=" + password;

        return jdbcUrl;
    }
    public static interface ConnectionErrorHandler {
        Response handleError(SQLException ex);
    }

    @AllArgsConstructor
    public static class ConnectionResult {
        SQLException ex;
        Response response;

        /***
         * If the result is an error, call this function to manually process it.
         * @param errorHandler - function for handling error.
         * @return itself
         */
        @CheckReturnValue
        public ConnectionResult onSQLError(ConnectionErrorHandler errorHandler) {
            if (ex != null) {
                Response response = errorHandler.handleError(ex);

                if (response != null)
                    throw new ResponseException(response);
            }
            
            return this;
        }

        /***
         * If the result is an error, throw an ResponseException
         */
        @CheckReturnValue
        public ConnectionResult throwIfError() {
            if (ex != null)
                throw getSQLErrorHTTPResponseException(ex);

            return this;
        }

        public Response getResponse() {
            return response;
        }

        public void ignoreResponse() {}

        public void throwResponse() {
            if (response != null)
                throw new ResponseException(response);
        }
    }

    public static interface DatabaseConnection {
        Response connect(Connection con) throws SQLException;
    }

    /***
     * Opens a database connection from the connection pool.
     * @param connection - Function to use connection. Return null to continue execution, or return a Response object to throw a ResponseException (if you want your outer function to return early).
     * @return Result type to manually handle the error or throw it.
     */

    @CheckReturnValue
    // @SuppressWarnings("Finally")
    public static ConnectionResult openConnection(DatabaseConnection connection) {
        Connection con = null;
        ConnectionResult result = null;
        try {
            try {
                con = dataSource.getConnection();
                Response response = connection.connect(con);

                // if (response != null)
                //     throw new ResponseException(response);

                result = new ConnectionResult(null, response);
            } catch (SQLException ex) {
                result = new ConnectionResult(ex, null);
            } finally {
                if (con != null)
                    con.close();
            }
        }  catch (SQLException ex) {
            if (result != null) {
                result.ex.printStackTrace();
                throw new RuntimeException("Double SQLException.", ex);
            } else {
                result = new ConnectionResult(ex, null);
            }
        }

        return result;
    }

    public static Map<String, Object> objectFromResultSet(ResultSet resultSet) throws SQLException {
        ResultSetMetaData metadata = resultSet.getMetaData();

        HashMap<String, Object> map = new HashMap<>();
        for (int i = 1; i <= metadata.getColumnCount(); i++) {
            String columnName = metadata.getColumnName(i);
            Object obj = resultSet.getObject(i);
            map.put(columnName, obj);
        }

        return map;
    }

    public static Map<String, Object> getDefaultTableEntry(Connection dbConnection, String tableName) throws SQLException {
        HashMap<String, Object> object = new HashMap<>();

        PreparedStatement statement = dbConnection.prepareStatement(
            """
            SELECT column_name, column_default, data_type
            FROM information_schema.columns
            WHERE (table_schema, table_name) = ('public', ?)
            ORDER BY ordinal_position;
            """);
        statement.setString(1, tableName);
        ResultSet result = statement.executeQuery();

        while (result.next()) {
            String name = result.getString("column_name");
            String default_value = result.getString("column_default");
            String data_type = result.getString("data_type");

            // Schema stores default values as strings, so it must be cast to the correct type.
            // Unfortunately, I can't find a good way to do this in java rather than an sql query for each field.
            PreparedStatement castStatement = dbConnection.prepareStatement(String.format(
                """
                SELECT CAST(casted_value AS %s) FROM (VALUES (?)) AS temp_values (casted_value)
                """, data_type));
            castStatement.setString(1, default_value);
            ResultSet casted = castStatement.executeQuery();

            if (casted.next())
                object.put(name, casted.getObject(1));
        }

        return object;
    }

    public static Map<String, Object> getUserPersonalInfo(Connection con, UUID user) throws SQLException {
        PreparedStatement personalInfoStatement = con.prepareStatement(String.format(
            """
            SELECT * FROM %s WHERE user_id = ?
            """, PERSONAL_INFO_TABLE));
        personalInfoStatement.setObject(1, user);
        ResultSet query2 = personalInfoStatement.executeQuery();
        
        Map<String, Object> jsonObject;
        if (query2.next()) {
            jsonObject = Database.objectFromResultSet(query2);
        } else {
            jsonObject = Database.getDefaultTableEntry(con, PERSONAL_INFO_TABLE);
        }
        
        jsonObject.remove("user_id");

        return jsonObject;
    }

    public static String getUserEmail(Connection con, UUID user) throws SQLException {
        PreparedStatement query = con.prepareStatement(String.format(
            """
            SELECT email FROM %s
            WHERE id = ?
            """, USERS_TABLE));
        query.setObject(1, user);
        ResultSet result = query.executeQuery();

        if (!result.next())
            throw new ResponseException(Response.Error(HttpStatus.NOT_FOUND, "User does not exist."));
        
        return result.getString(1);
    }

    private static ResponseException getSQLErrorHTTPResponseException(SQLException ex) {
        System.err.println("SQL State: " + ex.getSQLState());
        ex.printStackTrace();

        return new ResponseException(Response.Error(HttpStatus.INTERNAL_SERVER_ERROR, "SQL Error."));
    }
}
