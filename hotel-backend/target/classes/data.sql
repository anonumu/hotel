-- Тестовые данные для отеля

-- 1. Номера
INSERT INTO rooms (room_number, type, status, floor, price_per_night, max_guests, description) VALUES
('101', 'STANDARD', 'AVAILABLE', 1, 3500.00, 2, 'Уютный стандартный номер с большой двуспальной кроватью и видом во внутренний дворик'),
('102', 'STANDARD', 'AVAILABLE', 1, 3500.00, 2, 'Стандартный номер с двумя раздельными кроватями'),
('201', 'SUPERIOR', 'OCCUPIED', 2, 5000.00, 2, 'Улучшенный номер с просторным балконом и рабочей зоной'),
('202', 'SUPERIOR', 'BOOKED', 2, 5200.00, 3, 'Семейный улучшенный номер с дополнительным спальным местом'),
('301', 'DELUXE', 'CLEANING', 3, 7500.00, 3, 'Делюкс с панорамными окнами, ванной и мини-баром'),
('302', 'SUITE', 'AVAILABLE', 3, 11000.00, 4, 'Двухкомнатный представительский люкс с отдельной гостиной'),
('401', 'PRESIDENTIAL', 'OUT_OF_ORDER', 4, 25000.00, 4, 'Президентский пентхаус с террасой (плановый технический ремонт)');

-- 2. Гости
INSERT INTO guests (first_name, last_name, email, phone, passport_number, nationality, check_in_date, check_out_date, is_checked_in) VALUES
('Иван', 'Смирнов', 'ivan.smirnov@mail.ru', '+7 (916) 111-22-33', '4510 123456', 'Россия', '2026-11-01', '2026-11-08', true),
('Анна', 'Кузнецова', 'a.kuznetsova@gmail.com', '+7 (926) 333-44-55', '4512 654321', 'Россия', '2026-11-10', '2026-11-15', false),
('John', 'Miller', 'j.miller@yahoo.com', '+1 (555) 789-01-23', 'US89341209', 'США', '2026-10-20', '2026-10-25', false),
('Елена', 'Попова', 'elena.popova@yandex.ru', '+7 (903) 777-88-99', '4515 987654', 'Россия', NULL, NULL, false);

-- 3. Сотрудники
INSERT INTO staff (first_name, last_name, position, email, phone, hire_date, is_active) VALUES
('Михаил', 'Орлов', 'MANAGER', 'm.orlov@hotel.com', '+7 (900) 100-01-01', '2023-01-15', true),
('Екатерина', 'Волкова', 'RECEPTIONIST', 'e.volkova@hotel.com', '+7 (900) 100-01-02', '2023-06-01', true),
('Ольга', 'Соколова', 'MAID', 'o.sokolova@hotel.com', '+7 (900) 100-01-03', '2023-09-10', true),
('Дмитрий', 'Морозов', 'ACCOUNTANT', 'd.morozov@hotel.com', '+7 (900) 100-01-04', '2022-11-01', true),
('Сергей', 'Васильев', 'ADMIN', 'admin@hotel.com', '+7 (900) 100-01-05', '2022-01-10', true);

-- 4. Тарифы
INSERT INTO tariffs (name, room_type, price_per_night, season_start, season_end, is_active) VALUES
('Стандарт Базовый', 'STANDARD', 3500.00, NULL, NULL, true),
('Улучшенный Осенний', 'SUPERIOR', 5000.00, '2026-09-01', '2026-11-30', true),
('Делюкс Круглогодичный', 'DELUXE', 7500.00, NULL, NULL, true),
('Люкс Новогодний', 'SUITE', 14000.00, '2026-12-25', '2027-01-10', true);

-- 5. Бронирования
INSERT INTO bookings (room_id, guest_id, check_in_date, check_out_date, status, total_price, guest_count, created_at) VALUES
(3, 1, '2026-11-01', '2026-11-08', 'CHECKED_IN', 35000.00, 2, '2026-10-25 12:00:00'),
(4, 2, '2026-11-10', '2026-11-15', 'CONFIRMED', 26000.00, 2, '2026-11-02 15:30:00'),
(1, 3, '2026-10-20', '2026-10-25', 'CHECKED_OUT', 17500.00, 1, '2026-10-15 09:15:00');

-- 6. Платежи
INSERT INTO payments (booking_id, amount, method, paid_at, description) VALUES
(1, 35000.00, 'CARD', '2026-11-01 14:10:00', 'Полная предоплата картой при заезде'),
(2, 10000.00, 'TRANSFER', '2026-11-02 16:00:00', 'Предоплата 10 000 руб. банковским переводом'),
(3, 17500.00, 'CASH', '2026-10-25 11:30:00', 'Оплата наличными при выезде');
