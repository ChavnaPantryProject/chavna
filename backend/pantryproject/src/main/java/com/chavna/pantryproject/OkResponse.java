package com.chavna.pantryproject;

import org.springframework.http.ResponseEntity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;

import lombok.Getter;

@JsonInclude(Include.NON_NULL)
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

    public static ResponseEntity<OkResponse> Success() {
        return ResponseEntity.ok(new OkResponse("success", null, null));
    }

    public static ResponseEntity<OkResponse> Success(String message) {
        return ResponseEntity.ok(new OkResponse("success", null, message));
    }

    public static ResponseEntity<OkResponse> Success(Object payload) {
        return ResponseEntity.ok(new OkResponse("success", payload, null));
    }

    public static ResponseEntity<OkResponse> Success(String message, Object payload) {
        return ResponseEntity.ok(new OkResponse("success", payload, message));
    }

    public static ResponseEntity<OkResponse> Error() {
        return ResponseEntity.ok(new OkResponse("error", null, null));
    }

    public static ResponseEntity<OkResponse> Error(String message) {
        return ResponseEntity.ok(new OkResponse("error", null, message));
    }
}
