package com.chavna.pantryproject;

import lombok.Getter;

public class OkResponse {
    @Getter
    private String success;
    @Getter
    private Object payload;
    @Getter
    private String message;

    private OkResponse(String success, Object payload, String message) {
        this.success = success;
        this.payload = payload;
        this.message = message;
    }

    public static OkResponse Success() {
        return new OkResponse("success", null, null);
    }

    public static OkResponse Success(String message) {
        return new OkResponse("success", null, message);
    }

    public static OkResponse Success(Object payload) {
        return new OkResponse("success", payload, null);
    }

    public static OkResponse Success(String message, Object payload) {
        return new OkResponse("success", payload, message);
    }

    public static OkResponse Error() {
        return new OkResponse("error", null, null);
    }

    public static OkResponse Error(String message) {
        return new OkResponse("error", null, message);
    }
}
