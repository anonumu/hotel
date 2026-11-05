package com.hotel.dto;

import com.hotel.model.RoomStatus;

import javax.validation.constraints.NotNull;

public class RoomStatusDto {

    @NotNull(message = "Статус комнаты обязателен")
    private RoomStatus status;

    public RoomStatusDto() {
    }

    public RoomStatusDto(RoomStatus status) {
        this.status = status;
    }

    public RoomStatus getStatus() {
        return status;
    }

    public void setStatus(RoomStatus status) {
        this.status = status;
    }
}
