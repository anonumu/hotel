package com.hotel.repository;

import com.hotel.model.Room;
import com.hotel.model.RoomStatus;
import com.hotel.model.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    Optional<Room> findByRoomNumber(String roomNumber);

    boolean existsByRoomNumber(String roomNumber);

    List<Room> findByStatus(RoomStatus status);

    List<Room> findByType(RoomType type);

    long countByStatus(RoomStatus status);

    // Поиск номеров, свободных в указанный диапазон дат и не находящихся на ремонте
    @Query("SELECT r FROM Room r WHERE r.status != com.hotel.model.RoomStatus.OUT_OF_ORDER " +
           "AND r.id NOT IN (" +
           "   SELECT b.room.id FROM Booking b " +
           "   WHERE b.status NOT IN (com.hotel.model.BookingStatus.CANCELLED, com.hotel.model.BookingStatus.CHECKED_OUT) " +
           "   AND b.checkInDate < :checkOut " +
           "   AND b.checkOutDate > :checkIn" +
           ")")
    List<Room> findAvailableRooms(@Param("checkIn") LocalDate checkIn, @Param("checkOut") LocalDate checkOut);
}
