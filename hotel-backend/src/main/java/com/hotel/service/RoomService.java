package com.hotel.service;

import com.hotel.dto.RoomDto;
import com.hotel.exception.BusinessLogicException;
import com.hotel.exception.ResourceNotFoundException;
import com.hotel.model.Booking;
import com.hotel.model.BookingStatus;
import com.hotel.model.Payment;
import com.hotel.model.Room;
import com.hotel.model.RoomStatus;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.PaymentRepository;
import com.hotel.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class RoomService {

    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;

    public RoomService(RoomRepository roomRepository, BookingRepository bookingRepository, PaymentRepository paymentRepository) {
        this.roomRepository = roomRepository;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
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
        if (dto.getRoomNumber() == null || dto.getRoomNumber().trim().isEmpty()) {
            throw new BusinessLogicException("Номер комнаты обязателен для заполнения");
        }
        if (roomRepository.existsByRoomNumber(dto.getRoomNumber().trim())) {
            throw new BusinessLogicException("Номер комнаты " + dto.getRoomNumber() + " уже существует");
        }
        if (dto.getPricePerNight() == null || dto.getPricePerNight().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessLogicException("Стоимость за сутки должна быть больше нуля");
        }
        if (dto.getPricePerNight().compareTo(new BigDecimal("1000000")) > 0) {
            throw new com.hotel.exception.StressTestOverflowException(
                    "Стоимость за сутки (" + dto.getPricePerNight() + " ₽) превышает максимально допустимый тариф гостиницы (макс: 1 000 000 ₽). Илья Валерьевич, перестаньте насиловать мой проект!",
                    "ERR_MAX_PRICE_OVERFLOW_418"
            );
        }
        if (dto.getMaxGuests() <= 0) {
            throw new BusinessLogicException("Вместимость номера должна быть не менее 1 человека");
        }
        if (dto.getMaxGuests() > 20) {
            throw new com.hotel.exception.StressTestOverflowException(
                    "Вместимость номера (" + dto.getMaxGuests() + " чел.) превышает строительные нормы отеля (макс: 20 чел.). Илья Валерьевич, перестаньте насиловать мой проект!",
                    "ERR_MAX_ROOM_CAPACITY_OVERFLOW_418"
            );
        }
        if (dto.getFloor() <= 0) {
            throw new BusinessLogicException("Этаж должен быть положительным числом");
        }

        Room room = new Room();
        room.setRoomNumber(dto.getRoomNumber().trim());
        room.setType(dto.getType());
        room.setStatus(dto.getStatus() != null ? dto.getStatus() : RoomStatus.AVAILABLE);
        room.setFloor(dto.getFloor());
        room.setPricePerNight(dto.getPricePerNight());
        room.setMaxGuests(dto.getMaxGuests());
        room.setDescription(dto.getDescription() != null ? dto.getDescription().trim() : "");

        return roomRepository.save(room);
    }

    // Обновление информации о номере
    public Room updateRoom(Long id, RoomDto dto) {
        Room room = getRoomById(id);

        if (dto.getRoomNumber() == null || dto.getRoomNumber().trim().isEmpty()) {
            throw new BusinessLogicException("Номер комнаты обязателен для заполнения");
        }
        String cleanNumber = dto.getRoomNumber().trim();
        if (!room.getRoomNumber().equals(cleanNumber) && roomRepository.existsByRoomNumber(cleanNumber)) {
            throw new BusinessLogicException("Номер комнаты " + cleanNumber + " уже занят");
        }
        if (dto.getPricePerNight() == null || dto.getPricePerNight().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessLogicException("Стоимость за сутки должна быть больше нуля");
        }
        if (dto.getPricePerNight().compareTo(new BigDecimal("1000000")) > 0) {
            throw new com.hotel.exception.StressTestOverflowException(
                    "Стоимость за сутки (" + dto.getPricePerNight() + " ₽) превышает максимально допустимый тариф гостиницы (макс: 1 000 000 ₽). Илья Валерьевич, перестаньте насиловать мой проект!",
                    "ERR_MAX_PRICE_OVERFLOW_418"
            );
        }
        if (dto.getMaxGuests() <= 0) {
            throw new BusinessLogicException("Вместимость номера должна быть не менее 1 человека");
        }
        if (dto.getMaxGuests() > 20) {
            throw new com.hotel.exception.StressTestOverflowException(
                    "Вместимость номера (" + dto.getMaxGuests() + " чел.) превышает строительные нормы отеля (макс: 20 чел.). Илья Валерьевич, перестаньте насиловать мой проект!",
                    "ERR_MAX_ROOM_CAPACITY_OVERFLOW_418"
            );
        }

        room.setRoomNumber(cleanNumber);
        room.setType(dto.getType());
        if (dto.getStatus() != null) {
            room.setStatus(dto.getStatus());
        }
        room.setFloor(dto.getFloor());
        room.setPricePerNight(dto.getPricePerNight());
        room.setMaxGuests(dto.getMaxGuests());
        room.setDescription(dto.getDescription() != null ? dto.getDescription().trim() : "");

        return roomRepository.save(room);
    }

    // Смена статуса номера
    public Room updateStatus(Long id, RoomStatus status) {
        Room room = getRoomById(id);
        room.setStatus(status);
        return roomRepository.save(room);
    }

    // Удаление номера с безопасной проверкой связей
    public void deleteRoom(Long id) {
        Room room = getRoomById(id);
        List<Booking> bookings = bookingRepository.findByRoomId(id);
        if (!bookings.isEmpty()) {
            long activeCount = bookings.stream()
                    .filter(b -> b.getStatus() != BookingStatus.CANCELLED && b.getStatus() != BookingStatus.CHECKED_OUT)
                    .count();
            if (activeCount > 0) {
                throw new BusinessLogicException("Нельзя удалить номер № " + room.getRoomNumber() + 
                        ", так как в нём сейчас проживают гости или оформлена активная бронь (" + activeCount + " шт.). Сначала выселите гостя или отмените бронь.");
            }
            // Если все бронирования по номеру уже завершены (CHECKED_OUT) или отменены (CANCELLED),
            // удаляем архивные бронирования и их платежи, чтобы номер можно было удалить
            for (Booking b : bookings) {
                List<Payment> payments = paymentRepository.findByBookingId(b.getId());
                if (!payments.isEmpty()) {
                    paymentRepository.deleteAll(payments);
                }
                bookingRepository.delete(b);
            }
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
