package com.chavna.pantryproject;

public class Env {
    public static String getenvNotNull(String name) {
        String env = System.getenv(name);

        if (env == null)
            throw new RuntimeException("Environment variable '" + name + "' not set.");

        return env;
    }
}
