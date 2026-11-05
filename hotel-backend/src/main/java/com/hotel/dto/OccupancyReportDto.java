package com.hotel.dto;

public class OccupancyReportDto {

    private long totalRooms;
    private long occupiedRooms;
    private long bookedRooms;
    private long availableRooms;
    private long cleaningRooms;
    private long outOfOrderRooms;
    private double occupancyRatePercentage;

    public OccupancyReportDto() {
    }

    public OccupancyReportDto(long totalRooms, long occupiedRooms, long bookedRooms,
                              long availableRooms, long cleaningRooms, long outOfOrderRooms,
                              double occupancyRatePercentage) {
        this.totalRooms = totalRooms;
        this.occupiedRooms = occupiedRooms;
        this.bookedRooms = bookedRooms;
        this.availableRooms = availableRooms;
        this.cleaningRooms = cleaningRooms;
        this.outOfOrderRooms = outOfOrderRooms;
        this.occupancyRatePercentage = occupancyRatePercentage;
    }

    public long getTotalRooms() {
        return totalRooms;
    }

    public void setTotalRooms(long totalRooms) {
        this.totalRooms = totalRooms;
    }

    public long getOccupiedRooms() {
        return occupiedRooms;
    }

    public void setOccupiedRooms(long occupiedRooms) {
        this.occupiedRooms = occupiedRooms;
    }

    public long getBookedRooms() {
        return bookedRooms;
    }

    public void setBookedRooms(long bookedRooms) {
        this.bookedRooms = bookedRooms;
    }

    public long getAvailableRooms() {
        return availableRooms;
    }

    public void setAvailableRooms(long availableRooms) {
        this.availableRooms = availableRooms;
    }

    public long getCleaningRooms() {
        return cleaningRooms;
    }

    public void setCleaningRooms(long cleaningRooms) {
        this.cleaningRooms = cleaningRooms;
    }

    public long getOutOfOrderRooms() {
        return outOfOrderRooms;
    }

    public void setOutOfOrderRooms(long outOfOrderRooms) {
        this.outOfOrderRooms = outOfOrderRooms;
    }

    public double getOccupancyRatePercentage() {
        return occupancyRatePercentage;
    }

    public void setOccupancyRatePercentage(double occupancyRatePercentage) {
        this.occupancyRatePercentage = occupancyRatePercentage;
    }

    // Совместимость с фронтендом
    public double getOccupancyRate() {
        return occupancyRatePercentage;
    }

    public void setOccupancyRate(double occupancyRate) {
        this.occupancyRatePercentage = occupancyRate;
    }
}
