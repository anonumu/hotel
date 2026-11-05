package com.hotel.service;

import com.hotel.dto.RoomDto;
import com.hotel.exception.BusinessLogicException;
import com.hotel.exception.ResourceNotFoundException;
import com.hotel.model.Room;
import com.hotel.model.RoomStatus;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class RoomService {

    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;

    public RoomService(RoomRepository roomRepository, BookingRepository bookingRepository) {
        this.roomRepository = roomRepository;
        this.bookingRepository = bookingRepository;
    }

    // Получение всех номеров
    @Transactional(readOnly = true)
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    // Получение номера по id
    @Transactional(readOnly = true)
    public Room getRoomById(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Номер с id " + id + " не найден"));
    }

    // Создание нового номера
    public Room createRoom(RoomDto dto) {
        if (roomRepository.existsByRoomNumber(dto.getRoomNumber())) {
            throw new BusinessLogicException("Номер комнаты " + dto.getRoomNumber() + " уже существует");
        }

        Room room = new Room();
        room.setRoomNumber(dto.getRoomNumber());
        room.setType(dto.getType());
        room.setStatus(dto.getStatus() != null ? dto.getStatus() : RoomStatus.AVAILABLE);
        room.setFloor(dto.getFloor());
        room.setPricePerNight(dto.getPricePerNight());
        room.setMaxGuests(dto.getMaxGuests());
        room.setDescription(dto.getDescription());

        return roomRepository.save(room);
    }

    // Обновление информации о номере
    public Room updateRoom(Long id, RoomDto dto) {
        Room room = getRoomById(id);

        if (!room.getRoomNumber().equals(dto.getRoomNumber()) &&
                roomRepository.existsByRoomNumber(dto.getRoomNumber())) {
            throw new BusinessLogicException("Номер комнаты " + dto.getRoomNumber() + " уже занят");
        }

        room.setRoomNumber(dto.getRoomNumber());
        room.setType(dto.getType());
        if (dto.getStatus() != null) {
            room.setStatus(dto.getStatus());
        }
        room.setFloor(dto.getFloor());
        room.setPricePerNight(dto.getPricePerNight());
        room.setMaxGuests(dto.getMaxGuests());
        room.setDescription(dto.getDescription());

        return roomRepository.save(room);
    }

    // Смена статуса номера
    public Room updateStatus(Long id, RoomStatus status) {
        Room room = getRoomById(id);
        room.setStatus(status);
        return roomRepository.save(room);
    }

    // Удаление номера
    public void deleteRoom(Long id) {
        Room room = getRoomById(id);
        com.hotel.model.Booking active = bookingRepository.findByRoomId(id).stream()
                .filter(b -> b.getStatus() != com.hotel.model.BookingStatus.CANCELLED)
                .findFirst().orElse(null);
        if (active != null) {
            throw new BusinessLogicException("Нельзя удалить номер № " + room.getRoomNumber() + 
                    ", так как к нему привязано бронирование #" + active.getId());
        }
        roomRepository.delete(room);
    }

    // Поиск свободных номеров на даты
    @Transactional(readOnly = true)
    public List<Room> findAvailableRooms(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null || checkOut == null) {
            throw new BusinessLogicException("Даты заезда и выезда обязательны для проверки");
        }
        if (!checkIn.isBefore(checkOut)) {
            throw new BusinessLogicException("Дата заезда должна быть строго раньше даты выезда");
        }
        return roomRepository.findAvailableRooms(checkIn, checkOut);
    }
}
