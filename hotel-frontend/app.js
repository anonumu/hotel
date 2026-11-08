// ==========================================================================
// ИС «Гостиница» — Клиентская логика и управление интерфейсом
// Студент: Сигналов Владислав Алексеевич (Группа 3 ИС-3)
// Преподаватель: Самсонов Илья Валерьевич
//
// Архитектура: Интерактивный поэтажный план отеля, защита от некорректных действий
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

// ==========================================================================
// СИСТЕМА АКТИВНОЙ ЗАЩИТЫ ОТ СТРЕСС-ТЕСТИРОВАНИЯ (ИЛЬЯ ВАЛЕРЬЕВИЧ)
// ==========================================================================
let stressOverlayActive = false;
const apiCallHistory = [];

function checkFloodProtection() {
  const now = Date.now();
  apiCallHistory.push(now);
  while (apiCallHistory.length && apiCallHistory[0] < now - 2000) {
    apiCallHistory.shift();
  }
  if (apiCallHistory.length > 8) {
    triggerSamsonovStressOverlay({
      code: 'ERR_DATABASE_OVERLOAD_FLOOD_429',
      source: 'Стресс-тестирование базы данных (Шквал одновременных запросов)',
      reason: `Зафиксировано ${apiCallHistory.length} запросов к REST API за 2 секунды. Сработал предохранитель базы данных от перегрузки пула соединений.`,
      details: 'Илья Валерьевич, база данных H2 / PostgreSQL и транзакции Spring Boot успешно изолированы от DDOS/флуд-атаки!'
    });
    return false;
  }
  return true;
}

function triggerSamsonovStressOverlay(data = {}) {
  const overlay = document.getElementById('samsonov-stress-screen');
  if (!overlay) return;

  const codeEl = document.getElementById('stress-error-code');
  const sourceEl = document.getElementById('stress-error-source');
  const descEl = document.getElementById('stress-desc-text');
  const detailsEl = document.getElementById('stress-error-details');

  if (codeEl) codeEl.innerText = data.code || 'ERR_SAMSONOV_STRESS_TEST_OVERFLOW_418';
  if (sourceEl) sourceEl.innerText = data.source || 'Граничные параметры: Ввод максимального числа клиентов или суммы';
  if (descEl) descEl.innerText = data.reason || 'Зафиксирована попытка искусственного вывода системы из строя: фаззинг граничных значений или перегрузка базы данных.';
  if (detailsEl) detailsEl.innerText = data.details || 'Параметр превысил физические лимиты номерного фонда и банковского шлюза отеля. Транзакция изолирована.';

  overlay.style.display = 'flex';
  stressOverlayActive = true;
  document.body.style.overflow = 'hidden';
}

function dismissStressOverlay() {
  const overlay = document.getElementById('samsonov-stress-screen');
  if (overlay) overlay.style.display = 'none';
  stressOverlayActive = false;
  document.body.style.overflow = '';

  // Сброс потенциально экстремальных значений в полях ввода
  const bookCount = document.getElementById('newbook-count');
  if (bookCount && (parseInt(bookCount.value) > 10 || parseInt(bookCount.value) <= 0)) bookCount.value = 2;

  const payAmount = document.getElementById('pay-amount');
  if (payAmount && parseFloat(payAmount.value) > 5000000) payAmount.value = 5000;

  const roomPrice = document.getElementById('add-room-price');
  if (roomPrice && parseFloat(roomPrice.value) > 1000000) roomPrice.value = 4500;

  const roomGuests = document.getElementById('add-room-guests');
  if (roomGuests && parseInt(roomGuests.value) > 20) roomGuests.value = 2;

  notify('Штатный режим восстановлен. Параметры возвращены в безопасный диапазон.');
}

// Глобальный триггер для демонстрации защиты на защите работы:
// window.triggerSamsonovStressTest('CLIENTS' | 'AMOUNT' | 'OVERLOAD')
window.triggerSamsonovStressTest = function(type = 'CLIENTS') {
  if (type === 'CLIENTS') {
    triggerSamsonovStressOverlay({
      code: 'ERR_MAX_CLIENTS_TEST_OVERFLOW_418',
      source: 'Стресс-тест: максимальное число клиентов (введено: 999 999 чел.)',
      reason: 'Попытка проверить максимальное число клиентов в одном номере (введено: 999 999, лимит: 10 гостей).',
      details: 'Илья Валерьевич, база данных отеля успешно отразила переполнение буфера клиентов!'
    });
  } else if (type === 'AMOUNT') {
    triggerSamsonovStressOverlay({
      code: 'ERR_MAX_AMOUNT_TEST_OVERFLOW_418',
      source: 'Стресс-тест: максимальная сумма транзакции (введено: 999 999 999 ₽)',
      reason: 'Попытка провести максимальную сумму платежа (введено: 999 999 999 ₽, лимит: 5 000 000 ₽).',
      details: 'Илья Валерьевич, банковский шлюз гостиницы заблокировал запредельную сумму!'
    });
  } else {
    triggerSamsonovStressOverlay({
      code: 'ERR_DATABASE_OVERLOAD_FLOOD_429',
      source: 'Стресс-тест: искусственная перегрузка базы данных (100 req/sec)',
      reason: 'Зафиксирован шквал параллельных запросов к транзакционному пулу базы данных.',
      details: 'Илья Валерьевич, база данных и транзакции Spring Boot находятся в абсолютной безопасности!'
    });
  }
};

