package com.hotel;

import com.hotel.exception.SecuritySanitizer;
import com.hotel.exception.StressTestOverflowException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Тестирование защиты от стресс-тестирования и санитайзера")
class SecuritySanitizerTest {

    @Test
    @DisplayName("Корректный текст проходит валидацию без исключений")
    void testCleanTextSanitization() {
        assertDoesNotThrow(() -> SecuritySanitizer.assertSafeText("Иван", "Имя гостя"));
        assertDoesNotThrow(() -> SecuritySanitizer.assertSafeText("ул. Ленина, д. 10", "Адрес"));
    }

    @Test
    @DisplayName("XSS инъекция отлавливается StressTestOverflowException")
    void testXssDetection() {
        StressTestOverflowException ex = assertThrows(
                StressTestOverflowException.class,
                () -> SecuritySanitizer.assertSafeText("<script>alert('xss')</script>", "Имя гостя")
        );
        assertTrue(ex.getMessage().contains("Илья Валерьевич"));
        assertEquals("ERR_SECURITY_INJECTION_418", ex.getErrorCode());
    }

    @Test
    @DisplayName("SQL инъекция отлавливается StressTestOverflowException")
    void testSqlInjectionDetection() {
        StressTestOverflowException ex = assertThrows(
                StressTestOverflowException.class,
                () -> SecuritySanitizer.assertSafeText("test' UNION SELECT * FROM users--", "Паспорт")
        );
        assertTrue(ex.getMessage().contains("Илья Валерьевич"));
        assertEquals("ERR_SECURITY_INJECTION_418", ex.getErrorCode());
    }
}
