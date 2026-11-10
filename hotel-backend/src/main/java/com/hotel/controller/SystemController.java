package com.hotel.controller;

import com.hotel.model.*;
import com.hotel.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/system")
public class SystemController {

    private final RoomRepository roomRepository;
    private final GuestRepository guestRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final StaffRepository staffRepository;
    private final TariffRepository tariffRepository;

    public SystemController(RoomRepository roomRepository,
                            GuestRepository guestRepository,
                            BookingRepository bookingRepository,
                            PaymentRepository paymentRepository,
                            StaffRepository staffRepository,
                            TariffRepository tariffRepository) {
        this.roomRepository = roomRepository;
        this.guestRepository = guestRepository;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.staffRepository = staffRepository;
        this.tariffRepository = tariffRepository;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> info = new HashMap<>();
        info.put("status", "UP");
        info.put("roomsCount", roomRepository.count());
        info.put("bookingsCount", bookingRepository.count());
        info.put("guestsCount", guestRepository.count());
        info.put("paymentsCount", paymentRepository.count());
        return ResponseEntity.ok(info);
    }

    /**
     * Полное восстановление эталонных тестовых данных в БД (защита от случайного удаления всех записей).
     */
    @PostMapping("/reset-demo")
    @Transactional
    public ResponseEntity<Map<String, Object>> resetDemoData() {
        paymentRepository.deleteAllInBatch();
        bookingRepository.deleteAllInBatch();
        roomRepository.deleteAllInBatch();
        guestRepository.deleteAllInBatch();
        staffRepository.deleteAllInBatch();
        tariffRepository.deleteAllInBatch();

        Room r101 = roomRepository.save(new Room("101", RoomType.STANDARD, RoomStatus.AVAILABLE, 1, new BigDecimal("3500.00"), 2, "Уютный стандартный номер с большой двуспальной кроватью и видом во внутренний дворик"));
        roomRepository.save(new Room("102", RoomType.STANDARD, RoomStatus.AVAILABLE, 1, new BigDecimal("3500.00"), 2, "Стандартный номер с двумя раздельными кроватями"));
        Room r201 = roomRepository.save(new Room("201", RoomType.SUPERIOR, RoomStatus.OCCUPIED, 2, new BigDecimal("5000.00"), 2, "Улучшенный номер с просторным балконом и рабочей зоной"));
        Room r202 = roomRepository.save(new Room("202", RoomType.SUPERIOR, RoomStatus.BOOKED, 2, new BigDecimal("5200.00"), 3, "Семейный улучшенный номер с дополнительным спальным местом"));
        roomRepository.save(new Room("301", RoomType.DELUXE, RoomStatus.CLEANING, 3, new BigDecimal("7500.00"), 3, "Делюкс с панорамными окнами, ванной и мини-баром"));
        roomRepository.save(new Room("302", RoomType.SUITE, RoomStatus.AVAILABLE, 3, new BigDecimal("11000.00"), 4, "Двухкомнатный представительский люкс с отдельной гостиной"));
        roomRepository.save(new Room("401", RoomType.PRESIDENTIAL, RoomStatus.OUT_OF_ORDER, 4, new BigDecimal("25000.00"), 4, "Президентский пентхаус с террасой (плановый технический ремонт)"));

        Guest g1 = guestRepository.save(new Guest("Иван", "Смирнов", "ivan.smirnov@mail.ru", "+7 (916) 111-22-33", "4510 123456", "Россия", LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 8), true));
        Guest g2 = guestRepository.save(new Guest("Анна", "Кузнецова", "a.kuznetsova@gmail.com", "+7 (926) 333-44-55", "4512 654321", "Россия", LocalDate.of(2026, 11, 10), LocalDate.of(2026, 11, 15), false));
        Guest g3 = guestRepository.save(new Guest("John", "Miller", "j.miller@yahoo.com", "+1 (555) 789-01-23", "US89341209", "США", LocalDate.of(2026, 10, 20), LocalDate.of(2026, 10, 25), false));
        guestRepository.save(new Guest("Елена", "Попова", "elena.popova@yandex.ru", "+7 (903) 777-88-99", "4515 987654", "Россия", null, null, false));

