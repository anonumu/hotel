package com.hotel.dto;

import com.hotel.model.BookingStatus;

import javax.validation.constraints.FutureOrPresent;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;

public class BookingRequestDto {

    @NotNull(message = "ID номера обязателен")
    private Long roomId;

    @NotNull(message = "ID гостя обязателен")
    private Long guestId;

    @NotNull(message = "Дата заезда обязательна")
    private LocalDate checkInDate;

    @NotNull(message = "Дата выезда обязательна")
    private LocalDate checkOutDate;

    private int guestCount;

    private BookingStatus status;

    public BookingRequestDto() {
    }

    public BookingRequestDto(Long roomId, Long guestId, LocalDate checkInDate,
                             LocalDate checkOutDate, int guestCount, BookingStatus status) {
        this.roomId = roomId;
        this.guestId = guestId;
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.guestCount = guestCount;
        this.status = status;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public Long getGuestId() {
        return guestId;
    }

    public void setGuestId(Long guestId) {
        this.guestId = guestId;
    }

    public LocalDate getCheckInDate() {
        return checkInDate;
    }

    public void setCheckInDate(LocalDate checkInDate) {
        this.checkInDate = checkInDate;
    }

    public LocalDate getCheckOutDate() {
        return checkOutDate;
    }

    public void setCheckOutDate(LocalDate checkOutDate) {
        this.checkOutDate = checkOutDate;
    }

    public int getGuestCount() {
        return guestCount;
    }

    public void setGuestCount(int guestCount) {
        this.guestCount = guestCount;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }
}
