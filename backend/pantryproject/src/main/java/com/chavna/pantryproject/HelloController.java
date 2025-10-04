package com.chavna.pantryproject;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {
    private static Logger logger = LoggerFactory.getLogger(HelloController.class);

    private static Connection getRemoteConnection() {
        if (System.getenv("RDS_HOSTNAME") != null) {
        try {
            Class.forName("org.postgresql.Driver");
            String dbName = System.getenv("RDS_DB_NAME");
            String userName = System.getenv("RDS_USERNAME");
            String password = System.getenv("RDS_PASSWORD");
            String hostname = System.getenv("RDS_HOSTNAME");
            String port = System.getenv("RDS_PORT");
            String jdbcUrl = "jdbc:postgresql://" + hostname + ":" + port + "/" + dbName + "?user=" + userName + "&password=" + password;
            logger.trace("Getting remote connection with connection string from environment variables.");
            Connection con = DriverManager.getConnection(jdbcUrl);
            logger.info("Remote connection successful.");
            return con;
        }
            catch (ClassNotFoundException e) { logger.warn(e.toString());}
            catch (SQLException e) { logger.warn(e.toString());}
        }
        return null;
    }

	@GetMapping("/")
	public String index() {
		return "Greetings from Spring Boot!";
	}

}