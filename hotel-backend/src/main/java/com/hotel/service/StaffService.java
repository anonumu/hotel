package com.hotel.service;

import com.hotel.dto.StaffDto;
import com.hotel.exception.BusinessLogicException;
import com.hotel.exception.ResourceNotFoundException;
import com.hotel.model.Staff;
import com.hotel.repository.StaffRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class StaffService {

    private final StaffRepository staffRepository;

    public StaffService(StaffRepository staffRepository) {
        this.staffRepository = staffRepository;
    }

    // Все сотрудники
    @Transactional(readOnly = true)
    public List<Staff> getAllStaff() {
        return staffRepository.findAll();
    }

    // Информация о сотруднике
    @Transactional(readOnly = true)
    public Staff getStaffById(Long id) {
        return staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Сотрудник с id " + id + " не найден"));
    }

    // Добавление сотрудника
    public Staff addStaff(StaffDto dto) {
        staffRepository.findByEmail(dto.getEmail()).ifPresent(s -> {
            throw new BusinessLogicException("Сотрудник с email " + dto.getEmail() + " уже существует");
        });

        Staff staff = new Staff();
        staff.setFirstName(dto.getFirstName());
        staff.setLastName(dto.getLastName());
        staff.setPosition(dto.getPosition());
        staff.setEmail(dto.getEmail());
        staff.setPhone(dto.getPhone());
        staff.setHireDate(dto.getHireDate());
        staff.setActive(dto.isActive());

        return staffRepository.save(staff);
    }

    // Обновление данных сотрудника
    public Staff updateStaff(Long id, StaffDto dto) {
        Staff staff = getStaffById(id);

        if (!staff.getEmail().equals(dto.getEmail())) {
            staffRepository.findByEmail(dto.getEmail()).ifPresent(s -> {
                throw new BusinessLogicException("Email " + dto.getEmail() + " уже занят другим сотрудником");
            });
        }

        staff.setFirstName(dto.getFirstName());
        staff.setLastName(dto.getLastName());
        staff.setPosition(dto.getPosition());
        staff.setEmail(dto.getEmail());
        staff.setPhone(dto.getPhone());
        staff.setHireDate(dto.getHireDate());
        staff.setActive(dto.isActive());

        return staffRepository.save(staff);
    }

    // Удаление сотрудника
    public void deleteStaff(Long id) {
        Staff staff = getStaffById(id);
        staffRepository.delete(staff);
    }

    // Расписание сотрудника
    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getStaffSchedule(Long id) {
        Staff staff = getStaffById(id);
        java.util.Map<String, Object> schedule = new java.util.HashMap<>();
        schedule.put("staffId", staff.getId());
        schedule.put("fullName", staff.getFirstName() + " " + staff.getLastName());
        schedule.put("position", staff.getPosition());
        schedule.put("shiftHours", "08:00 - 20:00");
        schedule.put("workSchedule", "2 через 2");
        schedule.put("assignedFloor", staff.getPosition().name().equals("MAID") ? "Этажи 1-3" : "Главный холл / Ресепшн");
        schedule.put("status", staff.isActive() ? "На смене" : "Выходной");
        return schedule;
    }
}
