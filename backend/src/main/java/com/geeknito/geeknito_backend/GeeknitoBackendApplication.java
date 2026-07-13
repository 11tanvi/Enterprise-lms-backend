package com.geeknito.geeknito_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class GeeknitoBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(GeeknitoBackendApplication.class, args);
    }
}
