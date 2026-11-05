package com.hotel.repository;

import com.hotel.model.Staff;
import com.hotel.model.StaffPosition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {

    @Query("SELECT s FROM Staff s WHERE s.isActive = :active")
    List<Staff> findByIsActive(@Param("active") boolean active);

    List<Staff> findByPosition(StaffPosition position);

    Optional<Staff> findByEmail(String email);
}
