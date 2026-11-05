package com.hotel.controller;

import com.hotel.dto.BookingRequestDto;
import com.hotel.dto.BookingStatusDto;
import com.hotel.model.Booking;
import com.hotel.model.Room;
import com.hotel.service.BookingService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // Список всех броней
    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    // Проверка доступности номеров на указанные даты
    @GetMapping("/availability")
    public ResponseEntity<List<Room>> checkAvailability(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut) {
        return ResponseEntity.ok(bookingService.checkAvailability(checkIn, checkOut));
    }

    // Получение конкретной брони
    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    // Создание брони
    @PostMapping
    public ResponseEntity<Booking> createBooking(@Valid @RequestBody BookingRequestDto dto) {
        Booking created = bookingService.createBooking(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Обновление брони
    @PutMapping("/{id}")
    public ResponseEntity<Booking> updateBooking(@PathVariable Long id, @Valid @RequestBody BookingRequestDto dto) {
        return ResponseEntity.ok(bookingService.updateBooking(id, dto));
    }

    // Смена статуса брони
    @PatchMapping("/{id}/status")
    public ResponseEntity<Booking> updateBookingStatus(@PathVariable Long id,
                                                       @Valid @RequestBody BookingStatusDto statusDto) {
        return ResponseEntity.ok(bookingService.updateStatus(id, statusDto.getStatus()));
    }

    // Отмена брони
    @DeleteMapping("/{id}")
    public ResponseEntity<Booking> cancelBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancelBooking(id));
    }
}
