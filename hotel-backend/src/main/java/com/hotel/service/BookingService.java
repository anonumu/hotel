package com.hotel.service;

import com.hotel.dto.BookingRequestDto;
import com.hotel.exception.BusinessLogicException;
import com.hotel.exception.ResourceNotFoundException;
import com.hotel.model.*;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.GuestRepository;
import com.hotel.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Transactional
public class BookingService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final GuestRepository guestRepository;
    private final TariffService tariffService;

    public BookingService(BookingRepository bookingRepository,
                          RoomRepository roomRepository,
                          GuestRepository guestRepository,
                          TariffService tariffService) {
        this.bookingRepository = bookingRepository;
        this.roomRepository = roomRepository;
        this.guestRepository = guestRepository;
        this.tariffService = tariffService;
    }

    // Все бронирования
    @Transactional(readOnly = true)
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // Бронирование по id
    @Transactional(readOnly = true)
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Бронирование с id " + id + " не найдено"));
    }

    // Создание бронирования с полной валидацией и расчётом стоимости
    public Booking createBooking(BookingRequestDto dto) {
        validateDates(dto.getCheckInDate(), dto.getCheckOutDate());

        Room room = roomRepository.findById(dto.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Номер с id " + dto.getRoomId() + " не найден"));

        Guest guest = guestRepository.findById(dto.getGuestId())
                .orElseThrow(() -> new ResourceNotFoundException("Гость с id " + dto.getGuestId() + " не найден"));

        if (room.getStatus() == RoomStatus.OUT_OF_ORDER) {
            throw new BusinessLogicException("Номер " + room.getRoomNumber() + " находится на ремонте");
        }

        if (dto.getGuestCount() > room.getMaxGuests()) {
            throw new BusinessLogicException("Количество гостей (" + dto.getGuestCount() +
                    ") превышает вместимость номера (" + room.getMaxGuests() + ")");
        }

        // Проверка наложения дат
        List<Booking> overlaps = bookingRepository.findOverlappingBookings(
                room.getId(), dto.getCheckInDate(), dto.getCheckOutDate()
        );
        if (!overlaps.isEmpty()) {
            throw new BusinessLogicException("Номер " + room.getRoomNumber() + " уже занят на выбранные даты");
        }

        // Расчёт стоимости проживания
        BigDecimal totalPrice = calculateTotalPrice(room, dto.getCheckInDate(), dto.getCheckOutDate());

        BookingStatus initialStatus = dto.getStatus() != null ? dto.getStatus() : BookingStatus.CONFIRMED;

        Booking booking = new Booking();
        booking.setRoom(room);
        booking.setGuest(guest);
        booking.setCheckInDate(dto.getCheckInDate());
        booking.setCheckOutDate(dto.getCheckOutDate());
        booking.setStatus(initialStatus);
        booking.setTotalPrice(totalPrice);
        booking.setGuestCount(dto.getGuestCount());
        booking.setCreatedAt(LocalDateTime.now());

        // Если бронь подтверждена и номер свободен — переводим номер в BOOKED
        if (initialStatus == BookingStatus.CONFIRMED && room.getStatus() == RoomStatus.AVAILABLE) {
            room.setStatus(RoomStatus.BOOKED);
            roomRepository.save(room);
        }

        return bookingRepository.save(booking);
    }

    // Обновление бронирования
    public Booking updateBooking(Long id, BookingRequestDto dto) {
        Booking booking = getBookingById(id);
        validateDates(dto.getCheckInDate(), dto.getCheckOutDate());

        Room room = roomRepository.findById(dto.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Номер с id " + dto.getRoomId() + " не найден"));

        Guest guest = guestRepository.findById(dto.getGuestId())
                .orElseThrow(() -> new ResourceNotFoundException("Гость с id " + dto.getGuestId() + " не найден"));

        if (dto.getGuestCount() > room.getMaxGuests()) {
            throw new BusinessLogicException("Количество гостей (" + dto.getGuestCount() +
                    ") превышает вместимость номера (" + room.getMaxGuests() + ")");
        }

        // Проверка пересечений за исключением текущей брони
        List<Booking> overlaps = bookingRepository.findOverlappingBookingsExcludingId(
                room.getId(), dto.getCheckInDate(), dto.getCheckOutDate(), booking.getId()
        );
        if (!overlaps.isEmpty()) {
            throw new BusinessLogicException("Номер " + room.getRoomNumber() + " уже занят на эти даты другой бронью");
        }

        BigDecimal totalPrice = calculateTotalPrice(room, dto.getCheckInDate(), dto.getCheckOutDate());

        booking.setRoom(room);
        booking.setGuest(guest);
        booking.setCheckInDate(dto.getCheckInDate());
        booking.setCheckOutDate(dto.getCheckOutDate());
        booking.setGuestCount(dto.getGuestCount());
        booking.setTotalPrice(totalPrice);
        if (dto.getStatus() != null) {
            booking.setStatus(dto.getStatus());
        }

        return bookingRepository.save(booking);
    }

    // Смена статуса бронирования с синхронизацией статуса номера и гостя
    public Booking updateStatus(Long id, BookingStatus newStatus) {
        Booking booking = getBookingById(id);
        BookingStatus oldStatus = booking.getStatus();
        booking.setStatus(newStatus);

        Room room = booking.getRoom();
        Guest guest = booking.getGuest();

        if (newStatus == BookingStatus.CHECKED_IN) {
            room.setStatus(RoomStatus.OCCUPIED);
            guest.setCheckedIn(true);
            guest.setCheckInDate(LocalDate.now());
            roomRepository.save(room);
            guestRepository.save(guest);
        } else if (newStatus == BookingStatus.CHECKED_OUT) {
            room.setStatus(RoomStatus.CLEANING);
            guest.setCheckedIn(false);
            guest.setCheckOutDate(LocalDate.now());
            roomRepository.save(room);
            guestRepository.save(guest);
        } else if (newStatus == BookingStatus.CANCELLED) {
            if (room.getStatus() == RoomStatus.BOOKED) {
                room.setStatus(RoomStatus.AVAILABLE);
                roomRepository.save(room);
            }
        }

        return bookingRepository.save(booking);
    }

    // Отмена бронирования
    public Booking cancelBooking(Long id) {
        return updateStatus(id, BookingStatus.CANCELLED);
    }

    // Проверка доступности номеров
    @Transactional(readOnly = true)
    public List<Room> checkAvailability(LocalDate checkIn, LocalDate checkOut) {
        validateDates(checkIn, checkOut);
        return roomRepository.findAvailableRooms(checkIn, checkOut);
    }

    // Проверка корректности дат
    private void validateDates(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null || checkOut == null) {
            throw new BusinessLogicException("Даты заезда и выезда должны быть указаны");
        }
        if (!checkIn.isBefore(checkOut)) {
            throw new BusinessLogicException("Дата заезда должна быть раньше даты выезда");
        }
    }

    // Расчёт общей стоимости по дням
    private BigDecimal calculateTotalPrice(Room room, LocalDate checkIn, LocalDate checkOut) {
        long days = ChronoUnit.DAYS.between(checkIn, checkOut);
        BigDecimal total = BigDecimal.ZERO;
        for (int i = 0; i < days; i++) {
            LocalDate day = checkIn.plusDays(i);
            BigDecimal nightPrice = tariffService.getNightPrice(room, day);
            total = total.add(nightPrice);
        }
        return total;
    }
}
