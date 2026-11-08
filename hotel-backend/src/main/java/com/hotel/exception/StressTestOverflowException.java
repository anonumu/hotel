package com.hotel.exception;

/**
 * Исключение для перехвата стресс-тестирования граничных значений и перегрузки базы данных
 * (проверка максимального числа клиентов, максимальных сумм и фаззинга параметров).
 */
public class StressTestOverflowException extends RuntimeException {

    private final String errorCode;

    public StressTestOverflowException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}

