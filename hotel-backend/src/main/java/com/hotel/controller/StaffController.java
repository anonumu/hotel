package com.hotel.controller;

import com.hotel.dto.StaffDto;
import com.hotel.model.Staff;
import com.hotel.service.StaffService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/staff")
public class StaffController {

    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    // Список сотрудников
    @GetMapping
    public ResponseEntity<List<Staff>> getAllStaff() {
        return ResponseEntity.ok(staffService.getAllStaff());
    }

    // Информация о сотруднике
    @GetMapping("/{id}")
    public ResponseEntity<Staff> getStaffById(@PathVariable Long id) {
        return ResponseEntity.ok(staffService.getStaffById(id));
    }

    // Добавление сотрудника
    @PostMapping
    public ResponseEntity<Staff> addStaff(@Valid @RequestBody StaffDto dto) {
        Staff created = staffService.addStaff(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Обновление сотрудника
    @PutMapping("/{id}")
    public ResponseEntity<Staff> updateStaff(@PathVariable Long id, @Valid @RequestBody StaffDto dto) {
        return ResponseEntity.ok(staffService.updateStaff(id, dto));
    }

    // Удаление сотрудника
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStaff(@PathVariable Long id) {
        staffService.deleteStaff(id);
        return ResponseEntity.noContent().build();
    }

    // Расписание сотрудника
    @GetMapping("/{id}/schedule")
    public ResponseEntity<java.util.Map<String, Object>> getStaffSchedule(@PathVariable Long id) {
        return ResponseEntity.ok(staffService.getStaffSchedule(id));
    }
}
