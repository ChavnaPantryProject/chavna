package com.chavna.pantryproject;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import jakarta.servlet.http.HttpServletRequest;

@ControllerAdvice
public class ErrorControler {
    @ExceptionHandler(ResponseException.class)
    public Response responseException(ResponseException response) {
        return response.getResponse();
    }

    @ExceptionHandler(RuntimeException.class)
    public Response runtimeException(HttpServletRequest req, RuntimeException ex) {
        return Response.Error(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage());
    }
}
