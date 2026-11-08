// ==========================================================================
// ИС «Гостиница» — Клиентская логика и управление интерфейсом
// Студент: Сигналов Владислав Алексеевич (Группа 3 ИС-3)
// Преподаватель: Самсонов Илья Валерьевич
//
// Интеграция: REST API Spring Boot (порт 8080) с автономным отказоустойчивым ядром
// ==========================================================================

const API_BASE = 'http://localhost:8080/api/v1';

// Состояние подключения к бэкенду
let isApiOnline = false;

// Локальное реактивное хранилище для автономной работы и демо-режима
const store = {
  rooms: [
    { id: 1, roomNumber: '101', type: 'STANDARD', status: 'AVAILABLE', floor: 1, pricePerNight: 3500.00, maxGuests: 2, description: 'Уютный стандартный номер с двуспальной кроватью' },
    { id: 2, roomNumber: '102', type: 'STANDARD', status: 'AVAILABLE', floor: 1, pricePerNight: 3500.00, maxGuests: 2, description: 'Стандартный номер с двумя раздельными кроватями' },
    { id: 3, roomNumber: '201', type: 'SUPERIOR', status: 'OCCUPIED', floor: 2, pricePerNight: 5000.00, maxGuests: 2, description: 'Улучшенный номер с балконом' },
    { id: 4, roomNumber: '202', type: 'SUPERIOR', status: 'BOOKED', floor: 2, pricePerNight: 5200.00, maxGuests: 3, description: 'Семейный номер с дополнительным спальным местом' },
    { id: 5, roomNumber: '301', type: 'DELUXE', status: 'CLEANING', floor: 3, pricePerNight: 7500.00, maxGuests: 3, description: 'Делюкс с панорамными окнами и ванной' },
    { id: 6, roomNumber: '302', type: 'SUITE', status: 'AVAILABLE', floor: 3, pricePerNight: 11000.00, maxGuests: 4, description: 'Двухкомнатный представительский люкс' },
    { id: 7, roomNumber: '401', type: 'PRESIDENTIAL', status: 'OUT_OF_ORDER', floor: 4, pricePerNight: 25000.00, maxGuests: 4, description: 'Президентский номер (плановый ремонт)' }
  ],
  guests: [
    { id: 1, firstName: 'Иван', lastName: 'Смирнов', email: 'ivan.smirnov@mail.ru', phone: '+7 (916) 111-22-33', passportNumber: '4510 123456', nationality: 'Россия', checkInDate: '2026-11-01', checkOutDate: '2026-11-08', checkedIn: true },
    { id: 2, firstName: 'Анна', lastName: 'Кузнецова', email: 'a.kuznetsova@gmail.com', phone: '+7 (926) 333-44-55', passportNumber: '4512 654321', nationality: 'Россия', checkInDate: '2026-11-10', checkOutDate: '2026-11-15', checkedIn: false },
    { id: 3, firstName: 'Джон', lastName: 'Миллер', email: 'j.miller@yahoo.com', phone: '+1 (555) 789-01-23', passportNumber: 'US89341209', nationality: 'США', checkInDate: '2026-10-20', checkOutDate: '2026-10-25', checkedIn: false },
    { id: 4, firstName: 'Елена', lastName: 'Попова', email: 'elena.popova@yandex.ru', phone: '+7 (903) 777-88-99', passportNumber: '4515 987654', nationality: 'Россия', checkInDate: null, checkOutDate: null, checkedIn: false }
  ],
  bookings: [
    { id: 1, roomId: 3, guestId: 1, checkInDate: '2026-11-01', checkOutDate: '2026-11-08', status: 'CHECKED_IN', totalPrice: 35000.00, guestCount: 2, createdAt: '2026-10-25T12:00:00' },
    { id: 2, roomId: 4, guestId: 2, checkInDate: '2026-11-10', checkOutDate: '2026-11-15', status: 'CONFIRMED', totalPrice: 26000.00, guestCount: 2, createdAt: '2026-11-02T15:30:00' },
    { id: 3, roomId: 1, guestId: 3, checkInDate: '2026-10-20', checkOutDate: '2026-10-25', status: 'CHECKED_OUT', totalPrice: 17500.00, guestCount: 1, createdAt: '2026-10-15T09:15:00' }
  ],
  staff: [
    { id: 1, firstName: 'Михаил', lastName: 'Орлов', position: 'MANAGER', email: 'm.orlov@hotel.ru', phone: '+7 (900) 100-01-01', hireDate: '2023-01-15', active: true },
    { id: 2, firstName: 'Екатерина', lastName: 'Волкова', position: 'RECEPTIONIST', email: 'e.volkova@hotel.ru', phone: '+7 (900) 100-01-02', hireDate: '2023-06-01', active: true },
    { id: 3, firstName: 'Ольга', lastName: 'Соколова', position: 'MAID', email: 'o.sokolova@hotel.ru', phone: '+7 (900) 100-01-03', hireDate: '2023-09-10', active: true },
    { id: 4, firstName: 'Дмитрий', lastName: 'Морозов', position: 'ACCOUNTANT', email: 'd.morozov@hotel.ru', phone: '+7 (900) 100-01-04', hireDate: '2022-11-01', active: true },
    { id: 5, firstName: 'Сергей', lastName: 'Васильев', position: 'ADMIN', email: 'admin@hotel.ru', phone: '+7 (900) 100-01-05', hireDate: '2022-01-10', active: true }
  ],
  tariffs: [
    { id: 1, name: 'Стандарт Базовый', roomType: 'STANDARD', pricePerNight: 3500.00, seasonStart: null, seasonEnd: null, active: true },
    { id: 2, name: 'Улучшенный Осенний', roomType: 'SUPERIOR', pricePerNight: 5000.00, seasonStart: '2026-09-01', seasonEnd: '2026-11-30', active: true },
    { id: 3, name: 'Делюкс Круглогодичный', roomType: 'DELUXE', pricePerNight: 7500.00, seasonStart: null, seasonEnd: null, active: true },
    { id: 4, name: 'Люкс Праздничный', roomType: 'SUITE', pricePerNight: 14000.00, seasonStart: '2026-12-25', seasonEnd: '2027-01-10', active: true }
  ],
  payments: [
    { id: 1, bookingId: 1, amount: 35000.00, method: 'CARD', paidAt: '2026-11-01 14:10', description: 'Полная оплата картой' },
    { id: 2, bookingId: 2, amount: 10000.00, method: 'TRANSFER', paidAt: '2026-11-02 16:00', description: 'Предоплата по счету' },
    { id: 3, bookingId: 3, amount: 17500.00, method: 'CASH', paidAt: '2026-10-25 11:30', description: 'Оплата наличными' }
  ]
};

