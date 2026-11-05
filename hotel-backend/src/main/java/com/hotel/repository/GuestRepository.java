package com.hotel.repository;

import com.hotel.model.Guest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GuestRepository extends JpaRepository<Guest, Long> {

    @Query("SELECT g FROM Guest g WHERE g.isCheckedIn = :checkedIn")
    List<Guest> findByIsCheckedIn(@Param("checkedIn") boolean checkedIn);

    @Query("SELECT count(g) FROM Guest g WHERE g.isCheckedIn = :checkedIn")
    long countByIsCheckedIn(@Param("checkedIn") boolean checkedIn);

    Optional<Guest> findByPassportNumber(String passportNumber);

    Optional<Guest> findByEmail(String email);

    List<Guest> findByLastNameContainingIgnoreCase(String lastName);
}
