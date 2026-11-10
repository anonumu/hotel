package com.hotel.dto;

import com.hotel.model.RoomStatus;
import com.hotel.model.RoomType;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

public class RoomDto {

    private Long id;

    @NotBlank(message = "Номер комнаты обязателен")
    private String roomNumber;

    @NotNull(message = "Тип номера обязателен")
    private RoomType type;

    private RoomStatus status;

    private int floor;

    @NotNull(message = "Цена за сутки обязательна")
    private BigDecimal pricePerNight;

    private int maxGuests;

    private String description;

    public RoomDto() {
    }

    public RoomDto(Long id, String roomNumber, RoomType type, RoomStatus status,
                   int floor, BigDecimal pricePerNight, int maxGuests, String description) {
        this.id = id;
        this.roomNumber = roomNumber;
        this.type = type;
        this.status = status;
        this.floor = floor;
        this.pricePerNight = pricePerNight;
        this.maxGuests = maxGuests;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public RoomType getType() {
        return type;
    }

    public void setType(RoomType type) {
        this.type = type;
    }

    public RoomStatus getStatus() {
        return status;
    }

    public void setStatus(RoomStatus status) {
        this.status = status;
    }

    public int getFloor() {
        return floor;
    }

    public void setFloor(int floor) {
        this.floor = floor;
    }

    public BigDecimal getPricePerNight() {
        return pricePerNight;
    }

    public void setPricePerNight(BigDecimal pricePerNight) {
        this.pricePerNight = pricePerNight;
    }

    public int getMaxGuests() {
        return maxGuests;
    }

    public void setMaxGuests(int maxGuests) {
        this.maxGuests = maxGuests;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
