package com.hotel.controller;

import com.hotel.dto.InvoiceDto;
import com.hotel.exception.ResourceNotFoundException;
import com.hotel.model.Booking;
import com.hotel.model.Payment;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.PaymentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;

    public InvoiceController(BookingRepository bookingRepository, PaymentRepository paymentRepository) {
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
    }

    // Получить счет гостя по id брони
    @GetMapping("/{id}")
    public ResponseEntity<InvoiceDto> getInvoice(@PathVariable Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Бронирование с id " + id + " не найдено"));

        List<Payment> payments = paymentRepository.findByBookingId(id);
        BigDecimal paidTotal = BigDecimal.ZERO;
        for (Payment p : payments) {
            paidTotal = paidTotal.add(p.getAmount());
        }

        long nights = ChronoUnit.DAYS.between(booking.getCheckInDate(), booking.getCheckOutDate());
        if (nights <= 0) {
            nights = 1;
        }

        BigDecimal balanceDue = booking.getTotalPrice().subtract(paidTotal);
        String paymentStatus = balanceDue.compareTo(BigDecimal.ZERO) <= 0 ? "ОПЛАЧЕНО" : "К ОПЛАТЕ";

        InvoiceDto invoice = new InvoiceDto();
        invoice.setInvoiceNumber("INV-" + String.format("%06d", booking.getId()));
        invoice.setIssueDate(LocalDate.now());
        invoice.setBookingId(booking.getId());
        invoice.setGuestFullName(booking.getGuest().getFirstName() + " " + booking.getGuest().getLastName());
        invoice.setGuestPassport(booking.getGuest().getPassportNumber());
        invoice.setGuestPhone(booking.getGuest().getPhone());
        invoice.setRoomNumber(booking.getRoom().getRoomNumber());
        invoice.setRoomType(booking.getRoom().getType().name());
        invoice.setCheckInDate(booking.getCheckInDate());
        invoice.setCheckOutDate(booking.getCheckOutDate());
        invoice.setNumberOfNights(nights);
        invoice.setPricePerNight(booking.getRoom().getPricePerNight());
        invoice.setRoomTotal(booking.getTotalPrice());
        invoice.setTotalAmount(booking.getTotalPrice());
        invoice.setPaidAmount(paidTotal);
        invoice.setBalanceDue(balanceDue.max(BigDecimal.ZERO));
        invoice.setPaymentStatus(paymentStatus);

        return ResponseEntity.ok(invoice);
    }
}

