package com.hotel;

import com.hotel.dto.RoomDto;
import com.hotel.exception.BusinessLogicException;
import com.hotel.model.Room;
import com.hotel.model.RoomStatus;
import com.hotel.model.RoomType;
import com.hotel.service.RoomService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@DisplayName("Тестирование управления номерным фондом и смены статусов")
class RoomServiceTest {

    @Autowired
    private RoomService roomService;

    @Test
    @DisplayName("Базовый номерной фонд содержит 7 номеров")
    void testGetAllRooms() {
        List<Room> rooms = roomService.getAllRooms();
        assertNotNull(rooms);
        assertTrue(rooms.size() >= 7, "Ожидается как минимум 7 номеров");
    }

    @Test
    @DisplayName("Успешное создание, обновление статуса и удаление нового номера")
    void testCreateUpdateAndDeleteRoom() {
        RoomDto dto = new RoomDto();
        dto.setRoomNumber("999");
        dto.setType(RoomType.DELUXE);
        dto.setFloor(4);
        dto.setMaxGuests(2);
        dto.setPricePerNight(new BigDecimal("7500.00"));
        dto.setStatus(RoomStatus.AVAILABLE);
        dto.setDescription("Тестовый номер люкс на 4 этаже");

        Room created = roomService.createRoom(dto);
        assertNotNull(created.getId());
        assertEquals("999", created.getRoomNumber());
        assertEquals(4, created.getFloor());

        // Смена статуса
        Room updated = roomService.updateStatus(created.getId(), RoomStatus.CLEANING);
        assertEquals(RoomStatus.CLEANING, updated.getStatus());

        // Удаление
        assertDoesNotThrow(() -> roomService.deleteRoom(created.getId()));
    }

    @Test
    @DisplayName("Попытка удалить занятый номер (с активной бронью) вызывает защитное исключение")
    void testDeleteOccupiedRoomThrowsBusinessLogicException() {
        // Номер 201 занят активным гостем
        List<Room> rooms = roomService.getAllRooms();
        Room occupied = rooms.stream()
                .filter(r -> r.getStatus() == RoomStatus.OCCUPIED)
                .findFirst()
                .orElse(null);

        if (occupied != null) {
            assertThrows(BusinessLogicException.class, () -> roomService.deleteRoom(occupied.getId()));
        }
    }
}
