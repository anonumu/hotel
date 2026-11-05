package com.hotel.dto;

import java.math.BigDecimal;
import java.util.Map;

public class RevenueReportDto {

    private BigDecimal totalRevenue;
    private long totalPaymentsCount;
    private Map<String, BigDecimal> revenueByPaymentMethod;

    public RevenueReportDto() {
    }

    public RevenueReportDto(BigDecimal totalRevenue, long totalPaymentsCount,
                            Map<String, BigDecimal> revenueByPaymentMethod) {
        this.totalRevenue = totalRevenue;
        this.totalPaymentsCount = totalPaymentsCount;
        this.revenueByPaymentMethod = revenueByPaymentMethod;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public long getTotalPaymentsCount() {
        return totalPaymentsCount;
    }

    public void setTotalPaymentsCount(long totalPaymentsCount) {
        this.totalPaymentsCount = totalPaymentsCount;
    }

    public Map<String, BigDecimal> getRevenueByPaymentMethod() {
        return revenueByPaymentMethod;
    }

    public void setRevenueByPaymentMethod(Map<String, BigDecimal> revenueByPaymentMethod) {
        this.revenueByPaymentMethod = revenueByPaymentMethod;
    }

    // Совместимость с фронтендом
    public long getTotalTransactions() {
        return totalPaymentsCount;
    }

    public void setTotalTransactions(long totalTransactions) {
        this.totalPaymentsCount = totalTransactions;
    }

    public Map<String, BigDecimal> getRevenueByMethod() {
        return revenueByPaymentMethod;
    }

    public void setRevenueByMethod(Map<String, BigDecimal> revenueByMethod) {
        this.revenueByPaymentMethod = revenueByMethod;
    }
}
