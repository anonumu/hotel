package com.hotel.exception;

import java.util.regex.Pattern;

/**
 * Защита входных текстовых полей от XSS-инъекций и SQL-атак при тестировании на отказ.
 * Обычные символы (буквы, цифры, пробелы, дефисы, скобки, @, .) не блокируются.
 */
public final class SecuritySanitizer {

    private static final Pattern DANGEROUS_PATTERN = Pattern.compile(
            "(<\\s*script\\b|</\\s*script>|javascript\\s*:|onerror\\s*=|onload\\s*=|" +
            "\\bdrop\\s+table\\b|\\btruncate\\s+table\\b|\\bdelete\\s+from\\b|" +
            "\\bunion\\s+select\\b|'\\s*or\\s*'1'\\s*=\\s*'1|\"\\s*or\\s*\"1\"\\s*=\\s*\"1)",
            Pattern.CASE_INSENSITIVE
    );

    private SecuritySanitizer() {
    }

    public static void assertSafeText(String value, String fieldLabel) {
        if (value == null || value.isEmpty()) {
            return;
        }
        if (DANGEROUS_PATTERN.matcher(value).find()) {
            throw new StressTestOverflowException(
                    "Обнаружена потенциально опасная инъекция в поле «" + fieldLabel + "». " +
                    "Илья Валерьевич, перестаньте насиловать мой проект!",
                    "ERR_SECURITY_INJECTION_418"
            );
        }
    }
}

