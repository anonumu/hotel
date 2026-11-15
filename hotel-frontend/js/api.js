// ==========================================================================
// МОДУЛЬ: Сетевой клиент, REST API и глобальное состояние
// ==========================================================================

// ==========================================================================
// ИС «Гостиница» — Клиентская логика и управление интерфейсом
// Студент: Сигналов Владислав Алексеевич (Группа 3 ИС-3)
// Преподаватель: Самсонов Илья Валерьевич
//
// Архитектура: Интерактивный поэтажный план отеля, защита от некорректных действий
// ==========================================================================

const API_BASE = (window.location.protocol === 'http:' || window.location.protocol === 'https:')
  ? `${window.location.origin}/api/v1`
  : 'http://localhost:8080/api/v1';

// Состояние подключения к бэкенду
let isApiOnline = false;
let globalPaymentsCache = [];
let globalStaffCache = [];
let staffFilterMode = 'ALL';
let currentScheduleStaffId = null;

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
    { id: 4, firstName: 'Дмитрий', lastName: 'Морозов', position: 'ACCOUNTANT', email: 'd.morozov@hotel.ru', phone: '+7 (900) 100-01-04', hireDate: '2022-11-01', active: false },
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

// Справочники системы
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

// Экранирование вывода для защиты от XSS
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Детектор попыток XSS / SQL-инъекций при вводе
function hasInjectionPayload(value) {
  if (!value) return false;
  return /(<\s*script\b|<\/\s*script>|javascript\s*:|onerror\s*=|onload\s*=|\bdrop\s+table\b|\btruncate\s+table\b|\bdelete\s+from\b|\bunion\s+select\b|'\s*or\s*'1'\s*=\s*'1|"\s*or\s*"1"\s*=\s*"1)/i.test(String(value));
}

// Безопасное вычисление смещённой даты без RangeError при вводе экстремального числа ночей
function safeAddDaysIso(baseDateStr, days) {
  const numDays = Number(days);
  if (!Number.isFinite(numDays) || numDays < 1 || numDays > 3650) return null;
  const d = baseDateStr ? new Date(baseDateStr) : new Date();
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + numDays);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}


function formatRub(val) {
  return `${(Number(val) || 0).toLocaleString('ru-RU')} ₽`;
}

// Отображение ошибок внутри модальных окон

async function checkBackendConnection(manual = false) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`${API_BASE}/rooms`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      isApiOnline = true;
      syncServerStatus(true);
      if (manual) notify('Связь с сервером Spring Boot установлена');
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
  if (dot) dot.className = `server-pulse-dot ${online ? '' : 'offline'}`;
  if (txt) txt.innerText = online ? '8080 OK' : 'Демо (офлайн)';
}

// Запросы к REST API с защитой от сбоев и активным перехватом критических ошибок / стресс-тестов
async function api(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  if (!checkFloodProtection(method)) {
    throw new Error('Илья Валерьевич, перестаньте насиловать мой проект! Зафиксирован флуд запросами на изменение БД.');
  }

  if (isApiOnline) {
    let res;
    try {
      res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
      });
    } catch (networkError) {
      console.warn('Сервер отключен:', networkError.message);
      isApiOnline = false;
      syncServerStatus(false);
      notify('Сервер отключен: переключено в автономный режим', 'err');
      return mockApi(endpoint, options);
    }

    if (!res.ok) {
      let errorMsg = `Ошибка запроса (${res.status})`;
      let errJson = null;
      try {
        errJson = await res.json();
        if (errJson && errJson.message) errorMsg = errJson.message;
        else if (errJson && errJson.error) errorMsg = errJson.error;
      } catch (_) { }

      const errCode = errJson?.errorCode || '';
      const isStressOrCrash =
        res.status === 418 ||
        res.status === 429 ||
        res.status >= 500 ||
        errCode.startsWith('ERR_SAMSONOV') ||
        errCode.startsWith('ERR_MAX_') ||
        errCode.startsWith('ERR_SECURITY_') ||
        errCode.startsWith('ERR_FLOOR_') ||
        errCode.startsWith('ERR_BOOKING_DURATION') ||
        errCode.startsWith('ERR_CHECKIN_NIGHTS') ||
        errCode.startsWith('ERR_NEGATIVE_') ||
        errCode.startsWith('ERR_INTERNAL_') ||
        (errorMsg && errorMsg.includes('Илья Валерьевич'));

      // Экран защиты срабатывает только при фаззинге, переполнении, инъекции, флуде или системном сбое (500/418/429)
      if (isStressOrCrash) {
        triggerSamsonovStressOverlay({
          code: errCode || `ERR_HTTP_${res.status}_PROTECTION`,
          source: `REST API: ${method} ${endpoint} (HTTP ${res.status})`,
          reason: errorMsg,
          details: errorMsg
        });
      }

      const error = new Error(errorMsg);
      error.status = res.status;
      error.isStress = isStressOrCrash;
      error.data = errJson;
      throw error;
    }

    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  return mockApi(endpoint, options);
}

