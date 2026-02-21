package com.example.frly;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FrlyApplication {

    public static void main(String[] args) {
        SpringApplication.run(FrlyApplication.class, args);
    }

}
