package com.hotel.controller;

import com.hotel.dto.GuestsReportDto;
import com.hotel.dto.OccupancyReportDto;
import com.hotel.dto.RevenueReportDto;
import com.hotel.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // Отчет по загруженности номеров
    @GetMapping("/occupancy")
    public ResponseEntity<OccupancyReportDto> getOccupancyReport() {
        return ResponseEntity.ok(reportService.getOccupancyReport());
    }

    // Отчет по выручке
    @GetMapping("/revenue")
    public ResponseEntity<RevenueReportDto> getRevenueReport() {
        return ResponseEntity.ok(reportService.getRevenueReport());
    }

    // Отчет по гостям
    @GetMapping("/guests")
    public ResponseEntity<GuestsReportDto> getGuestsReport() {
        return ResponseEntity.ok(reportService.getGuestsReport());
    }

    // Отчет по эффективности персонала
    @GetMapping("/staff-performance")
    public ResponseEntity<com.hotel.dto.StaffPerformanceDto> getStaffPerformanceReport() {
        return ResponseEntity.ok(reportService.getStaffPerformanceReport());
    }
}
