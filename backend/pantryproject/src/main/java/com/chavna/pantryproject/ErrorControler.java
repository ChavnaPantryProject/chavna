package com.chavna.pantryproject;

import org.springframework.http.HttpStatus;
import org.springframework.validation.BindException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import jakarta.servlet.http.HttpServletRequest;

@ControllerAdvice
public class ErrorControler {
    @ExceptionHandler(ResponseException.class)
    public Response responseException(ResponseException response) {
        return response.getResponse();
    }

    @ExceptionHandler(BindException.class)
    public Response methodArgumentNotValidException(BindException ex){
        return Response.Error(HttpStatus.BAD_REQUEST, ex.toString());
    }

    @ExceptionHandler(Exception.class)
    public Response exception(HttpServletRequest req, Exception ex) {
        ex.printStackTrace();
        return Response.Error(HttpStatus.INTERNAL_SERVER_ERROR, ex.toString());
    }
}
