package com.hotel.repository;

import com.hotel.model.RoomType;
import com.hotel.model.Tariff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TariffRepository extends JpaRepository<Tariff, Long> {

    @Query("SELECT t FROM Tariff t WHERE t.isActive = :active")
    List<Tariff> findByIsActive(@Param("active") boolean active);

    @Query("SELECT t FROM Tariff t WHERE t.roomType = :roomType AND t.isActive = :active")
    List<Tariff> findByRoomTypeAndIsActive(@Param("roomType") RoomType roomType, @Param("active") boolean active);

    // Поиск активного тарифа по категории номера и дате
    @Query("SELECT t FROM Tariff t WHERE t.roomType = :roomType AND t.isActive = true " +
           "AND (t.seasonStart IS NULL OR t.seasonStart <= :date) " +
           "AND (t.seasonEnd IS NULL OR t.seasonEnd >= :date)")
    List<Tariff> findMatchingTariffs(@Param("roomType") RoomType roomType, @Param("date") LocalDate date);
}
