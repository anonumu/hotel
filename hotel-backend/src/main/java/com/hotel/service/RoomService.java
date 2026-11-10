package com.hotel.service;

import com.hotel.dto.RoomDto;
import com.hotel.exception.BusinessLogicException;
import com.hotel.exception.ResourceNotFoundException;
import com.hotel.exception.SecuritySanitizer;
import com.hotel.exception.StressTestOverflowException;
import com.hotel.model.Booking;
import com.hotel.model.BookingStatus;
import com.hotel.model.Guest;
import com.hotel.model.Payment;
import com.hotel.model.Room;
import com.hotel.model.RoomStatus;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.GuestRepository;
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
    private final GuestRepository guestRepository;

    public RoomService(RoomRepository roomRepository,
                       BookingRepository bookingRepository,
                       PaymentRepository paymentRepository,
                       GuestRepository guestRepository) {
        this.roomRepository = roomRepository;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.guestRepository = guestRepository;
    }

    @Transactional(readOnly = true)
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Room getRoomById(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Номер с id " + id + " не найден"));
    }

    private void validateRoomDto(RoomDto dto) {
        if (dto.getRoomNumber() == null || dto.getRoomNumber().trim().isEmpty()) {
            throw new BusinessLogicException("Номер комнаты обязателен для заполнения");
        }
        SecuritySanitizer.assertSafeText(dto.getRoomNumber(), "Номер комнаты");
        SecuritySanitizer.assertSafeText(dto.getDescription(), "Описание");

        if (dto.getPricePerNight() == null) {
            throw new BusinessLogicException("Стоимость за сутки обязательна");
        }
        if (dto.getPricePerNight().compareTo(BigDecimal.ZERO) < 0) {
            throw new StressTestOverflowException(
                    "Передана отрицательная стоимость номера (" + dto.getPricePerNight() + " ₽). Илья Валерьевич, перестаньте насиловать мой проект!",
                    "ERR_NEGATIVE_PRICE_OVERFLOW_418"
            );
        }
        if (dto.getPricePerNight().compareTo(BigDecimal.ZERO) == 0) {
            throw new BusinessLogicException("Стоимость за сутки должна быть больше нуля");
        }
        if (dto.getPricePerNight().compareTo(new BigDecimal("1000000")) > 0) {
            throw new StressTestOverflowException(
                    "Стоимость за сутки (" + dto.getPricePerNight() + " ₽) превышает максимально допустимый тариф гостиницы (макс: 1 000 000 ₽). Илья Валерьевич, перестаньте насиловать мой проект!",
                    "ERR_MAX_PRICE_OVERFLOW_418"
            );
        }
        if (dto.getMaxGuests() < 0 || dto.getMaxGuests() > 20) {
            throw new StressTestOverflowException(
                    "Вместимость номера (" + dto.getMaxGuests() + " чел.) выходит за строительные нормы отеля (допустимо: 1–20 чел.). Илья Валерьевич, перестаньте насиловать мой проект!",
                    "ERR_MAX_ROOM_CAPACITY_OVERFLOW_418"
            );
        }
        if (dto.getMaxGuests() == 0) {
            throw new BusinessLogicException("Вместимость номера должна быть не менее 1 человека");
        }
        if (dto.getFloor() < 1 || dto.getFloor() > 50) {
            throw new StressTestOverflowException(
                    "Этаж " + dto.getFloor() + " не существует в архитектуре гостиницы (допустимо: 1–50). Илья Валерьевич, перестаньте насиловать мой проект!",
                    "ERR_FLOOR_OUT_OF_RANGE_418"
            );
        }
    }

    public Room createRoom(RoomDto dto) {
        validateRoomDto(dto);
        String cleanNumber = dto.getRoomNumber().trim();
        if (roomRepository.existsByRoomNumber(cleanNumber)) {
            throw new BusinessLogicException("Номер комнаты " + cleanNumber + " уже существует");
        }

        Room room = new Room();
        room.setRoomNumber(cleanNumber);
        room.setType(dto.getType());
        room.setStatus(dto.getStatus() != null ? dto.getStatus() : RoomStatus.AVAILABLE);
        room.setFloor(dto.getFloor());
        room.setPricePerNight(dto.getPricePerNight());
        room.setMaxGuests(dto.getMaxGuests());
        room.setDescription(dto.getDescription() != null ? dto.getDescription().trim() : "");

        return roomRepository.save(room);
    }

    public Room updateRoom(Long id, RoomDto dto) {
        Room room = getRoomById(id);
        validateRoomDto(dto);
        String cleanNumber = dto.getRoomNumber().trim();
        if (!room.getRoomNumber().equals(cleanNumber) && roomRepository.existsByRoomNumber(cleanNumber)) {
            throw new BusinessLogicException("Номер комнаты " + cleanNumber + " уже занят");
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

    public Room updateStatus(Long id, RoomStatus status) {
        Room room = getRoomById(id);
        if (status != RoomStatus.OCCUPIED) {
            boolean hasCheckedIn = bookingRepository.findByRoomId(id).stream()
                    .anyMatch(b -> b.getStatus() == BookingStatus.CHECKED_IN);
            if (hasCheckedIn) {
                throw new BusinessLogicException(
                        "В номере № " + room.getRoomNumber() + " сейчас проживает гость. Сначала оформите выселение в службе приема."
                );
            }
        }
        room.setStatus(status);
        return roomRepository.save(room);
    }

    @Transactional
    public void deleteRoom(Long id) {
        Room room = getRoomById(id);
        List<Booking> bookings = bookingRepository.findByRoomId(id);
        boolean hasCheckedIn = bookings.stream().anyMatch(b -> b.getStatus() == BookingStatus.CHECKED_IN);
        if (room.getStatus() == RoomStatus.OCCUPIED || hasCheckedIn) {
            throw new BusinessLogicException("Нельзя удалить номер № " + room.getRoomNumber() +
                    ", так как в нём сейчас проживает гость. Сначала оформите выселение гостя в службе приема.");
        }

        if (!bookings.isEmpty()) {
            for (Booking b : bookings) {
                List<Payment> payments = paymentRepository.findByBookingId(b.getId());
                if (!payments.isEmpty()) {
                    paymentRepository.deleteAll(payments);
                }
                Guest g = b.getGuest();
                bookingRepository.delete(b);
                if (g != null && g.isCheckedIn()) {
                    boolean stillCheckedIn = bookingRepository.findByGuestId(g.getId()).stream()
                            .anyMatch(other -> other.getStatus() == BookingStatus.CHECKED_IN);
                    if (!stillCheckedIn) {
                        g.setCheckedIn(false);
                        guestRepository.save(g);
                    }
                }
            }
        }
        roomRepository.delete(room);
    }

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
