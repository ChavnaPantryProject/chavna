package com.chavna.pantryproject;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
public class ResponseException extends RuntimeException {
    @Getter
    private Response response;
}