// Справочники наименований
const LABELS = {
  types: {
    STANDARD: 'Стандарт',
    SUPERIOR: 'Супериор',
    DELUXE: 'Делюкс',
    SUITE: 'Люкс',
    PRESIDENTIAL: 'Президентский'
  },
  roomStatuses: {
    AVAILABLE: 'Свободен',
    OCCUPIED: 'Занят',
    BOOKED: 'Бронь',
    CLEANING: 'На уборке',
    OUT_OF_ORDER: 'Ремонт'
  },
  bookingStatuses: {
    PENDING: 'Ожидает',
    CONFIRMED: 'Подтверждено',
    CHECKED_IN: 'Заселен',
    CHECKED_OUT: 'Выселен',
    CANCELLED: 'Аннулировано'
  },
  positions: {
    MANAGER: 'Менеджер по бронированию',
    RECEPTIONIST: 'Портье (Ресепшн)',
    MAID: 'Горничная',
    ACCOUNTANT: 'Главный бухгалтер',
    ADMIN: 'Администратор системы'
  },
  methods: {
    CASH: 'Наличный расчет',
    CARD: 'Банковская карта',
    TRANSFER: 'Безналичный перевод'
  }
};

// Форматирование суммы в рубли
function formatRub(val) {
  return `${(Number(val) || 0).toLocaleString('ru-RU')} ₽`;
}

// Управление отображением ошибок внутри модальных окон
function showModalAlert(modalId, message, type = 'error') {
  const alertEl = document.getElementById(`${modalId}-alert`);
  if (!alertEl) return;
  alertEl.style.display = 'flex';
  alertEl.className = type === 'error' ? 'modal-alert' : 'modal-alert is-success';
  alertEl.innerHTML = `<strong>${type === 'error' ? 'Внимание:' : 'Успешно:'}</strong> <span>${message}</span>`;
}

function clearModalAlert(modalId) {
  const alertEl = document.getElementById(`${modalId}-alert`);
  if (alertEl) {
    alertEl.style.display = 'none';
    alertEl.innerHTML = '';
  }
  const modalBox = document.getElementById(modalId);
  if (modalBox) {
    modalBox.querySelectorAll('.form-control').forEach(input => input.classList.remove('is-invalid'));
  }
}

// Проверка соединения с Spring Boot бэкендом
async function checkBackendConnection(manual = false) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(`${API_BASE}/rooms`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      isApiOnline = true;
      syncServerStatus(true);
      if (manual) notify('Связь с сервером Spring Boot подтверждена');
      return true;
    }
  } catch (e) {
    // Сервер выключен
  }
  isApiOnline = false;
  syncServerStatus(false);
  if (manual) notify('Сервер не отвечает: работает автономный режим', 'err');
  return false;
}

function syncServerStatus(online) {
  const dot = document.getElementById('server-status-dot');
  const txt = document.getElementById('server-status-label');
  if (dot) {
    dot.className = `status-dot ${online ? 'online' : 'offline'}`;
  }
  if (txt) {
    txt.innerText = online ? 'REST API активен (порт 8080)' : 'Автономный режим (Демо)';
  }
}

// Запросы к REST API: защищены от падения и не переключают в оффлайн при 4xx ошибках
async function api(endpoint, options = {}) {
  if (isApiOnline) {
    let res;
    try {
      res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
      });
    } catch (networkError) {
      // Исключительно сетевая ошибка соединения (сервер отключен)
      console.warn('Сервер отключен по сети:', networkError.message);
      isApiOnline = false;
      syncServerStatus(false);
      notify('Сервер отключен: переключено в автономный режим', 'err');
      return mockApi(endpoint, options);
    }

    // Если сервер ответил — сервер работает! Обрабатываем HTTP статус
    if (!res.ok) {
      let errorMsg = `Ошибка запроса (${res.status})`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.message) {
          errorMsg = errJson.message;
        } else if (errJson && errJson.error) {
          errorMsg = errJson.error;
        }
      } catch (_) {}
      
      const error = new Error(errorMsg);
      error.status = res.status;
      throw error;
    }

    if (res.status === 204) return null;
    return await res.json();
  }

  // Автономная работа (Демо)
  return mockApi(endpoint, options);
}

