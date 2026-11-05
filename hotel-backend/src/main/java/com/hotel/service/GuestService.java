package com.hotel.service;

import com.hotel.dto.GuestDto;
import com.hotel.exception.BusinessLogicException;
import com.hotel.exception.ResourceNotFoundException;
import com.hotel.model.Booking;
import com.hotel.model.BookingStatus;
import com.hotel.model.Guest;
import com.hotel.model.RoomStatus;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.GuestRepository;
import com.hotel.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
        guestRepository.findByPassportNumber(dto.getPassportNumber()).ifPresent(g -> {
            throw new BusinessLogicException("Гость с паспортом " + dto.getPassportNumber() + " уже зарегистрирован");
        });

        Guest guest = new Guest();
        guest.setFirstName(dto.getFirstName());
        guest.setLastName(dto.getLastName());
        guest.setEmail(dto.getEmail());
        guest.setPhone(dto.getPhone());
        guest.setPassportNumber(dto.getPassportNumber());
        guest.setNationality(dto.getNationality());
        guest.setCheckInDate(dto.getCheckInDate());
        guest.setCheckOutDate(dto.getCheckOutDate());
        guest.setCheckedIn(dto.isCheckedIn());

        return guestRepository.save(guest);
    }

    // Обновление данных гостя
    public Guest updateGuest(Long id, GuestDto dto) {
        Guest guest = getGuestById(id);

        if (!guest.getPassportNumber().equals(dto.getPassportNumber())) {
            guestRepository.findByPassportNumber(dto.getPassportNumber()).ifPresent(g -> {
                throw new BusinessLogicException("Номер паспорта " + dto.getPassportNumber() + " уже используется");
            });
        }

        guest.setFirstName(dto.getFirstName());
        guest.setLastName(dto.getLastName());
        guest.setEmail(dto.getEmail());
        guest.setPhone(dto.getPhone());
        guest.setPassportNumber(dto.getPassportNumber());
        guest.setNationality(dto.getNationality());
        if (dto.getCheckInDate() != null) {
            guest.setCheckInDate(dto.getCheckInDate());
        }
        if (dto.getCheckOutDate() != null) {
            guest.setCheckOutDate(dto.getCheckOutDate());
        }
        guest.setCheckedIn(dto.isCheckedIn());

        return guestRepository.save(guest);
    }

    // Заселение гостя
    public Guest checkInGuest(Long id) {
        Guest guest = getGuestById(id);
        if (guest.isCheckedIn()) {
            throw new BusinessLogicException("Гость " + guest.getFirstName() + " " + guest.getLastName() + " уже заселен");
        }

        guest.setCheckedIn(true);
        guest.setCheckInDate(LocalDate.now());

        // Обновляем статус активной брони и номера
        Optional<Booking> activeBooking = bookingRepository.findFirstByGuestIdAndStatusIn(
                id, Arrays.asList(BookingStatus.CONFIRMED, BookingStatus.PENDING)
        );

        if (activeBooking.isPresent()) {
            Booking booking = activeBooking.get();
            booking.setStatus(BookingStatus.CHECKED_IN);
            booking.getRoom().setStatus(RoomStatus.OCCUPIED);
            roomRepository.save(booking.getRoom());
            bookingRepository.save(booking);
        }

        return guestRepository.save(guest);
    }

    // Выселение гостя
    public Guest checkOutGuest(Long id) {
        Guest guest = getGuestById(id);
        if (!guest.isCheckedIn()) {
            throw new BusinessLogicException("Гость " + guest.getFirstName() + " " + guest.getLastName() + " не заселен");
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
