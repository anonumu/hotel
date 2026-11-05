package com.hotel.repository;

import com.hotel.model.Booking;
import com.hotel.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByRoomId(Long roomId);

    List<Booking> findByGuestId(Long guestId);

    List<Booking> findByStatus(BookingStatus status);

    long countByStatus(BookingStatus status);

    // Активная бронь гостя для заселения/выселения
    Optional<Booking> findFirstByGuestIdAndStatusIn(Long guestId, List<BookingStatus> statuses);

    // Поиск пересекающихся активных бронирований для конкретного номера
    @Query("SELECT b FROM Booking b WHERE b.room.id = :roomId " +
           "AND b.status NOT IN (com.hotel.model.BookingStatus.CANCELLED, com.hotel.model.BookingStatus.CHECKED_OUT) " +
           "AND b.checkInDate < :checkOut " +
           "AND b.checkOutDate > :checkIn")
    List<Booking> findOverlappingBookings(@Param("roomId") Long roomId,
                                         @Param("checkIn") LocalDate checkIn,
                                         @Param("checkOut") LocalDate checkOut);

    // Поиск пересекающихся бронирований для номера с исключением текущей брони при обновлении
    @Query("SELECT b FROM Booking b WHERE b.room.id = :roomId " +
           "AND b.id != :excludeBookingId " +
           "AND b.status NOT IN (com.hotel.model.BookingStatus.CANCELLED, com.hotel.model.BookingStatus.CHECKED_OUT) " +
           "AND b.checkInDate < :checkOut " +
           "AND b.checkOutDate > :checkIn")
    List<Booking> findOverlappingBookingsExcludingId(@Param("roomId") Long roomId,
                                                    @Param("checkIn") LocalDate checkIn,
                                                    @Param("checkOut") LocalDate checkOut,
                                                    @Param("excludeBookingId") Long excludeBookingId);
}