// Полнофункциональное автономное ядро с зеркальной бизнес-логикой
function mockApi(endpoint, options = {}) {
  const method = options.method || 'GET';
  const data = options.body ? JSON.parse(options.body) : null;

  // 1. Номера
  if (endpoint.startsWith('/rooms')) {
    if (endpoint === '/rooms' && method === 'GET') return [...store.rooms];
    if (endpoint === '/rooms' && method === 'POST') {
      const num = (data.roomNumber || '').trim();
      if (!num) throw new Error('Номер комнаты обязателен для заполнения');
      if (store.rooms.some(r => r.roomNumber.toLowerCase() === num.toLowerCase())) {
        throw new Error(`Номер комнаты ${num} уже существует в системе`);
      }
      if (!data.pricePerNight || Number(data.pricePerNight) <= 0) {
        throw new Error('Стоимость за сутки должна быть больше нуля');
      }
      if (!data.maxGuests || Number(data.maxGuests) <= 0) {
        throw new Error('Вместимость номера должна быть не менее 1 человека');
      }

      const item = {
        id: Date.now(),
        roomNumber: num,
        type: data.type || 'STANDARD',
        status: data.status || 'AVAILABLE',
        floor: Number(data.floor) || 1,
        pricePerNight: Number(data.pricePerNight),
        maxGuests: Number(data.maxGuests) || 2,
        description: data.description ? data.description.trim() : ''
      };
      store.rooms.push(item);
      return item;
    }
    const match = endpoint.match(/\/rooms\/(\d+)/);
    if (match) {
      const id = parseInt(match[1]);
      const room = store.rooms.find(r => r.id === id);
      if (endpoint.endsWith('/status') && method === 'PATCH') {
        if (room) room.status = data.status;
        return room;
      }
      if (method === 'DELETE') {
        const bookings = store.bookings.filter(b => (b.roomId === id || (b.room && b.room.id === id)));
        if (bookings.length > 0) {
          const active = bookings.some(b => b.status !== 'CANCELLED');
          if (active) {
            throw new Error(`Нельзя удалить номер № ${room ? room.roomNumber : id}, к нему привязаны активные бронирования.`);
          } else {
            throw new Error(`Нельзя удалить номер № ${room ? room.roomNumber : id}, сохранена история бронирований. Рекомендуется статус 'Ремонт'.`);
          }
        }
        store.rooms = store.rooms.filter(r => r.id !== id);
        return null;
      }
      return room;
    }
  }

  // 2. Бронирования
  if (endpoint.startsWith('/bookings')) {
    if (endpoint.startsWith('/bookings/availability')) {
      return store.rooms.filter(r => r.status === 'AVAILABLE');
    }
    if (endpoint === '/bookings' && method === 'GET') {
      return store.bookings.map(b => ({
        ...b,
        room: store.rooms.find(r => r.id === b.roomId) || b.room,
        guest: store.guests.find(g => g.id === b.guestId) || b.guest
      }));
    }
    if (endpoint === '/bookings' && method === 'POST') {
      const roomId = parseInt(data.roomId);
      const guestId = parseInt(data.guestId);
      const checkIn = data.checkInDate;
      const checkOut = data.checkOutDate;

      if (!checkIn || !checkOut) throw new Error('Даты заезда и выезда должны быть указаны');
      if (new Date(checkIn) >= new Date(checkOut)) {
        throw new Error('Дата заезда должна быть строго раньше даты выезда');
      }

      const room = store.rooms.find(r => r.id === roomId);
      if (!room) throw new Error('Выбранный номер не найден');
      if (room.status === 'OUT_OF_ORDER') throw new Error(`Номер ${room.roomNumber} находится на ремонте`);

      const guest = store.guests.find(g => g.id === guestId);
      if (!guest) throw new Error('Выбранный гость не найден');

      const guestCount = parseInt(data.guestCount) || 1;
      if (guestCount > room.maxGuests) {
        throw new Error(`Количество гостей (${guestCount}) превышает вместимость номера (${room.maxGuests})`);
      }

      // Проверка наложения дат
      const overlaps = store.bookings.filter(b => {
        if (b.roomId !== roomId) return false;
        if (b.status === 'CANCELLED') return false;
        return (new Date(checkIn) < new Date(b.checkOutDate) && new Date(checkOut) > new Date(b.checkInDate));
      });
      if (overlaps.length > 0) {
        throw new Error(`Номер ${room.roomNumber} уже занят на выбранные даты другим бронированием`);
      }

      const diffTime = Math.abs(new Date(checkOut) - new Date(checkIn));
      const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const totalPrice = room.pricePerNight * nights;

      const newBook = {
        id: Date.now(),
        roomId: roomId,
        guestId: guestId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        status: 'CONFIRMED',
        totalPrice: totalPrice,
        guestCount: guestCount,
        createdAt: new Date().toISOString()
      };
      store.bookings.push(newBook);
      if (room.status === 'AVAILABLE') room.status = 'BOOKED';
      return newBook;
    }
    const match = endpoint.match(/\/bookings\/(\d+)/);
    if (match) {
      const id = parseInt(match[1]);
      const book = store.bookings.find(b => b.id === id);
      if (method === 'DELETE') {
        if (book) book.status = 'CANCELLED';
        const r = store.rooms.find(x => x.id === (book ? book.roomId : 0));
        if (r && r.status === 'BOOKED') r.status = 'AVAILABLE';
        return book;
      }
      return book;
    }
  }

  // 3. Гости
  if (endpoint.startsWith('/guests')) {
    if (endpoint === '/guests' && method === 'GET') return [...store.guests];
    if (endpoint === '/guests' && method === 'POST') {
      const passport = (data.passportNumber || '').trim();
      if (!passport) throw new Error('Паспортные данные обязательны');
      if (store.guests.some(g => g.passportNumber.toLowerCase() === passport.toLowerCase())) {
        throw new Error(`Гость с паспортом ${passport} уже зарегистрирован`);
      }

      const g = {
        id: Date.now(),
        firstName: (data.firstName || '').trim(),
        lastName: (data.lastName || '').trim(),
        phone: (data.phone || '').trim(),
        email: (data.email || '').trim(),
        passportNumber: passport,
        nationality: (data.nationality || 'Россия').trim(),
        checkInDate: null,
        checkOutDate: null,
        checkedIn: false
      };
      store.guests.push(g);
      return g;
    }
    const match = endpoint.match(/\/guests\/(\d+)/);
    if (match) {
      const id = parseInt(match[1]);
      const guest = store.guests.find(g => g.id === id);
      if (endpoint.endsWith('/checkin') && method === 'POST') {
        if (guest) {
          if (guest.checkedIn) throw new Error(`Гость ${guest.firstName} ${guest.lastName} уже заселен`);
          guest.checkedIn = true;
          guest.checkInDate = new Date().toISOString().split('T')[0];
          const b = store.bookings.find(x => x.guestId === id && (x.status === 'CONFIRMED' || x.status === 'PENDING'));
          if (b) {
            b.status = 'CHECKED_IN';
            const r = store.rooms.find(x => x.id === b.roomId);
            if (r) r.status = 'OCCUPIED';
          }
        }
        return guest;
      }
      if (endpoint.endsWith('/checkout') && method === 'POST') {
        if (guest) {
          if (!guest.checkedIn) throw new Error(`Гость ${guest.firstName} ${guest.lastName} не заселен`);
          guest.checkedIn = false;
          guest.checkOutDate = new Date().toISOString().split('T')[0];
          const b = store.bookings.find(x => x.guestId === id && x.status === 'CHECKED_IN');
          if (b) {
            b.status = 'CHECKED_OUT';
            const r = store.rooms.find(x => x.id === b.roomId);
            if (r) r.status = 'CLEANING';
          }
        }
        return guest;
      }
      return guest;
    }
  }

  // 4. Персонал
  if (endpoint.startsWith('/staff')) {
    if (endpoint === '/staff' && method === 'GET') return [...store.staff];
    if (endpoint === '/staff' && method === 'POST') {
      const email = (data.email || '').trim().toLowerCase();
      if (!email) throw new Error('Email сотрудника обязателен');
      if (store.staff.some(s => s.email.toLowerCase() === email)) {
        throw new Error(`Сотрудник с email ${email} уже существует`);
      }
      const s = {
        id: Date.now(),
        firstName: (data.firstName || '').trim(),
        lastName: (data.lastName || '').trim(),
        position: data.position || 'RECEPTIONIST',
        email: email,
        phone: (data.phone || '').trim(),
        hireDate: data.hireDate || new Date().toISOString().split('T')[0],
        active: true
      };
      store.staff.push(s);
      return s;
    }
    const match = endpoint.match(/\/staff\/(\d+)/);
    if (match) {
      const id = parseInt(match[1]);
      const member = store.staff.find(s => s.id === id);
      if (endpoint.endsWith('/schedule')) {
        return {
          staffId: id,
          fullName: member ? `${member.firstName} ${member.lastName}` : 'Сотрудник',
          position: member ? member.position : 'RECEPTIONIST',
          shiftHours: '08:00 — 20:00',
          workSchedule: '2/2 (Дневная смена)',
          assignedFloor: member && member.position === 'MAID' ? '1-й и 2-й этажи' : 'Главный холл / Ресепшн',
          status: 'На смене'
        };
      }
      if (method === 'DELETE') {
        store.staff = store.staff.filter(s => s.id !== id);
        return null;
      }
      return member;
    }
  }

  // 5. Тарифы
  if (endpoint.startsWith('/tariffs')) {
    if (endpoint === '/tariffs' && method === 'GET') return [...store.tariffs];
  }

  // 6. Платежи
  if (endpoint.startsWith('/payments')) {
    if (endpoint === '/payments' && method === 'GET') return [...store.payments];
    if (endpoint === '/payments' && method === 'POST') {
      const amount = parseFloat(data.amount);
      if (!amount || amount <= 0) throw new Error('Сумма платежа должна быть строго больше нуля');

      const bookingId = parseInt(data.bookingId);
      const b = store.bookings.find(x => x.id === bookingId);
      if (!b) throw new Error('Бронирование не найдено');
      if (b.status === 'CANCELLED') throw new Error('Нельзя принять оплату по аннулированному бронированию');

      const p = {
        id: Date.now(),
        bookingId: bookingId,
        amount: amount,
        method: data.method || 'CARD',
        paidAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        description: data.description ? data.description.trim() : 'Оплата проживания'
      };
      store.payments.push(p);
      return p;
    }
  }

  // 7. Счёт за проживание (Invoice)
  if (endpoint.startsWith('/invoices/')) {
    const id = parseInt(endpoint.replace('/invoices/', ''));
    const b = store.bookings.find(x => x.id === id) || store.bookings[0];
    const r = store.rooms.find(x => x.id === (b ? b.roomId : 1)) || store.rooms[0];
    const g = store.guests.find(x => x.id === (b ? b.guestId : 1)) || store.guests[0];
    const paid = store.payments.filter(p => p.bookingId === id).reduce((a, b) => a + b.amount, 0);

    const checkIn = b ? b.checkInDate : '2026-11-01';
    const checkOut = b ? b.checkOutDate : '2026-11-08';
    const nights = Math.max(1, Math.ceil(Math.abs(new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));
    const total = b ? b.totalPrice : 35000;
    const balanceDue = Math.max(0, total - paid);

    return {
      invoiceNumber: `INV-${String(id).padStart(6, '0')}`,
      issueDate: new Date().toISOString().split('T')[0],
      bookingId: id,
      guestFullName: `${g.firstName} ${g.lastName}`,
      guestPassport: g.passportNumber,
      guestPhone: g.phone,
      roomNumber: r.roomNumber,
      roomType: r.type,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfNights: nights,
      pricePerNight: r.pricePerNight,
      roomTotal: total,
      totalAmount: total,
      paidAmount: paid,
      balanceDue: balanceDue,
      paymentStatus: balanceDue <= 0 ? 'ОПЛАЧЕНО' : 'К ОПЛАТЕ'
    };
  }

  // 8. Аналитические отчеты
  if (endpoint.startsWith('/reports')) {
    if (endpoint === '/reports/occupancy') {
      const total = store.rooms.length;
      const occ = store.rooms.filter(r => r.status === 'OCCUPIED').length;
      const rate = total > 0 ? Math.round((occ / total) * 100) : 0;
      return {
        totalRooms: total,
        occupiedRooms: occ,
        occupancyRate: rate,
        occupancyRatePercentage: rate,
        availableRooms: store.rooms.filter(r => r.status === 'AVAILABLE').length,
        cleaningRooms: store.rooms.filter(r => r.status === 'CLEANING').length,
        bookedRooms: store.rooms.filter(r => r.status === 'BOOKED').length,
        outOfOrderRooms: store.rooms.filter(r => r.status === 'OUT_OF_ORDER').length
      };
    }
    if (endpoint === '/reports/revenue') {
      const total = store.payments.reduce((acc, p) => acc + p.amount, 0);
      const byMethod = {
        CARD: store.payments.filter(p => p.method === 'CARD').reduce((a, b) => a + b.amount, 0),
        CASH: store.payments.filter(p => p.method === 'CASH').reduce((a, b) => a + b.amount, 0),
        TRANSFER: store.payments.filter(p => p.method === 'TRANSFER').reduce((a, b) => a + b.amount, 0)
      };
      return {
        totalRevenue: total,
        totalPaymentsCount: store.payments.length,
        totalTransactions: store.payments.length,
        revenueByPaymentMethod: byMethod,
        revenueByMethod: byMethod
      };
    }
    if (endpoint === '/reports/staff-performance') {
      return {
        staffStats: store.staff.map(s => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          position: s.position,
          rating: (4.7 + ((s.id % 3) * 0.1)).toFixed(1),
          tasksCompleted: 14 + s.id * 2,
          shift: s.id % 2 === 0 ? 'Дневная смена (08:00 - 20:00)' : 'Ночная смена (20:00 - 08:00)'
        }))
      };
    }
  }

  return null;
}