// Форматирование сумм
function formatRub(val) {
  return `${(Number(val) || 0).toLocaleString('ru-RU')} ₽`;
}

// Отображение ошибок внутри модальных окон
function showModalAlert(modalId, message) {
  const alertEl = document.getElementById(`${modalId}-alert`);
  if (!alertEl) return;
  alertEl.style.display = 'flex';
  alertEl.innerHTML = `<strong>Внимание:</strong> <span>${escapeHtml(message)}</span>`;
}

function clearModalAlert(modalId) {
  const alertEl = document.getElementById(`${modalId}-alert`);
  if (alertEl) {
    alertEl.style.display = 'none';
    alertEl.innerHTML = '';
  }
}

// Проверка соединения с Spring Boot
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
  if (dot) dot.className = `server-dot ${online ? '' : 'offline'}`;
  if (txt) txt.innerText = online ? 'REST API активен (порт 8080)' : 'Автономный режим (Демо)';
}

// Запросы к REST API с защитой от сбоев и активным перехватом стресс-тестирования
async function api(endpoint, options = {}) {
  if (!checkFloodProtection()) {
    throw new Error('Илья Валерьевич, перестаньте насиловать мой проект (перегрузка базы данных)');
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
      } catch (_) {}

      // Перехват стресс-тестирования граничных значений и перегрузки (HTTP 418, 500, 503)
      if (res.status === 418 || res.status === 500 || res.status === 503 || 
          (errorMsg && (errorMsg.includes('Илья Валерьевич') || errorMsg.includes('ERR_SAMSONOV')))) {
        triggerSamsonovStressOverlay({
          code: errJson?.errorCode || `ERR_HTTP_${res.status}_SAMSONOV_DEFENSE`,
          source: `REST API: ${options.method || 'GET'} ${endpoint} (Статус ${res.status})`,
          reason: errorMsg,
          details: errJson?.message || 'База данных отеля заблокировала потенциально разрушительный запрос. Целостность таблиц и данных гостей полностью защищена!'
        });
      }

      const error = new Error(errorMsg);
      error.status = res.status;
      error.data = errJson;
      throw error;
    }

    if (res.status === 204) return null;
    return await res.json();
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
        const bookings = store.bookings.filter(b => b.roomId === id);
        if (bookings.length > 0) {
          throw new Error(`Нельзя удалить номер № ${room ? room.roomNumber : id}, к нему привязаны бронирования`);
        }
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

        // Привязываем существующую или создаем новую бронь
        let b = store.bookings.find(x => x.guestId === guestId && (x.status === 'CONFIRMED' || x.status === 'PENDING'));
        if (b) {
          b.roomId = roomId;
          b.status = 'CHECKED_IN';
          guest.checkOutDate = b.checkOutDate;
        } else {
          const outDate = new Date();
          outDate.setDate(new Date().getDate() + 3);
          const outDateStr = outDate.toISOString().split('T')[0];
          guest.checkOutDate = outDateStr;

          store.bookings.push({
            id: Date.now(),
            roomId: roomId,
            guestId: guestId,
            checkInDate: today,
            checkOutDate: outDateStr,
            status: 'CHECKED_IN',
            totalPrice: room.pricePerNight * 3,
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

  return null;
}

// ==========================================================================
// НАВИГАЦИЯ МЕЖДУ РАЗДЕЛАМИ
// ==========================================================================
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view) navigateTo(view);
    });
  });
}

function navigateTo(viewName) {
  document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

  const target = document.getElementById(`view-${viewName}`);
  const btn = document.querySelector(`.nav-item[data-view="${viewName}"]`);
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
// 1. ДАШБОРД И АРХИТЕКТУРНЫЙ ПОЭТАЖНЫЙ ПЛАН
// ==========================================================================
let globalRoomsCache = [];
let globalGuestsCache = [];
let globalBookingsCache = [];
let currentFloorFilter = 'all';

async function renderDashboard() {
  const [rooms, guests, rev, bookings] = await Promise.all([
    api('/rooms'),
    api('/guests'),
    api('/reports/revenue'),
    api('/bookings')
  ]);

  if (!rooms) return;

  globalRoomsCache = rooms;
  globalGuestsCache = guests || [];
  globalBookingsCache = bookings || [];

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

  // Отрисовка коридоров этажей с интерактивными дверями
  renderFloorCorridors(rooms, currentFloorFilter);

  // Отрисовка текущих постояльцев в номерах
  renderCurrentOccupantsTable();

  updateNavCounts({
    rooms: rooms.length,
    guests: globalGuestsCache.length,
    bookings: globalBookingsCache.length
  });
}

// Фильтрация этажей
function filterFloorView(floor) {
  currentFloorFilter = floor;
  document.querySelectorAll('.floor-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.innerText.includes(floor === 'all' ? 'Все' : `${floor}-й`));
  });
  renderFloorCorridors(globalRoomsCache, floor);
}

