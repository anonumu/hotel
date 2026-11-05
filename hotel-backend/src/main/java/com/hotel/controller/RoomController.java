package com.hotel.controller;

import com.hotel.dto.RoomDto;
import com.hotel.dto.RoomStatusDto;
import com.hotel.model.Room;
import com.hotel.service.RoomService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    // Список всех номеров
    @GetMapping
    public ResponseEntity<List<Room>> getAllRooms() {
        return ResponseEntity.ok(roomService.getAllRooms());
    }

    // Получение конкретного номера
    @GetMapping("/{id}")
    public ResponseEntity<Room> getRoomById(@PathVariable Long id) {
        return ResponseEntity.ok(roomService.getRoomById(id));
    }

    // Создание нового номера
    @PostMapping
    public ResponseEntity<Room> createRoom(@Valid @RequestBody RoomDto dto) {
        Room created = roomService.createRoom(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Обновление номера
    @PutMapping("/{id}")
    public ResponseEntity<Room> updateRoom(@PathVariable Long id, @Valid @RequestBody RoomDto dto) {
        return ResponseEntity.ok(roomService.updateRoom(id, dto));
    }

    // Смена статуса номера
    @PatchMapping("/{id}/status")
    public ResponseEntity<Room> updateRoomStatus(@PathVariable Long id, @Valid @RequestBody RoomStatusDto statusDto) {
        return ResponseEntity.ok(roomService.updateStatus(id, statusDto.getStatus()));
    }

    // Удаление номера
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.noContent().build();
    }
}