// ==========================================================================
// НАВИГАЦИЯ МЕЖДУ РАЗДЕЛАМИ
// ==========================================================================
function setupNavigation() {
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view) navigateTo(view);
    });
  });
}

function navigateTo(viewName) {
  document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));

  const target = document.getElementById(`view-${viewName}`);
  const btn = document.querySelector(`.nav-link[data-view="${viewName}"]`);
  if (target) target.classList.add('active');
  if (btn) btn.classList.add('active');

  switch (viewName) {
    case 'dashboard': renderDashboard(); break;
    case 'rooms': renderRooms(); break;
    case 'bookings': renderBookings(); break;
    case 'guests': renderGuests(); break;
    case 'staff': renderStaff(); break;
    case 'tariffs': renderTariffs(); break;
    case 'reports': renderReports(); break;
  }
}

// ==========================================================================
// 1. ДАШБОРД (Главная страница)
// ==========================================================================
async function renderDashboard() {
  const [rooms, guests, rev] = await Promise.all([
    api('/rooms'),
    api('/guests'),
    api('/reports/revenue')
  ]);

  if (!rooms) return;

  const total = rooms.length;
  const occupied = rooms.filter(r => r.status === 'OCCUPIED').length;
  const available = rooms.filter(r => r.status === 'AVAILABLE').length;
  const cleaning = rooms.filter(r => r.status === 'CLEANING').length;
  const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  const rateEl = document.getElementById('dash-kpi-rate');
  if (rateEl) rateEl.innerText = `${rate}%`;

  const availEl = document.getElementById('dash-kpi-avail');
  if (availEl) availEl.innerText = available;

  const cleanEl = document.getElementById('dash-kpi-clean');
  if (cleanEl) cleanEl.innerText = cleaning;

  const revEl = document.getElementById('dash-kpi-rev');
  if (revEl) revEl.innerText = formatRub(rev?.totalRevenue || 0);

  // Интерактивная карта номеров
  const matrix = document.getElementById('dash-matrix');
  if (matrix) {
    matrix.innerHTML = rooms.map(r => `
      <div class="room-cell ${r.status}" onclick="openRoomStatusModal(${r.id}, '${r.roomNumber}', '${r.status}')" title="Кликните для изменения статуса">
        <div>
          <div class="room-num-tag">№ ${r.roomNumber}</div>
          <div class="room-type-tag">${LABELS.types[r.type] || r.type}</div>
        </div>
        <div>
          <div style="font-size:11px; font-weight:700; color:var(--text-main); margin-top:6px">${formatRub(r.pricePerNight)}</div>
          <div class="room-status-badge ${r.status}">${LABELS.roomStatuses[r.status] || r.status}</div>
        </div>
      </div>
    `).join('');
  }

  // Текущие постояльцы
  const tbody = document.getElementById('dash-arrivals');
  if (tbody && guests) {
    const activeGuests = guests.filter(g => g.checkedIn);
    if (activeGuests.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:20px">В данный момент проживающих гостей нет</td></tr>';
    } else {
      tbody.innerHTML = activeGuests.map(g => `
        <tr>
          <td><strong>${g.firstName} ${g.lastName}</strong></td>
          <td>${g.phone}</td>
          <td>${g.passportNumber}</td>
          <td><span class="badge badge-OCCUPIED">Проживает</span></td>
          <td>
            <button class="btn btn-xs btn-outline" onclick="checkOutGuest(${g.id})">
              Выселить
            </button>
          </td>
        </tr>
      `).join('');
    }
  }

  updateNavCounts({
    rooms: rooms.length,
    guests: guests ? guests.length : 0
  });
}

