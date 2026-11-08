package com.hotel.controller;

import com.hotel.dto.GuestDto;
import com.hotel.model.Guest;
import com.hotel.service.GuestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/guests")
public class GuestController {

    private final GuestService guestService;

    public GuestController(GuestService guestService) {
        this.guestService = guestService;
    }

    // Список всех гостей
    @GetMapping
    public ResponseEntity<List<Guest>> getAllGuests() {
        return ResponseEntity.ok(guestService.getAllGuests());
    }

    // Профиль гостя
    @GetMapping("/{id}")
    public ResponseEntity<Guest> getGuestById(@PathVariable Long id) {
        return ResponseEntity.ok(guestService.getGuestById(id));
    }

    // Регистрация гостя
    @PostMapping
    public ResponseEntity<Guest> registerGuest(@Valid @RequestBody GuestDto dto) {
        Guest created = guestService.registerGuest(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Обновление данных гостя
    @PutMapping("/{id}")
    public ResponseEntity<Guest> updateGuest(@PathVariable Long id, @Valid @RequestBody GuestDto dto) {
        return ResponseEntity.ok(guestService.updateGuest(id, dto));
    }

    // Заселение гостя (с опциональным указанием номера)
    @PostMapping("/{id}/checkin")
    public ResponseEntity<Guest> checkInGuest(
            @PathVariable Long id,
            @RequestParam(required = false) Long roomId) {
        return ResponseEntity.ok(guestService.checkInGuest(id, roomId));
    }

    // Выселение гостя
    @PostMapping("/{id}/checkout")
    public ResponseEntity<Guest> checkOutGuest(@PathVariable Long id) {
        return ResponseEntity.ok(guestService.checkOutGuest(id));
    }
}