// Автономное ядро для работы без запущенного бэкенда
function mockApi(endpoint, options = {}) {
  const method = options.method || 'GET';
  const data = options.body ? JSON.parse(options.body) : null;

  // Перехват максимального числа клиентов и сумм в демо-режиме
  if (endpoint.startsWith('/bookings') && method === 'POST' && data) {
    if (data.guestCount > 10 || data.guestCount < 1) {
      triggerSamsonovStressOverlay({
        code: 'ERR_MAX_CLIENTS_TEST_OVERFLOW_418',
        source: 'Демо-режим: Бронирование на ' + data.guestCount + ' гостей',
        reason: 'Попытка забронировать номер на ' + data.guestCount + ' человек (допустимый лимит: 10 гостей).',
        details: 'Илья Валерьевич, даже в автономном демо-режиме система защищена от переполнения буфера постояльцев!'
      });
      throw new Error('Илья Валерьевич, перестаньте насиловать мой проект!');
    }
  }

  if (endpoint.startsWith('/payments') && method === 'POST' && data) {
    if (data.amount > 5000000) {
      triggerSamsonovStressOverlay({
        code: 'ERR_MAX_AMOUNT_TEST_OVERFLOW_418',
        source: 'Демо-режим: Оплата на сумму ' + formatRub(data.amount),
        reason: 'Попытка провести максимальную сумму платежа (' + formatRub(data.amount) + ', лимит: 5 000 000 ₽).',
        details: 'Илья Валерьевич, платежный шлюз отеля отразил запредельную сумму!'
      });
      throw new Error('Илья Валерьевич, перестаньте насиловать мой проект!');
    }
  }

  if (endpoint.startsWith('/rooms') && method === 'POST' && data) {
    if (data.pricePerNight > 1000000) {
      triggerSamsonovStressOverlay({
        code: 'ERR_MAX_PRICE_OVERFLOW_418',
        source: 'Демо-режим: Тариф номера ' + formatRub(data.pricePerNight),
        reason: 'Попытка установить запредельную стоимость номера (' + formatRub(data.pricePerNight) + ').',
        details: 'Илья Валерьевич, такой тариф превышает лимиты гостиницы!'
      });
      throw new Error('Илья Валерьевич, перестаньте насиловать мой проект!');
    }
    if (data.maxGuests > 20) {
      triggerSamsonovStressOverlay({
        code: 'ERR_MAX_ROOM_CAPACITY_OVERFLOW_418',
        source: 'Демо-режим: Вместимость ' + data.maxGuests + ' человек',
        reason: 'Попытка задать нереалистичную вместимость номера (' + data.maxGuests + ' чел.).',
        details: 'Илья Валерьевич, пожарная безопасность отеля не допускает более 20 человек в одном номере!'
      });
      throw new Error('Илья Валерьевич, перестаньте насиловать мой проект!');
    }
  }

  // 1. Номера
  if (endpoint.startsWith('/rooms')) {
    if (endpoint === '/rooms' && method === 'GET') return [...store.rooms];
    if (endpoint === '/rooms' && method === 'POST') {
      const num = (data.roomNumber || '').trim();
      if (!num) throw new Error('Номер комнаты обязателен для заполнения');
      if (store.rooms.some(r => r.roomNumber.toLowerCase() === num.toLowerCase())) {
        throw new Error(`Номер комнаты ${num} уже существует в фонде`);
      }
      if (!data.pricePerNight || Number(data.pricePerNight) <= 0) {
        throw new Error('Стоимость за сутки должна быть строго больше нуля');
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
        if (room) {
          // Защита от дурака: нельзя освободить номер, если в нем кто-то проживает
          if (data.status === 'AVAILABLE') {
            const hasActiveOccupant = store.guests.some(g => g.checkedIn && store.bookings.some(b => b.guestId === g.id && b.roomId === id && b.status === 'CHECKED_IN'));
            if (hasActiveOccupant) {
              throw new Error(`В номере № ${room.roomNumber} сейчас проживает гость. Сначала оформите выселение.`);
            }
          }
          room.status = data.status;
        }
        return room;
      }
      if (method === 'DELETE') {
        if (room && room.status === 'OCCUPIED') {
          throw new Error(`Нельзя удалить номер № ${room.roomNumber}, так как в нём сейчас проживает гость. Сначала оформите выселение в службе приема.`);
        }
        store.bookings = store.bookings.filter(b => b.roomId !== id);
        store.rooms = store.rooms.filter(r => r.id !== id);
        return null;
      }
      return room;
    }
  }

  // 2. Бронирования
  if (endpoint.startsWith('/bookings')) {
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
      if (!room) throw new Error('Номер не найден');
      if (room.status === 'OUT_OF_ORDER') throw new Error(`Номер ${room.roomNumber} находится на ремонте`);

      const guest = store.guests.find(g => g.id === guestId);
      if (!guest) throw new Error('Гость не найден');

      const guestCount = parseInt(data.guestCount) || 1;
      if (guestCount > room.maxGuests) {
        throw new Error(`Количество гостей (${guestCount}) превышает вместимость номера (${room.maxGuests})`);
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

  // 3. Гости и заселение
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

    const checkInMatch = endpoint.match(/\/guests\/(\d+)\/checkin/);
    if (checkInMatch && method === 'POST') {
      const guestId = parseInt(checkInMatch[1]);
      const guest = store.guests.find(g => g.id === guestId);
      if (!guest) throw new Error('Гость не найден');
      if (guest.checkedIn) throw new Error(`Гость ${guest.firstName} ${guest.lastName} уже заселен в номер`);

      const urlObj = new URL('http://dummy.com' + endpoint);
      const roomIdParam = urlObj.searchParams.get('roomId');
      const nightsParam = urlObj.searchParams.get('nights');
      const stayNights = (nightsParam && parseInt(nightsParam) > 0) ? parseInt(nightsParam) : 3;
      const today = new Date().toISOString().split('T')[0];

      if (roomIdParam) {
        const roomId = parseInt(roomIdParam);
        const room = store.rooms.find(r => r.id === roomId);
        if (!room) throw new Error('Номер не найден');
        if (room.status === 'OCCUPIED') throw new Error(`Номер ${room.roomNumber} уже занят другим гостем`);
        if (room.status === 'CLEANING') throw new Error(`Номер ${room.roomNumber} на уборке. Дождитесь завершения.`);
        if (room.status === 'OUT_OF_ORDER') throw new Error(`Номер ${room.roomNumber} находится на ремонте`);

        room.status = 'OCCUPIED';
        guest.checkedIn = true;
        guest.checkInDate = today;

        const outDate = new Date();
        outDate.setDate(new Date().getDate() + stayNights);
        const outDateStr = outDate.toISOString().split('T')[0];
        guest.checkOutDate = outDateStr;

        // Привязываем существующую или создаем новую бронь
        let b = store.bookings.find(x => x.guestId === guestId && (x.status === 'CONFIRMED' || x.status === 'PENDING'));
        if (b) {
          b.roomId = roomId;
          b.status = 'CHECKED_IN';
          b.checkInDate = today;
          b.checkOutDate = outDateStr;
          b.totalPrice = room.pricePerNight * stayNights;
        } else {
          store.bookings.push({
            id: Date.now(),
            roomId: roomId,
            guestId: guestId,
            checkInDate: today,
            checkOutDate: outDateStr,
            status: 'CHECKED_IN',
            totalPrice: room.pricePerNight * stayNights,
            guestCount: Math.min(2, room.maxGuests),
            createdAt: new Date().toISOString()
          });
        }
        return guest;
      }

      // Если roomId не передан, ищем бронь
      let b = store.bookings.find(x => x.guestId === guestId && (x.status === 'CONFIRMED' || x.status === 'PENDING'));
      if (b) {
        const room = store.rooms.find(r => r.id === b.roomId);
        if (room && room.status === 'OUT_OF_ORDER') throw new Error(`Номер ${room.roomNumber} на ремонте`);
        if (room) room.status = 'OCCUPIED';
        b.status = 'CHECKED_IN';
        guest.checkedIn = true;
        guest.checkInDate = today;
        guest.checkOutDate = b.checkOutDate;
        return guest;
      } else {
        throw new Error(`У гостя ${guest.firstName} ${guest.lastName} нет активной брони. Выберите свободный номер.`);
      }
    }

    const checkOutMatch = endpoint.match(/\/guests\/(\d+)\/checkout/);
    if (checkOutMatch && method === 'POST') {
      const guestId = parseInt(checkOutMatch[1]);
      const guest = store.guests.find(g => g.id === guestId);
      if (!guest) throw new Error('Гость не найден');
      if (!guest.checkedIn) throw new Error(`Гость ${guest.firstName} ${guest.lastName} не заселен`);

      guest.checkedIn = false;
      guest.checkOutDate = new Date().toISOString().split('T')[0];

      const b = store.bookings.find(x => x.guestId === guestId && x.status === 'CHECKED_IN');
      if (b) {
        b.status = 'CHECKED_OUT';
        const r = store.rooms.find(x => x.id === b.roomId);
        if (r) r.status = 'CLEANING';
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
        active: data.active !== undefined ? Boolean(data.active) : true
      };
      store.staff.push(s);
      return s;
    }
    const match = endpoint.match(/\/staff\/(\d+)/);
    if (match) {
      const id = parseInt(match[1]);
      const member = store.staff.find(s => s.id === id);
      if (endpoint.endsWith('/status') && method === 'PATCH') {
        if (member) member.active = Boolean(data.active);
        return member;
      }
      if (endpoint.endsWith('/schedule')) {
        return {
          staffId: id,
          fullName: member ? `${member.firstName} ${member.lastName}` : 'Сотрудник',
          position: member ? member.position : 'RECEPTIONIST',
          shiftHours: '08:00 — 20:00',
          workSchedule: '2/2 (Дневная смена)',
          assignedFloor: member && member.position === 'MAID' ? '1-й и 2-й этажи' : 'Главный холл / Ресепшн',
          status: member && member.active ? 'На смене' : 'Выходной'
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

  // 7. Счёт (Invoice)
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

  // 8. Отчеты
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

  if (endpoint === '/reports/guests') {
    const currentlyCheckedIn = store.guests.filter(g => g.checkedIn).length;
    const byNat = {};
    store.guests.forEach(g => {
      const n = g.nationality || 'Не указано';
      byNat[n] = (byNat[n] || 0) + 1;
    });
    return {
      totalGuests: store.guests.length,
      currentlyCheckedIn,
      totalBookings: store.bookings.length,
      guestsByNationality: byNat
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

  if (endpoint === '/system/reset-demo') {
    location.reload();
    return { status: 'OK' };
  }

  return null;
}


function notify(msg, type = 'ok') {
  const rack = document.getElementById('toast-rack');
  if (!rack) return;

  const t = document.createElement('div');
  t.className = `toast ${type === 'ok' ? '' : 'err'}`;
  t.innerText = msg;
  rack.appendChild(t);

  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(10px)';
    setTimeout(() => t.remove(), 250);
  }, 3200);
}

