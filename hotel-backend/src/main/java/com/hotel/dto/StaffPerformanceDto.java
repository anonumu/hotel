package com.hotel.dto;

import java.util.List;

// DTO для отчета об эффективности персонала
public class StaffPerformanceDto {

    private long totalStaff;
    private long activeStaff;
    private double averageRating;
    private List<StaffMemberStat> staffStats;

    public StaffPerformanceDto() {
    }

    public StaffPerformanceDto(long totalStaff, long activeStaff, double averageRating, List<StaffMemberStat> staffStats) {
        this.totalStaff = totalStaff;
        this.activeStaff = activeStaff;
        this.averageRating = averageRating;
        this.staffStats = staffStats;
    }

    public long getTotalStaff() {
        return totalStaff;
    }

    public void setTotalStaff(long totalStaff) {
        this.totalStaff = totalStaff;
    }

    public long getActiveStaff() {
        return activeStaff;
    }

    public void setActiveStaff(long activeStaff) {
        this.activeStaff = activeStaff;
    }

    public double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(double averageRating) {
        this.averageRating = averageRating;
    }

    public List<StaffMemberStat> getStaffStats() {
        return staffStats;
    }

    public void setStaffStats(List<StaffMemberStat> staffStats) {
        this.staffStats = staffStats;
    }

    public static class StaffMemberStat {
        private Long id;
        private String name;
        private String position;
        private int tasksCompleted;
        private double rating;
        private String shift;
        private boolean active;

        public StaffMemberStat() {
        }

        public StaffMemberStat(Long id, String name, String position, int tasksCompleted, double rating, String shift, boolean active) {
            this.id = id;
            this.name = name;
            this.position = position;
            this.tasksCompleted = tasksCompleted;
            this.rating = rating;
            this.shift = shift;
            this.active = active;
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

        public String getPosition() {
            return position;
        }

        public void setPosition(String position) {
            this.position = position;
        }

        public int getTasksCompleted() {
            return tasksCompleted;
        }

        public void setTasksCompleted(int tasksCompleted) {
            this.tasksCompleted = tasksCompleted;
        }

        public double getRating() {
            return rating;
        }

        public void setRating(double rating) {
            this.rating = rating;
        }

        public String getShift() {
            return shift;
        }

        public void setShift(String shift) {
            this.shift = shift;
        }

        public boolean isActive() {
            return active;
        }

        public void setActive(boolean active) {
            this.active = active;
        }
    }
}