// ==========================================================================
// 2. НОМЕРНОЙ ФОНД
// ==========================================================================
let allLoadedRooms = [];

async function renderRooms() {
  const rooms = await api('/rooms');
  if (!rooms) return;
  allLoadedRooms = rooms;
  updateNavCounts({ rooms: rooms.length });
  displayRoomsTable(rooms);
}

function displayRoomsTable(rooms) {
  const tbody = document.getElementById('rooms-tbody');
  if (!tbody) return;

  if (rooms.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:24px">Номера не найдены</td></tr>';
    return;
  }

  tbody.innerHTML = rooms.map(r => `
    <tr>
      <td><strong>№ ${r.roomNumber}</strong></td>
      <td>${LABELS.types[r.type] || r.type}</td>
      <td>${r.floor} этаж</td>
      <td>${r.maxGuests} чел.</td>
      <td><strong style="color:var(--primary-accent)">${formatRub(r.pricePerNight)}</strong></td>
      <td>
        <span class="badge badge-${r.status}">
          ${LABELS.roomStatuses[r.status] || r.status}
        </span>
      </td>
      <td>
        <div style="display:flex; gap:6px">
          <button class="btn btn-xs btn-secondary" onclick="openRoomStatusModal(${r.id}, '${r.roomNumber}', '${r.status}')">
            Статус
          </button>
          <button class="btn btn-xs btn-danger" onclick="removeRoom(${r.id})">
            Удалить
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterRoomsList() {
  const search = (document.getElementById('room-search-input')?.value || '').trim().toLowerCase();
  const status = document.getElementById('room-status-filter')?.value || '';

  const filtered = allLoadedRooms.filter(r => {
    const matchNum = !search || r.roomNumber.toLowerCase().includes(search);
    const matchStatus = !status || r.status === status;
    return matchNum && matchStatus;
  });

  displayRoomsTable(filtered);
}

// ==========================================================================
// 3. БРОНИРОВАНИЯ
// ==========================================================================
async function renderBookings() {
  const [books, rooms, guests] = await Promise.all([
    api('/bookings'),
    api('/rooms'),
    api('/guests')
  ]);

  if (!books) return;
  updateNavCounts({ bookings: books.length });

  const tbody = document.getElementById('bookings-tbody');
  if (tbody) {
    if (books.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:24px">Бронирований пока нет</td></tr>';
    } else {
      tbody.innerHTML = books.map(b => {
        const room = b.room || (rooms ? rooms.find(r => r.id === (b.roomId || b.room_id)) : null);
        const guest = b.guest || (guests ? guests.find(g => g.id === (b.guestId || b.guest_id)) : null);

        return `
          <tr>
            <td><strong>#${b.id}</strong></td>
            <td>
              <strong>${guest ? `${guest.firstName} ${guest.lastName}` : 'Гость #' + (b.guestId || b.id)}</strong>
              <div style="font-size:11.5px; color:var(--text-muted)">${guest?.phone || ''}</div>
            </td>
            <td>
              <strong>№ ${room?.roomNumber || '—'}</strong>
              <div style="font-size:11.5px; color:var(--text-muted)">${LABELS.types[room?.type] || ''}</div>
            </td>
            <td>${b.checkInDate} &rarr; ${b.checkOutDate}</td>
            <td><strong style="color:var(--text-main)">${formatRub(b.totalPrice)}</strong></td>
            <td>
              <span class="badge badge-${b.status}">
                ${LABELS.bookingStatuses[b.status] || b.status}
              </span>
            </td>
            <td>
              <div style="display:flex; gap:6px">
                <button class="btn btn-xs btn-outline" onclick="openInvoiceSheet(${b.id})">
                  Счёт
                </button>
                ${b.status !== 'CANCELLED' ? `
                  <button class="btn btn-xs btn-danger" onclick="cancelBooking(${b.id})">
                    Отмена
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }
}

// Заполнение выпадающих списков при бронировании
async function populateBookingSelects() {
  try {
    const [rooms, guests] = await Promise.all([api('/rooms'), api('/guests')]);
    const rSel = document.getElementById('newbook-room');
    const gSel = document.getElementById('newbook-guest');

    if (rSel && rooms) {
      rSel.innerHTML = rooms.map(r => `
        <option value="${r.id}">
          № ${r.roomNumber} (${LABELS.types[r.type] || r.type}) — ${formatRub(r.pricePerNight)}/сут. [${LABELS.roomStatuses[r.status] || r.status}]
        </option>
      `).join('');
    }

    if (gSel && guests) {
      gSel.innerHTML = guests.map(g => `
        <option value="${g.id}">
          ${g.firstName} ${g.lastName} (паспорт: ${g.passportNumber})
        </option>
      `).join('');
    }

    // Установка дат по умолчанию (заезд сегодня, выезд через 3 дня)
    const today = new Date();
    const inDateStr = today.toISOString().split('T')[0];
    const outDate = new Date();
    outDate.setDate(today.getDate() + 3);
    const outDateStr = outDate.toISOString().split('T')[0];

    const inEl = document.getElementById('newbook-checkin');
    const outEl = document.getElementById('newbook-checkout');
    if (inEl && !inEl.value) inEl.value = inDateStr;
    if (outEl && !outEl.value) outEl.value = outDateStr;
  } catch (e) {
    console.warn('Ошибка заполнения списков бронирования:', e);
  }
}

// ==========================================================================
// 4. ГОСТИ
// ==========================================================================
async function renderGuests() {
  const guests = await api('/guests');
  if (!guests) return;
  updateNavCounts({ guests: guests.length });

  const tbody = document.getElementById('guests-tbody');
  if (tbody) {
    if (guests.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:24px">Гости не зарегистрированы</td></tr>';
      return;
    }

    tbody.innerHTML = guests.map(g => `
      <tr>
        <td><strong>${g.firstName} ${g.lastName}</strong></td>
        <td><code>${g.passportNumber}</code></td>
        <td>${g.phone}</td>
        <td>${g.email}</td>
        <td>${g.nationality || 'Россия'}</td>
        <td>
          <span class="badge ${g.checkedIn ? 'badge-OCCUPIED' : 'badge-AVAILABLE'}">
            ${g.checkedIn ? 'В отеле' : 'Выписан / Бронь'}
          </span>
        </td>
        <td>
          ${g.checkedIn ? `
            <button class="btn btn-xs btn-outline" onclick="checkOutGuest(${g.id})">
              Выселить
            </button>
          ` : `
            <button class="btn btn-xs btn-secondary" onclick="checkInGuest(${g.id})">
              Заселить
            </button>
          `}
        </td>
      </tr>
    `).join('');
  }
}

// ==========================================================================
// 5. ПЕРСОНАЛ
// ==========================================================================
async function renderStaff() {
  const staff = await api('/staff');
  if (!staff) return;
  updateNavCounts({ staff: staff.length });

  const grid = document.getElementById('staff-grid');
  if (!grid) return;

  grid.innerHTML = staff.map(s => `
    <div class="staff-card">
      <div class="staff-top">
        <div>
          <div class="staff-name">${s.firstName} ${s.lastName}</div>
          <div class="staff-pos">${LABELS.positions[s.position] || s.position}</div>
        </div>
        <span class="badge ${s.active ? 'badge-AVAILABLE' : 'badge-OUT_OF_ORDER'}">
          ${s.active ? 'В штате' : 'Отпуск'}
        </span>
      </div>
      <div class="staff-details">
        <div>Телефон: <strong style="color:var(--text-main)">${s.phone}</strong></div>
        <div>Email: <strong style="color:var(--text-main)">${s.email}</strong></div>
        <div>Принят: <span>${s.hireDate || '2023-01-15'}</span></div>
      </div>
      <div class="staff-footer">
        <button class="btn btn-sm btn-secondary" style="flex:1" onclick="openStaffSchedule(${s.id})">
          График смен
        </button>
        <button class="btn btn-sm btn-danger" onclick="removeStaff(${s.id})">
          Удалить
        </button>
      </div>
    </div>
  `).join('');
}

// ==========================================================================
// 6. ТАРИФЫ И КАССА
// ==========================================================================
async function renderTariffs() {
  const [tariffs, payments] = await Promise.all([
    api('/tariffs'),
    api('/payments')
  ]);

  const tBody = document.getElementById('tariffs-tbody');
  if (tBody && tariffs) {
    tBody.innerHTML = tariffs.map(t => `
      <tr>
        <td><strong>${t.name}</strong></td>
        <td>${LABELS.types[t.roomType] || t.roomType}</td>
        <td><strong style="color:var(--primary-accent)">${formatRub(t.pricePerNight)}</strong></td>
        <td>${t.seasonStart ? `${t.seasonStart} &rarr; ${t.seasonEnd}` : 'Круглый год'}</td>
        <td>
          <span class="badge ${t.active ? 'badge-AVAILABLE' : 'badge-OUT_OF_ORDER'}">
            ${t.active ? 'Активен' : 'Архив'}
          </span>
        </td>
      </tr>
    `).join('');
  }

  const pBody = document.getElementById('payments-tbody');
  if (pBody && payments) {
    if (payments.length === 0) {
      pBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px">Платежи не зарегистрированы</td></tr>';
    } else {
      pBody.innerHTML = payments.map(p => `
        <tr>
          <td><strong>#${p.id}</strong></td>
          <td>Бронь #${p.bookingId || (p.booking ? p.booking.id : '—')}</td>
          <td><strong style="color:#059669">${formatRub(p.amount)}</strong></td>
          <td><span class="badge badge-AVAILABLE">${LABELS.methods[p.method] || p.method}</span></td>
          <td>${p.paidAt ? p.paidAt.substring(0, 16) : '—'}</td>
          <td>${p.description || 'Оплата проживания'}</td>
        </tr>
      `).join('');
    }
  }
}

// Открытие модалки оплаты
async function openPaymentModal() {
  const books = await api('/bookings');
  const sel = document.getElementById('pay-booking-sel');
  if (sel && books) {
    const activeBooks = books.filter(b => b.status !== 'CANCELLED');
    sel.innerHTML = activeBooks.map(b => `
      <option value="${b.id}">
        Бронь #${b.id} — ${formatRub(b.totalPrice)} [${LABELS.bookingStatuses[b.status] || b.status}]
      </option>
    `).join('');
  }
  clearModalAlert('modal-add-payment');
  openModal('modal-add-payment');
}

async function submitPayment(e) {
  e.preventDefault();
  const btn = document.getElementById('add-payment-submit-btn');
  const origText = btn ? btn.innerHTML : 'Провести платеж';
  if (btn) { btn.disabled = true; btn.innerHTML = 'Проведение...'; }

  clearModalAlert('modal-add-payment');

  const payload = {
    bookingId: parseInt(document.getElementById('pay-booking-sel').value),
    amount: parseFloat(document.getElementById('pay-amount').value),
    method: document.getElementById('pay-method').value,
    description: document.getElementById('pay-desc').value.trim()
  };

  try {
    await api('/payments', { method: 'POST', body: JSON.stringify(payload) });
    notify('Платеж успешно зарегистрирован');
    closeModal('modal-add-payment');
    renderTariffs();
    renderDashboard();
    renderReports();
  } catch (err) {
    showModalAlert('modal-add-payment', err.message);
    notify(err.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  }
}

// ==========================================================================
// 7. ОТЧЕТЫ И АНАЛИТИКА (Устранены все undefined и расхождения DTO)
// ==========================================================================
async function renderReports() {
  const [occ, rev, staffRep] = await Promise.all([
    api('/reports/occupancy'),
    api('/reports/revenue'),
    api('/reports/staff-performance')
  ]);

  if (occ) {
    const rawRate = occ.occupancyRatePercentage !== undefined 
      ? occ.occupancyRatePercentage 
      : (occ.occupancyRate !== undefined ? occ.occupancyRate : 0);
    const rateVal = Math.round(Number(rawRate) || 0);
    const totalRooms = occ.totalRooms !== undefined ? occ.totalRooms : 0;
    const occupied = occ.occupiedRooms !== undefined ? occ.occupiedRooms : 0;
    const available = occ.availableRooms !== undefined ? occ.availableRooms : 0;
    const cleaning = occ.cleaningRooms !== undefined ? occ.cleaningRooms : 0;
    const booked = occ.bookedRooms !== undefined ? occ.bookedRooms : 0;
    const repair = occ.outOfOrderRooms !== undefined ? occ.outOfOrderRooms : 0;

    const rateEl = document.getElementById('rep-occ-rate');
    if (rateEl) rateEl.innerText = `${rateVal}%`;

    const totalEl = document.getElementById('rep-occ-total');
    if (totalEl) totalEl.innerText = `Всего ${totalRooms} номеров в фонде`;

    const breakdownEl = document.getElementById('rep-occ-breakdown');
    if (breakdownEl) {
      breakdownEl.innerHTML = `Занято: <strong>${occupied}</strong> • Свободно: <strong>${available}</strong> • Бронь: <strong>${booked}</strong> • Уборка: <strong>${cleaning}</strong> • Ремонт: <strong>${repair}</strong>`;
    }
  }

  if (rev) {
    const totalRev = Number(rev.totalRevenue) || 0;
    const txCount = rev.totalPaymentsCount !== undefined 
      ? rev.totalPaymentsCount 
      : (rev.totalTransactions !== undefined ? rev.totalTransactions : 0);
    const byMethod = rev.revenueByPaymentMethod || rev.revenueByMethod || {};

    const cardSum = Number(byMethod.CARD || byMethod.card || 0);
    const cashSum = Number(byMethod.CASH || byMethod.cash || 0);
    const transferSum = Number(byMethod.TRANSFER || byMethod.transfer || 0);

    const revTotalEl = document.getElementById('rep-rev-total');
    if (revTotalEl) revTotalEl.innerText = formatRub(totalRev);

    const txEl = document.getElementById('rep-rev-tx');
    if (txEl) txEl.innerText = `${txCount} платежей проведено`;

    const cardEl = document.getElementById('rep-card-sum');
    if (cardEl) cardEl.innerText = formatRub(cardSum);

    const cashEl = document.getElementById('rep-cash-sum');
    if (cashEl) cashEl.innerText = formatRub(cashSum);

    const transferEl = document.getElementById('rep-transfer-sum');
    if (transferEl) transferEl.innerText = formatRub(transferSum);

    // Расчет долей для индикаторных шкал
    const baseRev = totalRev > 0 ? totalRev : 1;
    const cardPct = totalRev > 0 ? Math.round((cardSum / baseRev) * 100) : 0;
    const transferPct = totalRev > 0 ? Math.round((transferSum / baseRev) * 100) : 0;
    const cashPct = totalRev > 0 ? Math.round((cashSum / baseRev) * 100) : 0;

    const cardBar = document.getElementById('rep-card-bar');
    if (cardBar) cardBar.style.width = `${cardPct}%`;

    const transferBar = document.getElementById('rep-transfer-bar');
    if (transferBar) transferBar.style.width = `${transferPct}%`;

    const cashBar = document.getElementById('rep-cash-bar');
    if (cashBar) cashBar.style.width = `${cashPct}%`;
  }

  if (staffRep && staffRep.staffStats) {
    const list = document.getElementById('rep-staff-kpi');
    if (list) {
      list.innerHTML = staffRep.staffStats.map(s => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border-inner)">
          <div>
            <div style="font-weight:700; color:var(--text-main); font-size:13.5px">${s.name}</div>
            <div style="font-size:11.5px; color:var(--text-muted)">${LABELS.positions[s.position] || s.position} • ${s.shift}</div>
          </div>
          <div style="text-align:right">
            <div style="color:#d97706; font-weight:700; font-size:13px">Рейтинг: ${s.rating}</div>
            <div style="font-size:11px; color:var(--text-dim)">Смен: ${s.tasksCompleted}</div>
          </div>
        </div>
      `).join('');
    }
  }
}

