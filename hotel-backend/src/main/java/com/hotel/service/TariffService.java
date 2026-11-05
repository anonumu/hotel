package com.hotel.service;

import com.hotel.dto.TariffDto;
import com.hotel.exception.ResourceNotFoundException;
import com.hotel.model.Room;
import com.hotel.model.Tariff;
import com.hotel.repository.TariffRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class TariffService {

    private final TariffRepository tariffRepository;

    public TariffService(TariffRepository tariffRepository) {
        this.tariffRepository = tariffRepository;
    }

    // Все тарифы
    @Transactional(readOnly = true)
    public List<Tariff> getAllTariffs() {
        return tariffRepository.findAll();
    }

    // Тариф по id
    @Transactional(readOnly = true)
    public Tariff getTariffById(Long id) {
        return tariffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Тариф с id " + id + " не найден"));
    }

    // Создание тарифа
    public Tariff createTariff(TariffDto dto) {
        Tariff tariff = new Tariff();
        tariff.setName(dto.getName());
        tariff.setRoomType(dto.getRoomType());
        tariff.setPricePerNight(dto.getPricePerNight());
        tariff.setSeasonStart(dto.getSeasonStart());
        tariff.setSeasonEnd(dto.getSeasonEnd());
        tariff.setActive(dto.isActive());
        return tariffRepository.save(tariff);
    }

    // Обновление тарифа
    public Tariff updateTariff(Long id, TariffDto dto) {
        Tariff tariff = getTariffById(id);
        tariff.setName(dto.getName());
        tariff.setRoomType(dto.getRoomType());
        tariff.setPricePerNight(dto.getPricePerNight());
        tariff.setSeasonStart(dto.getSeasonStart());
        tariff.setSeasonEnd(dto.getSeasonEnd());
        tariff.setActive(dto.isActive());
        return tariffRepository.save(tariff);
    }

    // Определение стоимости суток с учётом сезонного тарифа или базовой цены номера
    @Transactional(readOnly = true)
    public BigDecimal getNightPrice(Room room, LocalDate date) {
        List<Tariff> matching = tariffRepository.findMatchingTariffs(room.getType(), date);
        if (!matching.isEmpty()) {
            return matching.get(0).getPricePerNight();
        }
        return room.getPricePerNight();
    }
}