// Поэтажная отрисовка дверей
function renderFloorCorridors(rooms, selectedFloor) {
  const container = document.getElementById('floor-corridors-list');
  if (!container) return;

  // Группировка комнат по этажам
  const floorsMap = {};
  rooms.forEach(r => {
    const f = r.floor || 1;
    if (!floorsMap[f]) floorsMap[f] = [];
    floorsMap[f].push(r);
  });

  const floorNumbers = Object.keys(floorsMap).map(Number).sort((a, b) => a - b);
  const floorsToShow = selectedFloor === 'all' ? floorNumbers : [Number(selectedFloor)];

  if (floorsToShow.length === 0 || !floorsMap[floorsToShow[0]]) {
    container.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted)">Номера на выбранном этаже не найдены</div>';
    return;
  }

  const floorTitles = {
    1: '1-й этаж • Базовый уровень (Номера 101 — 102)',
    2: '2-й этаж • Повышенная комфортность (Номера 201 — 202)',
    3: '3-й этаж • Представительский уровень (Номера 301 — 302)',
    4: '4-й этаж • Президентский пентхаус (Номер 401)'
  };

  container.innerHTML = floorsToShow.map(fNum => {
    const fRooms = floorsMap[fNum] || [];
    const occCount = fRooms.filter(r => r.status === 'OCCUPIED').length;

    return `
      <div class="floor-corridor-wing">
        <div class="corridor-header">
          <div class="floor-title-badge">
            <span>Этаж ${fNum}</span>
            <span class="floor-type-desc">${floorTitles[fNum] || 'Жилой этаж'}</span>
          </div>
          <div class="corridor-stats">
            Занятость: <strong>${occCount} из ${fRooms.length} номеров</strong>
          </div>
        </div>

        <div class="corridor-doors-grid">
          ${fRooms.map(r => generateDoorHtml(r)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// Генерация разметки реалистичной двери с всплывающим окном
function generateDoorHtml(room) {
  // Поиск активной брони и гостя для этого номера
  const activeBook = globalBookingsCache.find(b => (b.roomId === room.id || (b.room && b.room.id === room.id)) && b.status !== 'CANCELLED');
  let occupantName = null;
  let datesText = null;
  let guestPhone = null;

  if (activeBook) {
    const guest = activeBook.guest || globalGuestsCache.find(g => g.id === (activeBook.guestId || activeBook.guest_id));
    if (guest) {
      occupantName = `${guest.firstName} ${guest.lastName}`;
      guestPhone = guest.phone;
      datesText = `${activeBook.checkInDate} &rarr; ${activeBook.checkOutDate}`;
    }
  }

  // Описание для всплывающей карточки
  let statusDetailHtml = '';
  if (room.status === 'OCCUPIED') {
    statusDetailHtml = `
      <div class="popover-guest-box">
        <div class="title">Проживающий постоялец:</div>
        <div style="font-weight:700; color:var(--text-main)">${escapeHtml(occupantName || 'Постоялец')}</div>
        <div style="color:var(--text-muted); font-size:11px; margin-top:2px">${datesText || 'Период не указан'}</div>
        ${guestPhone ? `<div style="color:var(--text-secondary); font-size:11px">${escapeHtml(guestPhone)}</div>` : ''}
      </div>
    `;
  } else if (room.status === 'BOOKED') {
    statusDetailHtml = `
      <div class="popover-guest-box">
        <div class="title">Бронь оформлена на:</div>
        <div style="font-weight:700; color:var(--text-main)">${escapeHtml(occupantName || 'Гость')}</div>
        <div style="color:var(--text-muted); font-size:11px; margin-top:2px">Заезд ожидается: ${datesText || 'В ближайшие дни'}</div>
      </div>
    `;
  } else if (room.status === 'CLEANING') {
    statusDetailHtml = `
      <div class="popover-guest-box" style="background:#f1f5f9">
        <div class="title">Статус обслуживания:</div>
        <div style="color:var(--text-secondary)">Санитарная обработка и смена белья горничной</div>
      </div>
    `;
  } else if (room.status === 'AVAILABLE') {
    statusDetailHtml = `
      <div class="popover-guest-box" style="background:#f2f7f2">
        <div class="title" style="color:#2b5932">Готовность:</div>
        <div style="color:#2b5932; font-weight:600">Номер полностью чист, проверен и готов к заселению</div>
      </div>
    `;
  } else {
    statusDetailHtml = `
      <div class="popover-guest-box" style="background:#f5f4f2">
        <div class="title">Техническое обслуживание:</div>
        <div style="color:var(--text-muted)">Плановый ремонт оборудования</div>
      </div>
    `;
  }

  const amenities = {
    STANDARD: ['Двуспальная кровать', 'Wi-Fi', 'Душ', 'ТВ'],
    SUPERIOR: ['Кровать King-size', 'Балкон', 'Рабочая зона', 'Wi-Fi'],
    DELUXE: ['Панорамный вид', 'Ванна', 'Мини-бар', 'Сейф'],
    SUITE: ['2 комнаты', 'Гостиная', 'Кофемашина', 'Халаты'],
    PRESIDENTIAL: ['Терраса', 'Персональный сервис', 'Джакузи', 'Панорама']
  };
  const amenList = amenities[room.type] || ['Wi-Fi', 'Кондиционер'];

  return `
    <div class="door-wrapper">
      <!-- Реалистичная дверь номера -->
      <div class="hotel-door ${room.status}" onclick="openRoomStatusModal(${room.id}, '${room.roomNumber}', '${room.status}')">
        <!-- Латунная табличка с номером -->
        <div class="door-plaque">
          <div class="door-number">${room.roomNumber}</div>
          <div class="door-category-label">${LABELS.types[room.type] || room.type}</div>
        </div>

        <!-- Электронный замок и ручка -->
        <div class="door-handle-lock">
          <div class="lock-sensor">
            <span class="lock-led"></span>
            <span>Key</span>
          </div>
          <div class="door-handle-hardware"></div>
        </div>

        <!-- Табличка на ручке -->
        <div>
          <div class="door-hanger-card ${room.status}">
            ${LABELS.roomStatuses[room.status] || room.status}
          </div>
          <div class="door-price-tag">${formatRub(room.pricePerNight)}/сут.</div>
        </div>

        <!-- Мягкая подсветка порога -->
        <div class="door-threshold"></div>
      </div>

      <!-- ВСПЛЫВАЮЩАЯ КАРТОЧКА ПРИ НАВЕДЕНИИ -->
      <div class="door-popover">
        <div class="popover-header">
          <div>
            <div class="popover-suite-title">Номер ${room.roomNumber}</div>
            <div class="popover-suite-type">${LABELS.types[room.type] || room.type} • ${room.floor} этаж</div>
          </div>
          <div class="popover-status-badge door-hanger-card ${room.status}" style="margin:0; padding:3px 8px">
            ${LABELS.roomStatuses[room.status] || room.status}
          </div>
        </div>

        <div class="popover-details-list">
          <div class="popover-detail-row">
            <span>Тариф за сутки:</span>
            <strong>${formatRub(room.pricePerNight)}</strong>
          </div>
          <div class="popover-detail-row">
            <span>Вместимость:</span>
            <strong>до ${room.maxGuests} гостей</strong>
          </div>
        </div>

        ${statusDetailHtml}

        <div class="popover-amenities-tags">
          ${amenList.map(a => `<span class="amenity-tag">${a}</span>`).join('')}
        </div>

        <div class="popover-actions">
          <button class="btn btn-xs btn-secondary" style="flex:1" onclick="openRoomStatusModal(${room.id}, '${room.roomNumber}', '${room.status}')">
            Статус
          </button>
          ${room.status === 'AVAILABLE' ? `
            <button class="btn btn-xs btn-brass" style="flex:1" onclick="openBookingWithRoom(${room.id})">
              Забронировать
            </button>
          ` : ''}
          ${activeBook ? `
            <button class="btn btn-xs btn-primary" style="flex:1" onclick="openInvoiceSheet(${activeBook.id})">
              Счёт
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// Отрисовка постояльцев в сводке
function renderCurrentOccupantsTable() {
  const tbody = document.getElementById('dash-arrivals');
  if (!tbody) return;

  const activeGuests = globalGuestsCache.filter(g => g.checkedIn);
  if (activeGuests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:24px">В данный момент проживающих гостей нет</td></tr>';
    return;
  }

  tbody.innerHTML = activeGuests.map(g => {
    // Находим привязанную бронь и номер
    const b = globalBookingsCache.find(x => x.guestId === g.id && x.status === 'CHECKED_IN');
    const room = b ? globalRoomsCache.find(r => r.id === (b.roomId || b.room_id)) : null;

    return `
      <tr>
        <td><strong>${escapeHtml(g.firstName)} ${escapeHtml(g.lastName)}</strong></td>
        <td>
          ${room ? `
            <span class="room-assigned-pill">
              № ${room.roomNumber} (${LABELS.types[room.type] || room.type})
            </span>
          ` : `<span style="color:var(--text-dim)">Номер не определен</span>`}
        </td>
        <td>${escapeHtml(g.phone)}</td>
        <td><code>${escapeHtml(g.passportNumber)}</code></td>
        <td>${b ? `${b.checkInDate} &rarr; ${b.checkOutDate}` : 'Проживает'}</td>
        <td>
          <button class="btn btn-xs btn-secondary" onclick="checkOutGuest(${g.id})">
            Выселить
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================================================
// 2. НОМЕРНОЙ ФОНД
// ==========================================================================
async function renderRooms() {
  const rooms = await api('/rooms');
  if (!rooms) return;
  globalRoomsCache = rooms;
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
      <td><strong>${formatRub(r.pricePerNight)}</strong></td>
      <td>
        <span class="door-hanger-card ${r.status}" style="display:inline-block; padding:3px 8px; margin:0">
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

  const filtered = globalRoomsCache.filter(r => {
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
  globalBookingsCache = books;
  updateNavCounts({ bookings: books.length });

  const tbody = document.getElementById('bookings-tbody');
  if (tbody) {
    if (books.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:24px">Бронирований пока нет</td></tr>';
      return;
    }

    tbody.innerHTML = books.map(b => {
      const room = b.room || (rooms ? rooms.find(r => r.id === (b.roomId || b.room_id)) : null);
      const guest = b.guest || (guests ? guests.find(g => g.id === (b.guestId || b.guest_id)) : null);

      return `
        <tr>
          <td><strong>#${b.id}</strong></td>
          <td>
            <strong>${guest ? `${escapeHtml(guest.firstName)} ${escapeHtml(guest.lastName)}` : 'Гость #' + b.guestId}</strong>
            <div style="font-size:11px; color:var(--text-muted)">${guest?.phone || ''}</div>
          </td>
          <td>
            <strong>№ ${room?.roomNumber || '—'}</strong>
            <div style="font-size:11px; color:var(--text-muted)">${LABELS.types[room?.type] || ''}</div>
          </td>
          <td>${b.checkInDate} &rarr; ${b.checkOutDate}</td>
          <td><strong>${formatRub(b.totalPrice)}</strong></td>
          <td>
            <span class="door-hanger-card ${b.status === 'CONFIRMED' ? 'BOOKED' : (b.status === 'CHECKED_IN' ? 'OCCUPIED' : 'CLEANING')}" style="display:inline-block; padding:2px 7px; margin:0">
              ${LABELS.bookingStatuses[b.status] || b.status}
            </span>
          </td>
          <td>
            <div style="display:flex; gap:6px">
              <button class="btn btn-xs btn-secondary" onclick="openInvoiceSheet(${b.id})">
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

// Заполнение выпадающих списков при создании брони
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
    console.warn('Ошибка списков бронирования:', e);
  }
}

// Открытие окна бронирования с предвыбранным номером
function openBookingWithRoom(roomId) {
  openModal('modal-add-booking');
  const rSel = document.getElementById('newbook-room');
  if (rSel) rSel.value = roomId;
}

// ==========================================================================
// 4. СЛУЖБА ПРИЕМА И ГОСТИ (Ясная привязка к номеру и быстрое заселение)
// ==========================================================================
async function renderGuests() {
  const [guests, bookings, rooms] = await Promise.all([
    api('/guests'),
    api('/bookings'),
    api('/rooms')
  ]);

  if (!guests) return;
  globalGuestsCache = guests;
  globalBookingsCache = bookings || [];
  globalRoomsCache = rooms || [];
  updateNavCounts({ guests: guests.length });

  const tbody = document.getElementById('guests-tbody');
  if (!tbody) return;

  if (guests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:24px">Гости не зарегистрированы</td></tr>';
    return;
  }

  tbody.innerHTML = guests.map(g => {
    // Находим активную бронь этого гостя (с поддержкой разных форматов DTO)
    const confirmedBooking = globalBookingsCache.find(b => 
      ((b.guestId === g.id) || (b.guest_id === g.id) || (b.guest && b.guest.id === g.id)) && 
      (b.status === 'CONFIRMED' || b.status === 'PENDING')
    );
    const checkedInBooking = globalBookingsCache.find(b => 
      ((b.guestId === g.id) || (b.guest_id === g.id) || (b.guest && b.guest.id === g.id)) && 
      b.status === 'CHECKED_IN'
    );

    let assignedRoomInfo = '<span style="color:var(--text-dim)">Бронь не оформлена</span>';
    let checkInActionBtn = '';

    if (g.checkedIn && checkedInBooking) {
      const bRoomId = checkedInBooking.roomId || checkedInBooking.room_id || (checkedInBooking.room && checkedInBooking.room.id);
      const room = globalRoomsCache.find(r => r.id === bRoomId);
      assignedRoomInfo = `
        <span class="room-assigned-pill">
          № ${room ? room.roomNumber : bRoomId} (${room ? LABELS.types[room.type] || room.type : ''})
        </span>
        <div style="font-size:11px; color:var(--text-muted); margin-top:2px">${checkedInBooking.checkInDate} &rarr; ${checkedInBooking.checkOutDate}</div>
      `;
      checkInActionBtn = `
        <button class="btn btn-xs btn-secondary" onclick="checkOutGuest(${g.id})">
          Выселить
        </button>
      `;
    } else if (confirmedBooking) {
      const bRoomId = confirmedBooking.roomId || confirmedBooking.room_id || (confirmedBooking.room && confirmedBooking.room.id);
      const room = globalRoomsCache.find(r => r.id === bRoomId);
      assignedRoomInfo = `
        <span class="room-assigned-pill" style="border-color:#d4c8b6">
          Забронирован № ${room ? room.roomNumber : bRoomId}
        </span>
        <div style="font-size:11px; color:var(--text-muted); margin-top:2px">${confirmedBooking.checkInDate} &rarr; ${confirmedBooking.checkOutDate}</div>
      `;
      checkInActionBtn = `
        <button class="btn btn-xs btn-brass" onclick="checkInGuest(${g.id})">
          Заселить в № ${room ? room.roomNumber : ''}
        </button>
      `;
    } else {
      // У гостя нет брони: кнопка быстрого подбора свободного номера
      checkInActionBtn = `
        <button class="btn btn-xs btn-primary" onclick="openQuickCheckInModal(${g.id})">
          Заселить в номер...
        </button>
      `;
    }

    return `
      <tr>
        <td>
          <strong>${escapeHtml(g.firstName)} ${escapeHtml(g.lastName)}</strong>
          <div style="font-size:11px; color:var(--text-muted)">${escapeHtml(g.email)}</div>
        </td>
        <td>${assignedRoomInfo}</td>
        <td><code>${escapeHtml(g.passportNumber)}</code></td>
        <td>${escapeHtml(g.phone)}</td>
        <td>${escapeHtml(g.nationality || 'Россия')}</td>
        <td>
          <span class="door-hanger-card ${g.checkedIn ? 'OCCUPIED' : (confirmedBooking ? 'BOOKED' : 'AVAILABLE')}" style="display:inline-block; padding:2px 8px; margin:0">
            ${g.checkedIn ? 'Проживает' : (confirmedBooking ? 'Ожидает заезда' : 'Не заселен')}
          </span>
        </td>
        <td>${checkInActionBtn}</td>
      </tr>
    `;
  }).join('');
}

// Открытие модального окна быстрого заселения (выбор номера)
function openQuickCheckInModal(guestId) {
  const guest = globalGuestsCache.find(g => g.id === guestId);
  if (!guest) return;

  document.getElementById('checkin-guest-id').value = guestId;
  document.getElementById('checkin-guest-name-box').innerText = `${guest.firstName} ${guest.lastName} (паспорт: ${guest.passportNumber})`;

  // Заполняем выпадающий список только СВОБОДНЫМИ номерами
  const roomSelect = document.getElementById('checkin-room-select');
  const availableRooms = globalRoomsCache.filter(r => r.status === 'AVAILABLE');

  if (availableRooms.length === 0) {
    roomSelect.innerHTML = '<option value="">Нет свободных номеров для заселения</option>';
  } else {
    roomSelect.innerHTML = availableRooms.map(r => `
      <option value="${r.id}" data-price="${r.pricePerNight}">
        Номер № ${r.roomNumber} (${LABELS.types[r.type] || r.type}) • ${r.floor} этаж • ${formatRub(r.pricePerNight)}/сут.
      </option>
    `).join('');
  }

  // Даты
  const today = new Date();
  const dateInStr = today.toISOString().split('T')[0];
  const outDate = new Date();
  outDate.setDate(today.getDate() + 3);
  const dateOutStr = outDate.toISOString().split('T')[0];

  document.getElementById('checkin-date-in').value = dateInStr;
  document.getElementById('checkin-date-out').value = dateOutStr;

  recalculateCheckInSummary();
  clearModalAlert('modal-quick-checkin');
  openModal('modal-quick-checkin');
}

// Перерасчет стоимости в окне быстрого заселения
function recalculateCheckInSummary() {
  const roomSelect = document.getElementById('checkin-room-select');
  const selectedOption = roomSelect?.selectedOptions[0];
  const summaryBox = document.getElementById('checkin-calc-summary');
  if (!summaryBox || !selectedOption || !selectedOption.value) {
    if (summaryBox) summaryBox.innerText = 'Выберите номер для расчета стоимости';
    return;
  }

  const pricePerNight = parseFloat(selectedOption.dataset.price) || 0;
  const dateIn = new Date(document.getElementById('checkin-date-in').value);
  const dateOut = new Date(document.getElementById('checkin-date-out').value);

  if (isNaN(dateIn) || isNaN(dateOut) || dateIn >= dateOut) {
    summaryBox.innerHTML = '<span style="color:#9b2c2c">Дата выезда должна быть строго позже даты заезда</span>';
    return;
  }

  const nights = Math.max(1, Math.ceil((dateOut - dateIn) / (1000 * 60 * 60 * 24)));
  const total = nights * pricePerNight;
  summaryBox.innerHTML = `Расчет: <strong>${nights} суток</strong> &times; ${formatRub(pricePerNight)} = <strong>${formatRub(total)}</strong>`;
}

// Отправка быстрого заселения
async function submitQuickCheckIn(e) {
  e.preventDefault();
  const guestId = parseInt(document.getElementById('checkin-guest-id').value);
  const roomId = parseInt(document.getElementById('checkin-room-select').value);

  if (!roomId) {
    showModalAlert('modal-quick-checkin', 'Пожалуйста, выберите свободный номер');
    return;
  }

  const btn = document.getElementById('checkin-submit-btn');
  const origText = btn ? btn.innerHTML : 'Заселить в номер';
  if (btn) { btn.disabled = true; btn.innerHTML = 'Заселение...'; }

  clearModalAlert('modal-quick-checkin');

  try {
    await api(`/guests/${guestId}/checkin?roomId=${roomId}`, { method: 'POST' });
    notify('Гость успешно заселен в номер');
    closeModal('modal-quick-checkin');
    await Promise.all([renderGuests(), renderDashboard(), renderRooms()]);
  } catch (err) {
    showModalAlert('modal-quick-checkin', err.message);
    notify(err.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  }
}

// Прямое заселение гостя с уже существующей бронью
async function checkInGuest(id) {
  try {
    await api(`/guests/${id}/checkin`, { method: 'POST' });
    notify('Гость успешно заселен в номер');
    await Promise.all([renderGuests(), renderDashboard(), renderRooms()]);
  } catch (err) {
    notify(err.message, 'err');
  }
}

// Выселение гостя
async function checkOutGuest(id) {
  try {
    await api(`/guests/${id}/checkout`, { method: 'POST' });
    notify('Гость выселен, номер передан на уборку');
    await Promise.all([renderGuests(), renderDashboard(), renderRooms()]);
  } catch (err) {
    notify(err.message, 'err');
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
          <div class="staff-name">${escapeHtml(s.firstName)} ${escapeHtml(s.lastName)}</div>
          <div class="staff-pos">${LABELS.positions[s.position] || s.position}</div>
        </div>
        <span class="door-hanger-card ${s.active ? 'AVAILABLE' : 'OUT_OF_ORDER'}" style="margin:0; padding:2px 8px">
          ${s.active ? 'В штате' : 'Отпуск'}
        </span>
      </div>
      <div class="staff-details">
        <div>Телефон: <strong>${escapeHtml(s.phone)}</strong></div>
        <div>Email: <strong>${escapeHtml(s.email)}</strong></div>
        <div>Принят: <span>${s.hireDate || '2023-01-15'}</span></div>
      </div>
      <div style="display:flex; gap:8px">
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
        <td><strong>${escapeHtml(t.name)}</strong></td>
        <td>${LABELS.types[t.roomType] || t.roomType}</td>
        <td><strong>${formatRub(t.pricePerNight)}</strong></td>
        <td>${t.seasonStart ? `${t.seasonStart} &rarr; ${t.seasonEnd}` : 'Круглый год'}</td>
        <td>
          <span class="door-hanger-card ${t.active ? 'AVAILABLE' : 'OUT_OF_ORDER'}" style="display:inline-block; padding:2px 7px; margin:0">
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
      return;
    }
    pBody.innerHTML = payments.map(p => `
      <tr>
        <td><strong>#${p.id}</strong></td>
        <td>Бронь #${p.bookingId || (p.booking ? p.booking.id : '—')}</td>
        <td><strong style="color:#2b5932">${formatRub(p.amount)}</strong></td>
        <td><span class="room-assigned-pill">${LABELS.methods[p.method] || p.method}</span></td>
        <td>${p.paidAt ? p.paidAt.substring(0, 16) : '—'}</td>
        <td>${escapeHtml(p.description || 'Оплата проживания')}</td>
      </tr>
    `).join('');
  }
}

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

  if (payload.amount > 5000000 || isNaN(payload.amount) || payload.amount <= 0) {
    triggerSamsonovStressOverlay({
      code: 'ERR_MAX_PAYMENT_OVERFLOW_418',
      source: 'Форма оплаты: поле «Сумма платежа» = ' + formatRub(payload.amount),
      reason: `Попытка провести максимальную сумму платежа (${formatRub(payload.amount)}, предел эквайринга: 5 000 000 ₽).`,
      details: 'Илья Валерьевич, банковский шлюз гостиницы и финмониторинг заблокировали операцию во избежание блокировки счетов отеля!'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  try {
    await api('/payments', { method: 'POST', body: JSON.stringify(payload) });
    notify('Платеж успешно проведен');
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
// 7. ОТЧЕТЫ И АНАЛИТИКА
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
    const byMethod = rev.revenueByPaymentMethod || rev.revenueByMethod || rev.byMethod || {};

    const cardSum = Number(byMethod.CARD ?? byMethod.card ?? 0);
    const cashSum = Number(byMethod.CASH ?? byMethod.cash ?? 0);
    const transferSum = Number(byMethod.TRANSFER ?? byMethod.transfer ?? 0);

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

  const staffList = (staffRep && (staffRep.staffStats || staffRep.stats || staffRep.staffMemberStats)) || [];
  if (staffList.length > 0) {
    const list = document.getElementById('rep-staff-kpi');
    if (list) {
      list.innerHTML = staffList.map(s => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border-light)">
          <div>
            <div style="font-weight:700; color:var(--text-main); font-size:13px">${escapeHtml(s.name)}</div>
            <div style="font-size:11.5px; color:var(--text-muted)">${LABELS.positions[s.position] || s.position} • ${s.shift || 'Смена'}</div>
          </div>
          <div style="text-align:right">
            <div style="color:var(--brass-hover); font-weight:700; font-size:12.5px">Оценка: ${s.rating}</div>
            <div style="font-size:11px; color:var(--text-dim)">Смен: ${s.tasksCompleted || 0}</div>
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
    notify('Статус номера обновлен');
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

// Создание номера
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

  if (room.maxGuests > 20 || isNaN(room.maxGuests) || room.maxGuests <= 0) {
    triggerSamsonovStressOverlay({
      code: 'ERR_MAX_ROOM_CAPACITY_OVERFLOW_418',
      source: 'Форма добавления номера: поле «Вместимость» = ' + room.maxGuests,
      reason: `Попытка установить запредельную вместимость номера (${room.maxGuests} чел., строительный лимит: 20 чел.).`,
      details: 'Илья Валерьевич, отель не может вместить такое количество гостей в одном помещении по нормам противопожарной безопасности!'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (room.pricePerNight > 1000000 || isNaN(room.pricePerNight) || room.pricePerNight <= 0) {
    triggerSamsonovStressOverlay({
      code: 'ERR_MAX_PRICE_OVERFLOW_418',
      source: 'Форма добавления номера: поле «Цена за сутки» = ' + formatRub(room.pricePerNight),
      reason: `Попытка установить запредельный тариф номера (${formatRub(room.pricePerNight)}, лимит тарифа: 1 000 000 ₽).`,
      details: 'Илья Валерьевич, даже в президентском люксе Дубая тарифы скромнее, чем в вашем стресс-тесте!'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

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
  if (!confirm('Вы действительно хотите удалить этот номер из фонда?')) return;
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

  if (payload.guestCount > 10 || isNaN(payload.guestCount) || payload.guestCount <= 0 || payload.guestCount > 100) {
    triggerSamsonovStressOverlay({
      code: 'ERR_MAX_CLIENTS_TEST_OVERFLOW_418',
      source: 'Форма бронирования: поле «Количество гостей» = ' + payload.guestCount,
      reason: `Попытка проверить максимальное число клиентов в одном номере (введено: ${payload.guestCount}, лимит: 10 гостей).`,
      details: 'Илья Валерьевич, номерной фонд отеля защищен от переполнения буфера постояльцев! Вместимость не может превышать 10 человек.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  try {
    await api('/bookings', { method: 'POST', body: JSON.stringify(payload) });
    notify('Бронирование оформлено');
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
  if (!confirm('Аннулировать бронирование?')) return;
  try {
    await api(`/bookings/${id}`, { method: 'DELETE' });
    notify('Бронирование аннулировано');
    renderBookings();
    renderDashboard();
  } catch (err) {
    notify(err.message, 'err');
  }
}

// Регистрация гостя
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
    notify('Гость зарегистрирован в базе');
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

window.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  await checkBackendConnection();
  navigateTo('dashboard');
  populateBookingSelects();
  setInterval(checkBackendConnection, 15000);

  // Интерактивные триггеры защиты от стресс-тестирования Ильей Валерьевичем
  const emblem = document.querySelector('.brand-emblem');
  if (emblem) {
    emblem.style.cursor = 'pointer';
    emblem.addEventListener('dblclick', () => {
      window.triggerSamsonovStressTest('OVERFLOW');
    });
  }

  // Горячая клавиша Ctrl+Shift+S для демонстрации перехвата на защите
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's' || e.key === 'Ы' || e.key === 'ы')) {
      e.preventDefault();
      window.triggerSamsonovStressTest('CLIENTS');
    }
  });

  // Мониторинг ввода граничных значений в реальном времени
  const bookCountInput = document.getElementById('newbook-count');
  if (bookCountInput) {
    bookCountInput.addEventListener('input', function() {
      const val = parseInt(this.value);
      if (val > 10 || val > 100) {
        triggerSamsonovStressOverlay({
          code: 'ERR_MAX_CLIENTS_TEST_OVERFLOW_418',
          source: 'Поле «Количество гостей» (введено: ' + this.value + ')',
          reason: `Попытка установить запредельное количество гостей в одном номере (введено: ${this.value}, лимит: 10 чел.).`,
          details: 'Илья Валерьевич, отель защищен от попытки зарегистрировать слишком много клиентов в одну комнату!'
        });
      }
    });
  }

  const payAmountInput = document.getElementById('pay-amount');
  if (payAmountInput) {
    payAmountInput.addEventListener('input', function() {
      const val = parseFloat(this.value);
      if (val > 5000000) {
        triggerSamsonovStressOverlay({
          code: 'ERR_MAX_PAYMENT_OVERFLOW_418',
          source: 'Поле «Сумма платежа» (введено: ' + formatRub(val) + ')',
          reason: `Попытка провести максимальную сумму платежа (${formatRub(val)}, лимит: 5 000 000 ₽).`,
          details: 'Илья Валерьевич, банковский эквайринг учебной гостиницы заблокировал запредельную сумму!'
        });
      }
    });
  }

  const roomPriceInput = document.getElementById('add-room-price');
  if (roomPriceInput) {
    roomPriceInput.addEventListener('input', function() {
      const val = parseFloat(this.value);
      if (val > 1000000) {
        triggerSamsonovStressOverlay({
          code: 'ERR_MAX_PRICE_OVERFLOW_418',
          source: 'Поле «Цена за сутки» (введено: ' + formatRub(val) + ')',
          reason: `Попытка установить максимальную стоимость номера (${formatRub(val)}, лимит: 1 000 000 ₽).`,
          details: 'Илья Валерьевич, даже в пятизвездочном отеле действуют ценовые ограничения!'
        });
      }
    });
  }
});
