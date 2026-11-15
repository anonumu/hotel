package com.hotel;

import com.hotel.model.Staff;
import com.hotel.service.StaffService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@DisplayName("Тестирование управления персоналом и статуса присутствия")
class StaffServiceTest {

    @Autowired
    private StaffService staffService;

    @Test
    @DisplayName("Получение списка сотрудников возвращает сидированные записи")
    void testGetAllStaff() {
        List<Staff> staffList = staffService.getAllStaff();
        assertNotNull(staffList);
        assertTrue(staffList.size() >= 5, "Ожидается как минимум 5 сидированных сотрудников");
    }

    @Test
    @DisplayName("Переключение статуса присутствия ('На работе / Не на работе') сохраняется")
    void testToggleStaffActiveStatus() {
        List<Staff> staffList = staffService.getAllStaff();
        Staff staff = staffList.get(0);
        boolean initialStatus = staff.isActive();

        // Меняем статус
        Staff updated = staffService.updateStaffActiveStatus(staff.getId(), !initialStatus);
        assertEquals(!initialStatus, updated.isActive());

        // Возвращаем исходный
        Staff restored = staffService.updateStaffActiveStatus(staff.getId(), initialStatus);
        assertEquals(initialStatus, restored.isActive());
    }

    @Test
    @DisplayName("Получение расписания возвращает корректную смену и статус")
    void testGetStaffSchedule() {
        List<Staff> staffList = staffService.getAllStaff();
        Staff staff = staffList.get(0);
        var schedule = staffService.getStaffSchedule(staff.getId());

        assertNotNull(schedule);
        assertEquals(staff.getId(), schedule.get("staffId"));
        assertTrue(schedule.containsKey("shiftHours"));
        assertTrue(schedule.containsKey("assignedFloor"));
    }
}
