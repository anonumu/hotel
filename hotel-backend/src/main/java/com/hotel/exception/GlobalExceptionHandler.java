package com.hotel.exception;

import com.hotel.dto.ErrorResponseDto;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import javax.validation.ConstraintViolationException;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Обработка отсутствующих сущностей (404)
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponseDto> handleNotFound(ResourceNotFoundException ex) {
        ErrorResponseDto error = new ErrorResponseDto(
                HttpStatus.NOT_FOUND.value(),
                "Ресурс не найден",
                ex.getMessage() != null ? ex.getMessage() : "Запрашиваемый объект не найден в системе",
                "ERR_NOT_FOUND_404"
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    // Обработка стресс-тестирования граничных значений Ильей Валерьевичем (HTTP 418 / Overload Trapped)
    @ExceptionHandler(StressTestOverflowException.class)
    public ResponseEntity<ErrorResponseDto> handleStressTest(StressTestOverflowException ex) {
        ErrorResponseDto error = new ErrorResponseDto(
                418,
                "ERR_SAMSONOV_STRESS_TEST_OVERFLOW",
                ex.getMessage(),
                ex.getErrorCode() != null ? ex.getErrorCode() : "ERR_SAMSONOV_STRESS_TEST_OVERFLOW_418"
        );
        return ResponseEntity.status(418).body(error);
    }

    // Обработка явных бизнес-ошибок (400)
    @ExceptionHandler(BusinessLogicException.class)
    public ResponseEntity<ErrorResponseDto> handleBusinessLogic(BusinessLogicException ex) {
        ErrorResponseDto error = new ErrorResponseDto(
                HttpStatus.BAD_REQUEST.value(),
                "Ошибка бизнес-логики",
                ex.getMessage() != null ? ex.getMessage() : "Операция отклонена правилами системы",
                "ERR_BUSINESS_LOGIC_400"
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // Обработка ошибок валидации полей DTO (@Valid) (400)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDto> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> {
                    String field = fieldError.getField();
                    String defaultMsg = fieldError.getDefaultMessage();
                    return field + ": " + defaultMsg;
                })
                .collect(Collectors.joining("; "));
        if (message.isEmpty()) {
            message = "Проверьте корректность заполненных полей";
        }
        ErrorResponseDto error = new ErrorResponseDto(
                HttpStatus.BAD_REQUEST.value(),
                "Ошибка валидации данных",
                message
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // Обработка ошибок ограничений валидации (400)
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponseDto> handleConstraintViolation(ConstraintViolationException ex) {
        String message = ex.getConstraintViolations().stream()
                .map(cv -> cv.getPropertyPath() + ": " + cv.getMessage())
                .collect(Collectors.joining("; "));
        ErrorResponseDto error = new ErrorResponseDto(
                HttpStatus.BAD_REQUEST.value(),
                "Нарушение ограничений валидации",
                message.isEmpty() ? ex.getMessage() : message
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // Обработка нарушения целостности базы данных (Foreign Key, Unique) (400)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponseDto> handleDataIntegrity(DataIntegrityViolationException ex) {
        String detail = "Нарушение целостности данных. Запись связана с другими документами или значение уже занято.";
        if (ex.getRootCause() != null && ex.getRootCause().getMessage() != null) {
            String rootMsg = ex.getRootCause().getMessage().toLowerCase();
            if (rootMsg.contains("unique") || rootMsg.contains("duplicate")) {
                detail = "Запись с такими уникальными данными (номер, email или паспорт) уже зарегистрирована.";
            } else if (rootMsg.contains("foreign key") || rootMsg.contains("referential")) {
                detail = "Невозможно выполнить удаление/изменение: объект связан с активными бронированиями или платежами.";
            }
        }
        ErrorResponseDto error = new ErrorResponseDto(
                HttpStatus.BAD_REQUEST.value(),
                "Конфликт целостности данных",
                detail
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // Обработка нечитаемого JSON или недопустимых значений enum (400)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponseDto> handleNotReadable(HttpMessageNotReadableException ex) {
        ErrorResponseDto error = new ErrorResponseDto(
                HttpStatus.BAD_REQUEST.value(),
                "Некорректный формат данных",
                "Не удалось прочитать тело запроса. Проверьте правильность формата JSON и соответствие типов полей."
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // Обработка неверного типа параметра в URL или query (400)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponseDto> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String param = ex.getName();
        String message = "Параметр '" + param + "' имеет неверный формат";
        if (ex.getRequiredType() != null) {
            message += " (ожидался " + ex.getRequiredType().getSimpleName() + ")";
        }
        ErrorResponseDto error = new ErrorResponseDto(
                HttpStatus.BAD_REQUEST.value(),
                "Неверный параметр запроса",
                message
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // Обработка неподдерживаемого HTTP-метода (405)
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponseDto> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        ErrorResponseDto error = new ErrorResponseDto(
                HttpStatus.METHOD_NOT_ALLOWED.value(),
                "Метод не поддерживается",
                "HTTP-метод " + ex.getMethod() + " не поддерживается для данного пути"
        );
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(error);
    }

    // Обработка прочих непредвиденных исключений (500)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDto> handleGeneral(Exception ex) {
        String msg = ex.getMessage();
        if (msg == null || msg.trim().isEmpty()) {
            msg = "Произошла внутренняя непредвиденная ошибка (" + ex.getClass().getSimpleName() + ")";
        }
        ErrorResponseDto error = new ErrorResponseDto(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Внутренняя ошибка сервера",
                msg
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
