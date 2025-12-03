package com.chavna.pantryproject;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.fasterxml.jackson.annotation.JsonInclude.Include;

import lombok.Getter;

public class Response extends ResponseEntity<Response.ResponseBody> {
    @JsonInclude(Include.NON_NULL)
    @JsonPropertyOrder({"success", "status", "message", "payload"})
    static class ResponseBody {
        @Getter
        private String success;
        @Getter
        private int status;
        @Getter
        private String message;
        @Getter
        private Object payload;

        public ResponseBody(String success, Object payload, String message) {
            this.success = success;
            this.payload = payload;
            this.message = message;
        }
    }

    private Response(ResponseBody body, HttpStatusCode status) {
        super(body, status);

        body.status = status.value();
    }

    public static Response Success() {
        return new Response(new ResponseBody("success", null, null), HttpStatus.OK);
    }

    public static Response Success(String message) {
        return new Response(new ResponseBody("success", null, message), HttpStatus.OK);
    }

    public static Response Success(Object payload) {
        return new Response(new ResponseBody("success", payload, null), HttpStatus.OK);
    }

    public static Response Success(String message, Object payload) {
        return new Response(new ResponseBody("success", payload, message), HttpStatus.OK);
    }

    public static Response Fail() {
        return new Response(new ResponseBody("fail", null, null), HttpStatus.OK);
    }

    public static Response Fail(String message) {
        return new Response(new ResponseBody("fail", null, message), HttpStatus.OK);
    }

    public static Response Fail(String message, Object payload) {
        return new Response(new ResponseBody("fail", payload, message), HttpStatus.OK);
    }

    public static Response Error(HttpStatusCode statusCode) {
        return new Response(new ResponseBody("error", null, null), statusCode);
    }

    public static Response Error(HttpStatusCode statusCode, String message) {
        return new Response(new ResponseBody("error", null, message), statusCode);
    }

    public static Response Error(HttpStatusCode statusCode, Object payload) {
        return new Response(new ResponseBody("error", payload, null), statusCode);
    }

    public static Response Error(HttpStatusCode statusCode, String message, Object payload) {
        return new Response(new ResponseBody("error", payload, message), statusCode);
    }
}
