package com.hotel.dto;

import com.hotel.model.PaymentMethod;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

public class PaymentRequestDto {

    @NotNull(message = "ID бронирования обязателен")
    private Long bookingId;

    @NotNull(message = "Сумма платежа обязательна")
    @DecimalMin(value = "0.01", message = "Сумма должна быть больше нуля")
    private BigDecimal amount;

    @NotNull(message = "Способ оплаты обязателен")
    private PaymentMethod method;

    private String description;

    public PaymentRequestDto() {
    }

    public PaymentRequestDto(Long bookingId, BigDecimal amount, PaymentMethod method, String description) {
        this.bookingId = bookingId;
        this.amount = amount;
        this.method = method;
        this.description = description;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public PaymentMethod getMethod() {
        return method;
    }

    public void setMethod(PaymentMethod method) {
        this.method = method;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
