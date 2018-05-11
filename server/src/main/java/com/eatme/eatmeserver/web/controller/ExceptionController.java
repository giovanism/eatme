package com.eatme.eatmeserver.web.controller;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@SuppressWarnings("unused")
@RestController
public class ExceptionController implements ErrorController {

    private static final String PATH = "/error";

    @RequestMapping(value = PATH)
    public String error() {
        return "<!DOCTYPE html><html lang=\'en\'>" +
            "<head><meta charset=\'UTF-8\'><title>EatMe</title></head>" +
            "<body>You've found my biggest secret!</body></html>";
    }

    @Override
    public String getErrorPath() {
        return PATH;
    }

}
