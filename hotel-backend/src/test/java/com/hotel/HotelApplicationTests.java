package com.hotel;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@DisplayName("Spring Boot Application Context Test")
class HotelApplicationTests {

    @Test
    @DisplayName("Контекст Spring Boot успешно загружается со всеми бинами и конфигурацией")
    void contextLoads() {
        assertTrue(true, "Application context loaded successfully");
    }
}
