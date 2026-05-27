package com.smartfarm.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the SmartFarm Spring Boot API.
 */
@SpringBootApplication
public class SmartFarmApiApplication {
    /**
     * Starts the SmartFarm API application context.
     *
     * @param args command-line arguments passed at startup
     */
    public static void main(String[] args) {
        SpringApplication.run(SmartFarmApiApplication.class, args);
    }
}
