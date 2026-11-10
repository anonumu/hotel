package com.hotel.service;

import com.hotel.dto.BookingRequestDto;
import com.hotel.exception.BusinessLogicException;
import com.hotel.exception.ResourceNotFoundException;
import com.hotel.exception.StressTestOverflowException;
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

    @Transactional(readOnly = true)
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Бронирование с id " + id + " не найдено"));
    }

    public Booking createBooking(BookingRequestDto dto) {
        if (dto.getGuestCount() > 10 || dto.getGuestCount() < 1) {
            throw new StressTestOverflowException(
                    "Количество гостей (" + dto.getGuestCount() + ") выходит за допустимые пределы отеля (допустимо: 1–10 чел.). Илья Валерьевич, перестаньте насиловать мой проект!",
                    "ERR_MAX_CLIENTS_OVERFLOW_418"
            );
        }

        validateDates(dto.getCheckInDate(), dto.getCheckOutDate());

        Room room = roomRepository.findById(dto.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Номер с id " + dto.getRoomId() + " не найден"));

        Guest guest = guestRepository.findById(dto.getGuestId())
                .orElseThrow(() -> new ResourceNotFoundException("Гость с id " + dto.getGuestId() + " не найден"));

        if (room.getStatus() == RoomStatus.OUT_OF_ORDER) {
            throw new BusinessLogicException("Номер " + room.getRoomNumber() + " находится на ремонте");
        }
        if (!dto.getCheckInDate().isAfter(LocalDate.now()) && room.getStatus() == RoomStatus.CLEANING) {
            throw new BusinessLogicException("Номер " + room.getRoomNumber() + " сейчас находится на уборке");
        }
        if (!dto.getCheckInDate().isAfter(LocalDate.now()) && room.getStatus() == RoomStatus.OCCUPIED) {
            throw new BusinessLogicException("Номер " + room.getRoomNumber() + " сейчас занят другим постояльцем");
        }

        if (dto.getGuestCount() > room.getMaxGuests()) {
            throw new BusinessLogicException("Количество гостей (" + dto.getGuestCount() +
                    ") превышает вместимость номера № " + room.getRoomNumber() + " (" + room.getMaxGuests() + " чел.)");
        }

        List<Booking> overlaps = bookingRepository.findOverlappingBookings(
                room.getId(), dto.getCheckInDate(), dto.getCheckOutDate()
        );
        if (!overlaps.isEmpty()) {
            throw new BusinessLogicException("Номер " + room.getRoomNumber() + " уже занят на выбранные даты");
        }

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

        if (initialStatus == BookingStatus.CONFIRMED && room.getStatus() == RoomStatus.AVAILABLE) {
            room.setStatus(RoomStatus.BOOKED);
            roomRepository.save(room);
        }

        return bookingRepository.save(booking);
    }

    public Booking updateBooking(Long id, BookingRequestDto dto) {
        Booking booking = getBookingById(id);
        if (dto.getGuestCount() > 10 || dto.getGuestCount() < 1) {
            throw new StressTestOverflowException(
                    "Количество гостей (" + dto.getGuestCount() + ") выходит за допустимые пределы (1–10 чел.). Илья Валерьевич, перестаньте насиловать мой проект!",
                    "ERR_MAX_CLIENTS_OVERFLOW_418"
            );
        }
        validateDates(dto.getCheckInDate(), dto.getCheckOutDate());

        Room room = roomRepository.findById(dto.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Номер с id " + dto.getRoomId() + " не найден"));

        Guest guest = guestRepository.findById(dto.getGuestId())
                .orElseThrow(() -> new ResourceNotFoundException("Гость с id " + dto.getGuestId() + " не найден"));

        if (dto.getGuestCount() > room.getMaxGuests()) {
            throw new BusinessLogicException("Количество гостей (" + dto.getGuestCount() +
                    ") превышает вместимость номера (" + room.getMaxGuests() + ")");
        }

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
            if (oldStatus == BookingStatus.CHECKED_IN) {
                guest.setCheckedIn(false);
                guestRepository.save(guest);
                room.setStatus(RoomStatus.CLEANING);
                roomRepository.save(room);
            } else if (room.getStatus() == RoomStatus.BOOKED) {
                boolean otherActiveBooked = bookingRepository.findByRoomId(room.getId()).stream()
                        .anyMatch(other -> !other.getId().equals(id) &&
                                (other.getStatus() == BookingStatus.CONFIRMED || other.getStatus() == BookingStatus.PENDING));
                if (!otherActiveBooked) {
                    room.setStatus(RoomStatus.AVAILABLE);
                    roomRepository.save(room);
                }
            }
        }

        return bookingRepository.save(booking);
    }

    public Booking cancelBooking(Long id) {
        return updateStatus(id, BookingStatus.CANCELLED);
    }

    @Transactional(readOnly = true)
    public List<Room> checkAvailability(LocalDate checkIn, LocalDate checkOut) {
        validateDates(checkIn, checkOut);
        return roomRepository.findAvailableRooms(checkIn, checkOut);
    }

    private void validateDates(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null || checkOut == null) {
            throw new BusinessLogicException("Даты заезда и выезда должны быть указаны");
        }
        if (!checkIn.isBefore(checkOut)) {
            throw new BusinessLogicException("Дата заезда должна быть раньше даты выезда");
        }
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        if (nights > 365) {
            throw new StressTestOverflowException(
                    "Попытка забронировать номер на " + nights + " ночей (предел системы: 365 ночей). Илья Валерьевич, перестаньте насиловать мой проект!",
                    "ERR_BOOKING_DURATION_OVERFLOW_418"
            );
        }
    }

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
