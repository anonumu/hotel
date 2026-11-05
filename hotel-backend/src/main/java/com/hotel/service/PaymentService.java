package com.hotel.service;

import com.hotel.dto.PaymentRequestDto;
import com.hotel.exception.BusinessLogicException;
import com.hotel.exception.ResourceNotFoundException;
import com.hotel.model.Booking;
import com.hotel.model.BookingStatus;
import com.hotel.model.Payment;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    public PaymentService(PaymentRepository paymentRepository, BookingRepository bookingRepository) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
    }

    // Список всех платежей
    @Transactional(readOnly = true)
    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    // Регистрация нового платежа
    public Payment createPayment(PaymentRequestDto dto) {
        if (dto.getAmount() == null || dto.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessLogicException("Сумма платежа должна быть строго больше нуля");
        }

        Booking booking = bookingRepository.findById(dto.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Бронирование с id " + dto.getBookingId() + " не найдено"));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BusinessLogicException("Нельзя принять оплату по отмененному бронированию");
        }

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(dto.getAmount());
        payment.setMethod(dto.getMethod());
        payment.setPaidAt(LocalDateTime.now());
        payment.setDescription(dto.getDescription());

        Payment savedPayment = paymentRepository.save(payment);

        // Если бронь была PENDING, подтверждаем ее при поступлении оплаты
        if (booking.getStatus() == BookingStatus.PENDING) {
            booking.setStatus(BookingStatus.CONFIRMED);
            bookingRepository.save(booking);
        }

        return savedPayment;
    }
}
