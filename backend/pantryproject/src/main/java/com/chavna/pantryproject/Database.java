package com.chavna.pantryproject;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.HashMap;

public class Database {
    public static Connection getRemoteConnection() {
        try {
            Class.forName("org.postgresql.Driver");
            String use = System.getenv("USE_NEON_DATABASE");
            if (use != null && use.equals("1")) {
                String jdbcUrl = "jdbc:" + Env.getenvNotNull("DATABASE_URL");
                return DriverManager.getConnection(jdbcUrl);
            }
                
            String hostname = Env.getenvNotNull("RDS_HOSTNAME");
            String dbName = Env.getenvNotNull("RDS_DB_NAME");
            String userName = Env.getenvNotNull("RDS_USERNAME");
            String password = Env.getenvNotNull("RDS_PASSWORD");
            String port = Env.getenvNotNull("RDS_PORT");
            String jdbcUrl = "jdbc:postgresql://" + hostname + ":" + port + "/" + dbName + "?user=" + userName + "&password=" + password;
            return DriverManager.getConnection(jdbcUrl);
        }
        // Rethrow exceptions as RuntimeExceptions since spring boot is going to automatically catch them anyway.
        // I'd rather not be forced to explicitly deal with them if they arent going to crash the whole server.
        // Probably bad practice, but idc.
        catch (RuntimeException ex) { throw ex; }
        catch (Exception ex) { throw new RuntimeException(ex); }
    }

    public static HashMap<String, Object> objectFromResultSet(ResultSet resultSet) throws SQLException {
        ResultSetMetaData metadata = resultSet.getMetaData();

        HashMap<String, Object> map = new HashMap<>();
        for (int i = 1; i <= metadata.getColumnCount(); i++) {
            String columnName = metadata.getColumnName(i);
            Object obj = resultSet.getObject(i);
            map.put(columnName, obj);
        }

        return map;
    }

    public static HashMap<String, Object> getDefaultTableEntry(Connection dbConnection, String tableName) throws SQLException {
        HashMap<String, Object> object = new HashMap<>();

        PreparedStatement statement = dbConnection.prepareStatement("""
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
            PreparedStatement castStatement = dbConnection.prepareStatement(String.format("""
                SELECT CAST(casted_value AS %s) FROM (VALUES (?)) AS temp_values (casted_value)
            """, data_type));
            castStatement.setString(1, default_value);
            ResultSet casted = castStatement.executeQuery();

            if (casted.next())
                object.put(name, casted.getObject(1));
        }

        return object;
    }
}
