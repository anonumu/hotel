package com.hotel.controller;

import com.hotel.dto.TariffDto;
import com.hotel.model.Tariff;
import com.hotel.service.TariffService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/tariffs")
public class TariffController {

    private final TariffService tariffService;

    public TariffController(TariffService tariffService) {
        this.tariffService = tariffService;
    }

    // Список тарифов
    @GetMapping
    public ResponseEntity<List<Tariff>> getAllTariffs() {
        return ResponseEntity.ok(tariffService.getAllTariffs());
    }

    // Создание тарифа
    @PostMapping
    public ResponseEntity<Tariff> createTariff(@Valid @RequestBody TariffDto dto) {
        Tariff created = tariffService.createTariff(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Обновление тарифа
    @PutMapping("/{id}")
    public ResponseEntity<Tariff> updateTariff(@PathVariable Long id, @Valid @RequestBody TariffDto dto) {
        return ResponseEntity.ok(tariffService.updateTariff(id, dto));
    }
}
