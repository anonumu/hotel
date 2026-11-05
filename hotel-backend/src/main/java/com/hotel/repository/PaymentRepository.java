package com.hotel.repository;

import com.hotel.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByBookingId(Long bookingId);

    // Общая сумма всех платежей
    @Query("SELECT SUM(p.amount) FROM Payment p")
    BigDecimal sumTotalAmount();

    // Суммы платежей сгруппированные по способу оплаты
    @Query("SELECT p.method, SUM(p.amount) FROM Payment p GROUP BY p.method")
    List<Object[]> sumAmountGroupedByMethod();
}
