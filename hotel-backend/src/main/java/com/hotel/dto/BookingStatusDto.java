package com.hotel.dto;

import com.hotel.model.BookingStatus;

import javax.validation.constraints.NotNull;

public class BookingStatusDto {

    @NotNull(message = "Статус бронирования обязателен")
    private BookingStatus status;

    public BookingStatusDto() {
    }

    public BookingStatusDto(BookingStatus status) {
        this.status = status;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }
}
