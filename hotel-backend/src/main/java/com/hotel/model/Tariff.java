package com.hotel.model;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "tariffs")
public class Tariff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", nullable = false)
    private RoomType roomType;

    @Column(name = "price_per_night", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerNight;

    @Column(name = "season_start")
    private LocalDate seasonStart;

    @Column(name = "season_end")
    private LocalDate seasonEnd;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    public Tariff() {
    }

    public Tariff(String name, RoomType roomType, BigDecimal pricePerNight,
                  LocalDate seasonStart, LocalDate seasonEnd, boolean isActive) {
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
