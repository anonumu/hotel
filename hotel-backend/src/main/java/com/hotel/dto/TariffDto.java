package com.hotel.dto;

import com.hotel.model.RoomType;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class TariffDto {

    private Long id;

    @NotBlank(message = "Название тарифа обязательно")
    private String name;

    @NotNull(message = "Категория номера обязательна")
    private RoomType roomType;

    @NotNull(message = "Цена за сутки обязательна")
    @Min(value = 0, message = "Цена не может быть отрицательной")
    private BigDecimal pricePerNight;

    private LocalDate seasonStart;

    private LocalDate seasonEnd;

    private boolean isActive;

    public TariffDto() {
    }

    public TariffDto(Long id, String name, RoomType roomType, BigDecimal pricePerNight,
                     LocalDate seasonStart, LocalDate seasonEnd, boolean isActive) {
        this.id = id;
        this.name = name;
        this.roomType = roomType;
        this.pricePerNight = pricePerNight;
        this.seasonStart = seasonStart;
        this.seasonEnd = seasonEnd;
        this.isActive = isActive;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public RoomType getRoomType() {
        return roomType;
    }

    public void setRoomType(RoomType roomType) {
        this.roomType = roomType;
    }

    public BigDecimal getPricePerNight() {
        return pricePerNight;
    }

    public void setPricePerNight(BigDecimal pricePerNight) {
        this.pricePerNight = pricePerNight;
    }

    public LocalDate getSeasonStart() {
        return seasonStart;
    }

    public void setSeasonStart(LocalDate seasonStart) {
        this.seasonStart = seasonStart;
    }

    public LocalDate getSeasonEnd() {
        return seasonEnd;
    }

    public void setSeasonEnd(LocalDate seasonEnd) {
        this.seasonEnd = seasonEnd;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }
}
