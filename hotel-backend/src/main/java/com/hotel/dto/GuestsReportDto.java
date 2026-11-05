package com.hotel.dto;

import java.util.Map;

public class GuestsReportDto {

    private long totalGuests;
    private long currentlyCheckedIn;
    private long totalBookings;
    private Map<String, Long> guestsByNationality;

    public GuestsReportDto() {
    }

    public GuestsReportDto(long totalGuests, long currentlyCheckedIn,
                           long totalBookings, Map<String, Long> guestsByNationality) {
        this.totalGuests = totalGuests;
        this.currentlyCheckedIn = currentlyCheckedIn;
        this.totalBookings = totalBookings;
        this.guestsByNationality = guestsByNationality;
    }

    public long getTotalGuests() {
        return totalGuests;
    }

    public void setTotalGuests(long totalGuests) {
        this.totalGuests = totalGuests;
    }

    public long getCurrentlyCheckedIn() {
        return currentlyCheckedIn;
    }

    public void setCurrentlyCheckedIn(long currentlyCheckedIn) {
        this.currentlyCheckedIn = currentlyCheckedIn;
    }

    public long getTotalBookings() {
        return totalBookings;
    }

    public void setTotalBookings(long totalBookings) {
        this.totalBookings = totalBookings;
    }

    public Map<String, Long> getGuestsByNationality() {
        return guestsByNationality;
    }

    public void setGuestsByNationality(Map<String, Long> guestsByNationality) {
        this.guestsByNationality = guestsByNationality;
    }
}