// ==========================================================================
// УПРАВЛЕНИЕ МОДАЛЬНЫМИ ОКНАМИ
// ==========================================================================
function openModal(id) {
  clearModalAlert(id);
  const m = document.getElementById(id);
  if (m) m.classList.add('active');
}

function closeModal(id) {
  clearModalAlert(id);
  const m = document.getElementById(id);
  if (m) m.classList.remove('active');
}

// Смена статуса номера
let selectedRoomId = null;
function openRoomStatusModal(id, num, status) {
  selectedRoomId = id;
  document.getElementById('status-modal-num').innerText = num;
  document.getElementById('modal-room-status-sel').value = status;
  openModal('modal-status');
}

async function applyRoomStatus() {
  const st = document.getElementById('modal-room-status-sel').value;
  if (!selectedRoomId) return;

  const btn = document.getElementById('modal-status-submit-btn');
  const origText = btn ? btn.innerHTML : 'Сохранить';
  if (btn) { btn.disabled = true; btn.innerHTML = 'Сохранение...'; }

  clearModalAlert('modal-status');

  try {
    await api(`/rooms/${selectedRoomId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: st })
    });
    notify('Статус номера успешно обновлен');
    closeModal('modal-status');
    renderRooms();
    renderDashboard();
    renderReports();
  } catch (err) {
    showModalAlert('modal-status', err.message);
    notify(err.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  }
}

// Создание нового номера
async function submitRoom(e) {
  e.preventDefault();
  const btn = document.getElementById('add-room-submit-btn');
  const origText = btn ? btn.innerHTML : 'Создать номер';
  if (btn) { btn.disabled = true; btn.innerHTML = 'Сохранение...'; }

  clearModalAlert('modal-add-room');

  const room = {
    roomNumber: document.getElementById('add-room-num').value.trim(),
    type: document.getElementById('add-room-type').value,
    status: document.getElementById('add-room-status') ? document.getElementById('add-room-status').value : 'AVAILABLE',
    floor: parseInt(document.getElementById('add-room-floor').value),
    maxGuests: parseInt(document.getElementById('add-room-guests').value),
    pricePerNight: parseFloat(document.getElementById('add-room-price').value),
    description: document.getElementById('add-room-desc').value.trim()
  };

  try {
    await api('/rooms', { method: 'POST', body: JSON.stringify(room) });
    notify(`Номер ${room.roomNumber} успешно добавлен`);
    closeModal('modal-add-room');
    e.target.reset();
    renderRooms();
    renderDashboard();
    populateBookingSelects();
  } catch (err) {
    showModalAlert('modal-add-room', err.message);
    notify(err.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  }
}

async function removeRoom(id) {
  if (!confirm('Вы действительно хотите удалить этот номер?')) return;
  try {
    await api(`/rooms/${id}`, { method: 'DELETE' });
    notify('Номер успешно удален');
    renderRooms();
    renderDashboard();
    populateBookingSelects();
  } catch (err) {
    notify(err.message, 'err');
  }
}

// Создание бронирования
async function submitBooking(e) {
  e.preventDefault();
  const btn = document.getElementById('add-booking-submit-btn');
  const origText = btn ? btn.innerHTML : 'Подтвердить бронь';
  if (btn) { btn.disabled = true; btn.innerHTML = 'Оформление...'; }

  clearModalAlert('modal-add-booking');

  const payload = {
    roomId: parseInt(document.getElementById('newbook-room').value),
    guestId: parseInt(document.getElementById('newbook-guest').value),
    checkInDate: document.getElementById('newbook-checkin').value,
    checkOutDate: document.getElementById('newbook-checkout').value,
    guestCount: parseInt(document.getElementById('newbook-count').value)
  };

  try {
    await api('/bookings', { method: 'POST', body: JSON.stringify(payload) });
    notify('Бронирование успешно оформлено');
    closeModal('modal-add-booking');
    renderBookings();
    renderDashboard();
  } catch (err) {
    showModalAlert('modal-add-booking', err.message);
    notify(err.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  }
}

async function cancelBooking(id) {
  if (!confirm('Вы действительно хотите аннулировать это бронирование?')) return;
  try {
    await api(`/bookings/${id}`, { method: 'DELETE' });
    notify('Бронирование успешно аннулировано');
    renderBookings();
    renderDashboard();
  } catch (err) {
    notify(err.message, 'err');
  }
}

// Регистрация нового гостя
async function submitGuest(e) {
  e.preventDefault();
  const btn = document.getElementById('add-guest-submit-btn');
  const origText = btn ? btn.innerHTML : 'Зарегистрировать';
  if (btn) { btn.disabled = true; btn.innerHTML = 'Регистрация...'; }

  clearModalAlert('modal-add-guest');

  const guest = {
    firstName: document.getElementById('guest-fn').value.trim(),
    lastName: document.getElementById('guest-ln').value.trim(),
    phone: document.getElementById('guest-ph').value.trim(),
    email: document.getElementById('guest-em').value.trim(),
    passportNumber: document.getElementById('guest-pass').value.trim(),
    nationality: document.getElementById('guest-nat').value.trim() || 'Россия'
  };

  try {
    await api('/guests', { method: 'POST', body: JSON.stringify(guest) });
    notify('Гость успешно зарегистрирован');
    closeModal('modal-add-guest');
    e.target.reset();
    renderGuests();
    populateBookingSelects();
  } catch (err) {
    showModalAlert('modal-add-guest', err.message);
    notify(err.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  }
}

async function checkInGuest(id) {
  try {
    await api(`/guests/${id}/checkin`, { method: 'POST' });
    notify('Гость заселен в номер');
    renderGuests();
    renderDashboard();
    renderRooms();
  } catch (err) {
    notify(err.message, 'err');
  }
}

async function checkOutGuest(id) {
  try {
    await api(`/guests/${id}/checkout`, { method: 'POST' });
    notify('Гость выселен, номер передан на уборку');
    renderGuests();
    renderDashboard();
    renderRooms();
  } catch (err) {
    notify(err.message, 'err');
  }
}

// Добавление сотрудника
async function submitStaff(e) {
  e.preventDefault();
  const btn = document.getElementById('add-staff-submit-btn');
  const origText = btn ? btn.innerHTML : 'Добавить в штат';
  if (btn) { btn.disabled = true; btn.innerHTML = 'Добавление...'; }

  clearModalAlert('modal-add-staff');

  const member = {
    firstName: document.getElementById('staff-fn').value.trim(),
    lastName: document.getElementById('staff-ln').value.trim(),
    position: document.getElementById('staff-pos').value,
    email: document.getElementById('staff-em').value.trim(),
    phone: document.getElementById('staff-ph').value.trim(),
    hireDate: document.getElementById('staff-date').value || new Date().toISOString().split('T')[0]
  };

  try {
    await api('/staff', { method: 'POST', body: JSON.stringify(member) });
    notify('Сотрудник принят в штат');
    closeModal('modal-add-staff');
    e.target.reset();
    renderStaff();
  } catch (err) {
    showModalAlert('modal-add-staff', err.message);
    notify(err.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  }
}

async function removeStaff(id) {
  if (!confirm('Исключить сотрудника из штата?')) return;
  try {
    await api(`/staff/${id}`, { method: 'DELETE' });
    notify('Сотрудник исключен из штата');
    renderStaff();
  } catch (err) {
    notify(err.message, 'err');
  }
}

// Расписание сотрудника
async function openStaffSchedule(id) {
  const sch = await api(`/staff/${id}/schedule`);
  if (!sch) return;

  document.getElementById('sch-name').innerText = sch.fullName;
  document.getElementById('sch-pos').innerText = LABELS.positions[sch.position] || sch.position;
  document.getElementById('sch-hours').innerText = sch.shiftHours;
  document.getElementById('sch-plan').innerText = sch.workSchedule;
  document.getElementById('sch-zone').innerText = sch.assignedFloor;
  document.getElementById('sch-status').innerText = sch.status;

  openModal('modal-staff-shift');
}

// Просмотр и печать счета (Invoice)
async function openInvoiceSheet(bookingId) {
  const inv = await api(`/invoices/${bookingId}`);
  if (!inv) return;

  document.getElementById('inv-code').innerText = inv.invoiceNumber;
  document.getElementById('inv-date-val').innerText = `Дата: ${inv.issueDate}`;
  document.getElementById('inv-guest-name').innerText = inv.guestFullName;
  document.getElementById('inv-guest-passport').innerText = `Паспорт: ${inv.guestPassport}`;
  document.getElementById('inv-guest-phone').innerText = `Телефон: ${inv.guestPhone}`;
  document.getElementById('inv-room-info').innerText = `№ ${inv.roomNumber} (${LABELS.types[inv.roomType] || inv.roomType})`;
  document.getElementById('inv-dates-info').innerText = `${inv.checkInDate} &rarr; ${inv.checkOutDate}`;
  document.getElementById('inv-rate-info').innerText = `${formatRub(inv.pricePerNight)}/сутки (${inv.numberOfNights} ночей)`;
  document.getElementById('inv-charge-total').innerText = formatRub(inv.totalAmount);
  document.getElementById('inv-sum-total').innerText = formatRub(inv.totalAmount);
  document.getElementById('inv-paid-sum').innerText = formatRub(inv.paidAmount);
  document.getElementById('inv-due-sum').innerText = formatRub(inv.balanceDue);
  document.getElementById('inv-status-label').innerText = inv.paymentStatus;

  openModal('modal-folio');
}

// Всплывающие уведомления (Precision Toasts)
function notify(msg, type = 'ok') {
  const rack = document.getElementById('toast-rack');
  if (!rack) return;

  const t = document.createElement('div');
  t.className = `toast ${type === 'ok' ? '' : 'err'}`;
  t.innerText = msg;
  rack.appendChild(t);

  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(24px)';
    setTimeout(() => t.remove(), 250);
  }, 3200);
}

// Обновление числовых счетчиков на вкладках
function updateNavCounts(counts = {}) {
  if (counts.rooms !== undefined) {
    const el = document.getElementById('nav-rooms-badge');
    if (el) el.innerText = counts.rooms;
  }
  if (counts.bookings !== undefined) {
    const el = document.getElementById('nav-bookings-badge');
    if (el) el.innerText = counts.bookings;
  }
  if (counts.guests !== undefined) {
    const el = document.getElementById('nav-guests-badge');
    if (el) el.innerText = counts.guests;
  }
  if (counts.staff !== undefined) {
    const el = document.getElementById('nav-staff-badge');
    if (el) el.innerText = counts.staff;
  }
}

// Инициализация при загрузке документа
window.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  await checkBackendConnection();
  navigateTo('dashboard');
  populateBookingSelects();
  setInterval(checkBackendConnection, 15000);
});
