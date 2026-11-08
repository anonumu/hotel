package com.hotel.service;

import com.hotel.dto.GuestDto;
import com.hotel.exception.BusinessLogicException;
import com.hotel.exception.ResourceNotFoundException;
import com.hotel.model.Booking;
import com.hotel.model.BookingStatus;
import com.hotel.model.Guest;
import com.hotel.model.Room;
import com.hotel.model.RoomStatus;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.GuestRepository;
import com.hotel.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class GuestService {

    private final GuestRepository guestRepository;
    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;

    public GuestService(GuestRepository guestRepository,
                        BookingRepository bookingRepository,
                        RoomRepository roomRepository) {
        this.guestRepository = guestRepository;
        this.bookingRepository = bookingRepository;
        this.roomRepository = roomRepository;
    }

    // Список всех гостей
    @Transactional(readOnly = true)
    public List<Guest> getAllGuests() {
        return guestRepository.findAll();
    }

    // Профиль гостя по id
    @Transactional(readOnly = true)
    public Guest getGuestById(Long id) {
        return guestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Гость с id " + id + " не найден"));
    }

    // Регистрация нового гостя
    public Guest registerGuest(GuestDto dto) {
        if (dto.getPassportNumber() == null || dto.getPassportNumber().trim().isEmpty()) {
            throw new BusinessLogicException("Паспортные данные обязательны для регистрации");
        }
        String passport = dto.getPassportNumber().trim();
        guestRepository.findByPassportNumber(passport).ifPresent(g -> {
            throw new BusinessLogicException("Гость с паспортом " + passport + " уже зарегистрирован в базе");
        });

        Guest guest = new Guest();
        guest.setFirstName(dto.getFirstName() != null ? dto.getFirstName().trim() : "");
        guest.setLastName(dto.getLastName() != null ? dto.getLastName().trim() : "");
        guest.setEmail(dto.getEmail() != null ? dto.getEmail().trim() : "");
        guest.setPhone(dto.getPhone() != null ? dto.getPhone().trim() : "");
        guest.setPassportNumber(passport);
        guest.setNationality(dto.getNationality() != null ? dto.getNationality().trim() : "Россия");
        guest.setCheckInDate(dto.getCheckInDate());
        guest.setCheckOutDate(dto.getCheckOutDate());
        guest.setCheckedIn(dto.isCheckedIn());

        return guestRepository.save(guest);
    }

    // Обновление данных гостя
    public Guest updateGuest(Long id, GuestDto dto) {
        Guest guest = getGuestById(id);

        if (dto.getPassportNumber() == null || dto.getPassportNumber().trim().isEmpty()) {
            throw new BusinessLogicException("Паспортные данные обязательны для заполнения");
        }
        String cleanPassport = dto.getPassportNumber().trim();
        if (!guest.getPassportNumber().equalsIgnoreCase(cleanPassport)) {
            guestRepository.findByPassportNumber(cleanPassport).ifPresent(g -> {
                throw new BusinessLogicException("Номер паспорта " + cleanPassport + " уже используется другим гостем");
            });
        }

        guest.setFirstName(dto.getFirstName() != null ? dto.getFirstName().trim() : "");
        guest.setLastName(dto.getLastName() != null ? dto.getLastName().trim() : "");
        guest.setEmail(dto.getEmail() != null ? dto.getEmail().trim() : "");
        guest.setPhone(dto.getPhone() != null ? dto.getPhone().trim() : "");
        guest.setPassportNumber(cleanPassport);
        guest.setNationality(dto.getNationality() != null ? dto.getNationality().trim() : "Россия");
        if (dto.getCheckInDate() != null) {
            guest.setCheckInDate(dto.getCheckInDate());
        }
        if (dto.getCheckOutDate() != null) {
            guest.setCheckOutDate(dto.getCheckOutDate());
        }
        guest.setCheckedIn(dto.isCheckedIn());

        return guestRepository.save(guest);
    }

    // Заселение гостя (с автоматической или явной привязкой к номеру)
    public Guest checkInGuest(Long id) {
        return checkInGuest(id, null);
    }

    public Guest checkInGuest(Long id, Long roomId) {
        Guest guest = getGuestById(id);
        if (guest.isCheckedIn()) {
            throw new BusinessLogicException("Гость " + guest.getFirstName() + " " + guest.getLastName() + " уже заселен в номер");
        }

        LocalDate today = LocalDate.now();

        if (roomId != null) {
            Room room = roomRepository.findById(roomId)
                    .orElseThrow(() -> new ResourceNotFoundException("Номер с id " + roomId + " не найден"));

            if (room.getStatus() == RoomStatus.OCCUPIED) {
                throw new BusinessLogicException("Номер " + room.getRoomNumber() + " уже занят другим гостем");
            }
            if (room.getStatus() == RoomStatus.CLEANING) {
                throw new BusinessLogicException("Номер " + room.getRoomNumber() + " находится на уборке. Дождитесь подтверждения готовности номера.");
            }
            if (room.getStatus() == RoomStatus.OUT_OF_ORDER) {
                throw new BusinessLogicException("Номер " + room.getRoomNumber() + " выведен из эксплуатации (ремонт)");
            }

            // Ищем подходящую активную бронь этого гостя
            Optional<Booking> activeBooking = bookingRepository.findFirstByGuestIdAndStatusIn(
                    id, Arrays.asList(BookingStatus.CONFIRMED, BookingStatus.PENDING)
            );

            if (activeBooking.isPresent()) {
                Booking booking = activeBooking.get();
                booking.setRoom(room);
                booking.setStatus(BookingStatus.CHECKED_IN);
                room.setStatus(RoomStatus.OCCUPIED);
                roomRepository.save(room);
                bookingRepository.save(booking);
                guest.setCheckInDate(booking.getCheckInDate() != null ? booking.getCheckInDate() : today);
                guest.setCheckOutDate(booking.getCheckOutDate() != null ? booking.getCheckOutDate() : today.plusDays(3));
            } else {
                // Создаем прямое оперативное бронирование на 3 суток
                Booking booking = new Booking();
                booking.setRoom(room);
                booking.setGuest(guest);
                booking.setCheckInDate(today);
                booking.setCheckOutDate(today.plusDays(3));
                booking.setStatus(BookingStatus.CHECKED_IN);
                booking.setGuestCount(Math.min(2, room.getMaxGuests()));
                booking.setTotalPrice(room.getPricePerNight().multiply(BigDecimal.valueOf(3)));
                booking.setCreatedAt(LocalDateTime.now());

                room.setStatus(RoomStatus.OCCUPIED);
                roomRepository.save(room);
                bookingRepository.save(booking);

                guest.setCheckInDate(today);
                guest.setCheckOutDate(today.plusDays(3));
            }

            guest.setCheckedIn(true);
            return guestRepository.save(guest);
        }

        // Если roomId не передан, проверяем существующую подтвержденную бронь
        Optional<Booking> activeBooking = bookingRepository.findFirstByGuestIdAndStatusIn(
                id, Arrays.asList(BookingStatus.CONFIRMED, BookingStatus.PENDING)
        );

        if (activeBooking.isPresent()) {
            Booking booking = activeBooking.get();
            Room room = booking.getRoom();
            if (room.getStatus() == RoomStatus.OUT_OF_ORDER) {
                throw new BusinessLogicException("Забронированный номер " + room.getRoomNumber() + " находится на ремонте");
            }
            booking.setStatus(BookingStatus.CHECKED_IN);
            room.setStatus(RoomStatus.OCCUPIED);
            roomRepository.save(room);
            bookingRepository.save(booking);

            guest.setCheckedIn(true);
            guest.setCheckInDate(booking.getCheckInDate() != null ? booking.getCheckInDate() : today);
            guest.setCheckOutDate(booking.getCheckOutDate() != null ? booking.getCheckOutDate() : today.plusDays(3));
            return guestRepository.save(guest);
        } else {
            throw new BusinessLogicException("У гостя " + guest.getFirstName() + " " + guest.getLastName() +
                    " нет активного бронирования. Выберите свободный номер для заселения.");
        }
    }

    // Выселение гостя
    public Guest checkOutGuest(Long id) {
        Guest guest = getGuestById(id);
        if (!guest.isCheckedIn()) {
            throw new BusinessLogicException("Гость " + guest.getFirstName() + " " + guest.getLastName() + " не заселен в отель");
        }

        guest.setCheckedIn(false);
        guest.setCheckOutDate(LocalDate.now());

        // Переводим бронь в CHECKED_OUT, а номер на уборку
        Optional<Booking> activeBooking = bookingRepository.findFirstByGuestIdAndStatusIn(
                id, Arrays.asList(BookingStatus.CHECKED_IN)
        );

        if (activeBooking.isPresent()) {
            Booking booking = activeBooking.get();
            booking.setStatus(BookingStatus.CHECKED_OUT);
            booking.getRoom().setStatus(RoomStatus.CLEANING);
            roomRepository.save(booking.getRoom());
            bookingRepository.save(booking);
        }

        return guestRepository.save(guest);
    }
}