        staffRepository.saveAll(Arrays.asList(
                new Staff("Михаил", "Орлов", StaffPosition.MANAGER, "m.orlov@hotel.com", "+7 (900) 100-01-01", LocalDate.of(2023, 1, 15), true),
                new Staff("Екатерина", "Волкова", StaffPosition.RECEPTIONIST, "e.volkova@hotel.com", "+7 (900) 100-01-02", LocalDate.of(2023, 6, 1), true),
                new Staff("Ольга", "Соколова", StaffPosition.MAID, "o.sokolova@hotel.com", "+7 (900) 100-01-03", LocalDate.of(2023, 9, 10), true),
                new Staff("Дмитрий", "Морозов", StaffPosition.ACCOUNTANT, "d.morozov@hotel.com", "+7 (900) 100-01-04", LocalDate.of(2022, 11, 1), true),
                new Staff("Сергей", "Васильев", StaffPosition.ADMIN, "admin@hotel.com", "+7 (900) 100-01-05", LocalDate.of(2022, 1, 10), true)
        ));

        tariffRepository.saveAll(Arrays.asList(
                new Tariff("Стандарт Базовый", RoomType.STANDARD, new BigDecimal("3500.00"), null, null, true),
                new Tariff("Улучшенный Осенний", RoomType.SUPERIOR, new BigDecimal("5000.00"), LocalDate.of(2026, 9, 1), LocalDate.of(2026, 11, 30), true),
                new Tariff("Делюкс Круглогодичный", RoomType.DELUXE, new BigDecimal("7500.00"), null, null, true),
                new Tariff("Люкс Новогодний", RoomType.SUITE, new BigDecimal("14000.00"), LocalDate.of(2026, 12, 25), LocalDate.of(2027, 1, 10), true)
        ));

        Booking b1 = bookingRepository.save(new Booking(r201, g1, LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 8), BookingStatus.CHECKED_IN, new BigDecimal("35000.00"), 2, LocalDateTime.of(2026, 10, 25, 12, 0)));
        Booking b2 = bookingRepository.save(new Booking(r202, g2, LocalDate.of(2026, 11, 10), LocalDate.of(2026, 11, 15), BookingStatus.CONFIRMED, new BigDecimal("26000.00"), 2, LocalDateTime.of(2026, 11, 2, 15, 30)));
        Booking b3 = bookingRepository.save(new Booking(r101, g3, LocalDate.of(2026, 10, 20), LocalDate.of(2026, 10, 25), BookingStatus.CHECKED_OUT, new BigDecimal("17500.00"), 1, LocalDateTime.of(2026, 10, 15, 9, 15)));

        paymentRepository.saveAll(Arrays.asList(
                new Payment(b1, new BigDecimal("35000.00"), PaymentMethod.CARD, LocalDateTime.of(2026, 11, 1, 14, 10), "Полная предоплата картой при заезде"),
                new Payment(b2, new BigDecimal("10000.00"), PaymentMethod.TRANSFER, LocalDateTime.of(2026, 11, 2, 16, 0), "Предоплата 10 000 руб. банковским переводом"),
                new Payment(b3, new BigDecimal("17500.00"), PaymentMethod.CASH, LocalDateTime.of(2026, 10, 25, 11, 30), "Оплата наличными при выезде")
        ));

        Map<String, Object> res = new HashMap<>();
        res.put("status", "OK");
        res.put("message", "Стартовые данные комплекса Grand Impérial успешно восстановлены");
        res.put("roomsCount", roomRepository.count());
        res.put("bookingsCount", bookingRepository.count());
        return ResponseEntity.ok(res);
    }
}

