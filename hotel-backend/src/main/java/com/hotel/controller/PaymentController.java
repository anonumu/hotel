package com.hotel.controller;

import com.hotel.dto.PaymentRequestDto;
import com.hotel.model.Payment;
import com.hotel.service.PaymentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // Список всех платежей
    @GetMapping
    public ResponseEntity<List<Payment>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    // Регистрация платежа
    @PostMapping
    public ResponseEntity<Payment> createPayment(@Valid @RequestBody PaymentRequestDto dto) {
        Payment created = paymentService.createPayment(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
