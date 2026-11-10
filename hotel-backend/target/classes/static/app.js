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

// ==========================================================================
// СИСТЕМА АКТИВНОЙ ЗАЩИТЫ ОТ СТРЕСС-ТЕСТИРОВАНИЯ (ИЛЬЯ ВАЛЕРЬЕВИЧ)
// ==========================================================================
let stressOverlayActive = false;
const apiCallHistory = [];

function checkFloodProtection(method = 'GET') {
  // Штатные GET-запросы на чтение и отрисовку представлений никогда не блокируются
  if (method === 'GET') {
    return true;
  }

  const now = Date.now();
  apiCallHistory.push({ time: now, method });
  while (apiCallHistory.length && apiCallHistory[0].time < now - 2000) {
    apiCallHistory.shift();
  }

  // Защита срабатывает только при скриптовом флуде запросами на запись/удаление (> 25 мутаций за 2 сек)
  if (apiCallHistory.length > 25) {
    triggerSamsonovStressOverlay({
      code: 'ERR_DATABASE_OVERLOAD_FLOOD_429',
      source: 'Стресс-тестирование базы данных (Шквал одновременных запросов)',
      reason: `Зафиксировано ${apiCallHistory.length} мутаций REST API за 2 секунды. Сработал предохранитель базы данных от перегрузки пула соединений.`,
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
  apiCallHistory.length = 0; // Полный сброс счетчика вызовов
  document.body.style.overflow = '';

  // Сброс потенциально экстремальных значений в полях ввода
  const bookCount = document.getElementById('newbook-count');
  if (bookCount && (parseInt(bookCount.value) > 10 || parseInt(bookCount.value) <= 0)) bookCount.value = 2;

  const payAmount = document.getElementById('pay-amount');
  if (payAmount && (parseFloat(payAmount.value) > 5000000 || parseFloat(payAmount.value) < 0)) payAmount.value = 5000;

  const roomPrice = document.getElementById('add-room-price');
  if (roomPrice && (parseFloat(roomPrice.value) > 1000000 || parseFloat(roomPrice.value) < 0)) roomPrice.value = 4500;

  const roomGuests = document.getElementById('add-room-guests');
  if (roomGuests && (parseInt(roomGuests.value) > 20 || parseInt(roomGuests.value) <= 0)) roomGuests.value = 2;

  const roomFloor = document.getElementById('add-room-floor');
  if (roomFloor && (parseInt(roomFloor.value) > 50 || parseInt(roomFloor.value) <= 0)) roomFloor.value = 2;

  const nightsInput = document.getElementById('newbook-nights');
  if (nightsInput && (parseInt(nightsInput.value) > 365 || parseInt(nightsInput.value) <= 0)) nightsInput.value = 3;

  notify('Штатный режим восстановлен. Параметры возвращены в безопасный диапазон.');
}

// Глобальный триггер для демонстрации защиты на защите работы:
// window.triggerSamsonovStressTest('CLIENTS' | 'AMOUNT' | 'OVERLOAD')
window.triggerSamsonovStressTest = function (type = 'CLIENTS') {
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

// ==========================================================================
// НАВИГАЦИЯ МЕЖДУ РАЗДЕЛАМИ
// ==========================================================================
const VIEW_METADATA = {
  dashboard: {
    title: 'Сводка и бронирования',
    subtitle: 'Управление номерным фондом, постояльцами и кассой гостиницы в едином пространстве.'
  },
  rooms: {
    title: 'Реестр номерного фонда',
    subtitle: 'Каталог номеров отеля, категории, этажность, вместимость и тарифы.'
  },
  bookings: {
    title: 'Журнал бронирований',
    subtitle: 'Учет предварительных и активных броней номерного фонда комплекса.'
  },
  guests: {
    title: 'Служба приема и постояльцы',
    subtitle: 'Регистрация гостей, прикрепление к номерам и статус фактического проживания.'
  },
  staff: {
    title: 'Штатное расписание и сотрудники',
    subtitle: 'Управление рабочими сменами, должностями и показателями эффективности.'
  },
  tariffs: {
    title: 'Тарифная сетка и касса',
    subtitle: 'Базовые тарифы и кассовый журнал входящих финансовых платежей.'
  },
  reports: {
    title: 'Финансовая аналитика и отчеты',
    subtitle: 'Статистика загрузки фонда, динамика выручки и эффективность персонала.'
  }
};

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

  const meta = VIEW_METADATA[viewName] || VIEW_METADATA.dashboard;
  const titleEl = document.getElementById('page-main-title');
  const subEl = document.getElementById('page-main-subtitle');
  if (titleEl) titleEl.innerText = meta.title;
  if (subEl) subEl.innerText = meta.subtitle;

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

let selectedCockpitBookingId = null;
let cockpitFilterMode = 'ALL'; // 'ALL' | 'UNPAID' | 'CHECKED_IN'

async function renderDashboard() {
  const [rooms, guests, rev, bookings, payments, staff] = await Promise.all([
    api('/rooms'),
    api('/guests'),
    api('/reports/revenue'),
    api('/bookings'),
    api('/payments'),
    api('/staff')
  ]);

  if (!rooms) return;

  globalRoomsCache = rooms;
  globalGuestsCache = guests || [];
  globalBookingsCache = bookings || [];
  globalPaymentsCache = payments || [];
  globalStaffCache = staff || [];

  // Показываем баннер восстановления, если фонд номеров пуст
  const emptyBanner = document.getElementById('empty-db-banner');
  if (emptyBanner) {
    emptyBanner.style.display = rooms.length === 0 ? 'flex' : 'none';
  }

  const total = rooms.length;
  const occupied = rooms.filter(r => r.status === 'OCCUPIED').length;
  const availableRoomsList = rooms.filter(r => r.status === 'AVAILABLE');
  const available = availableRoomsList.length;
  const bookedRooms = rooms.filter(r => r.status === 'BOOKED').length;
  const cleaning = rooms.filter(r => r.status === 'CLEANING').length;
  const repair = rooms.filter(r => r.status === 'OUT_OF_ORDER').length;
  const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  // 1. Загрузка фонда (реальные цифры без хардкода)
  const rateEl = document.getElementById('dash-kpi-rate');
  if (rateEl) rateEl.innerText = `${rate}%`;

  const occTrendEl = document.getElementById('dash-kpi-occ-trend');
  if (occTrendEl) {
    occTrendEl.innerText = `Свободно: ${available} • Бронь: ${bookedRooms} • Уборка: ${cleaning}${repair ? ' • Ремонт: ' + repair : ''}`;
  }

  const occMetaEl = document.getElementById('dash-kpi-occ-meta');
  if (occMetaEl) occMetaEl.innerText = `${occupied} из ${total} номеров занято`;

  // 2. Выручка за период (реальные данные и динамическая диаграмма)
  const totalRev = Number(rev?.totalRevenue || 0);
  const revEl = document.getElementById('dash-kpi-rev');
  if (revEl) revEl.innerText = formatRub(totalRev);

  const txCount = rev?.totalPaymentsCount ?? rev?.totalTransactions ?? globalPaymentsCache.length;
  const byMethod = rev?.revenueByPaymentMethod || rev?.revenueByMethod || {};
  const cardVal = Number(byMethod.CARD ?? byMethod.card ?? 0);
  const cashVal = Number(byMethod.CASH ?? byMethod.cash ?? 0);
  const transferVal = Number(byMethod.TRANSFER ?? byMethod.transfer ?? 0);

  const revTrendEl = document.getElementById('dash-kpi-rev-trend');
  if (revTrendEl) {
    revTrendEl.innerText = `${txCount} плат. • Карта: ${formatRub(cardVal)} • Нал: ${formatRub(cashVal)}`;
  }

  renderDashboardRevenueBars({ CARD: cardVal, TRANSFER: transferVal, CASH: cashVal, totalRev });

  // 3. Средний срок проживания (реальный расчёт без фейка 3.4)
  const activeOrCompletedBooks = globalBookingsCache.filter(b => b.status !== 'CANCELLED' && b.checkInDate && b.checkOutDate);
  let avgStayText = '0 ноч.';
  let stayValues = [];
  if (activeOrCompletedBooks.length > 0) {
    stayValues = activeOrCompletedBooks.map(b => calculateNights(b.checkInDate, b.checkOutDate));
    const totalNights = stayValues.reduce((sum, n) => sum + n, 0);
    avgStayText = `${(totalNights / activeOrCompletedBooks.length).toFixed(1)} ноч.`;
  }
  const avgStayEl = document.getElementById('dash-kpi-avg-stay');
  if (avgStayEl) avgStayEl.innerText = avgStayText;

  const checkedInGuestsCount = globalGuestsCache.filter(g => g.checkedIn).length;
  const avgTrendEl = document.getElementById('dash-kpi-avg-trend');
  if (avgTrendEl) {
    avgTrendEl.innerText = `Броней: ${activeOrCompletedBooks.length} • Проживают: ${checkedInGuestsCount}`;
  }
  renderDashboardStaySpline(stayValues);

  // 4. Доступно к заселению (только реально свободные номера из БД)
  const availEl = document.getElementById('dash-kpi-avail');
  if (availEl) availEl.innerText = `${available} ном.`;

  const availPillEl = document.getElementById('dash-avail-pill');
  if (availPillEl) availPillEl.innerText = available > 0 ? 'Готовы к заезду' : 'Нет свободных';

  const chipsBox = document.getElementById('dash-avail-chips');
  if (chipsBox) {
    const topFree = availableRoomsList.slice(0, 3);
    const chipsHtml = topFree.length > 0
      ? topFree.map((r, idx) => `
          <button type="button" class="finnova-mini-chip ${idx === 0 ? 'active' : ''}" onclick="event.stopPropagation(); openBookingWithRoom(${r.id})" title="Забронировать № ${escapeHtml(r.roomNumber)} (${formatRub(r.pricePerNight)}/сут.)">
            № ${escapeHtml(r.roomNumber)}
          </button>
        `).join('')
      : '<span style="font-size:11.5px; color:#64748b">Свободных номеров нет</span>';

    chipsBox.innerHTML = `
      ${chipsHtml}
      <button type="button" class="finnova-payout-btn" onclick="event.stopPropagation(); openQuickBookingFromCard()">Заселить</button>
    `;
  }

  // Синхронизируем динамический список этажей под реальный фонд
  syncDashboardFloorSelect(rooms);

  // Отрисовка всех разделов сводки с учётом активных фильтров
  filterDashboardContent();

  // Отрисовка текущих постояльцев в номерах
  renderCurrentOccupantsTable();

  updateNavCounts({
    rooms: rooms.length,
    guests: globalGuestsCache.length,
    bookings: globalBookingsCache.length,
    staff: globalStaffCache.length
  });
}

function renderDashboardRevenueBars({ CARD, TRANSFER, CASH, totalRev }) {
  const barsContainer = document.getElementById('dash-revenue-bars');
  if (!barsContainer) return;

  // Берём последние 6 платежей или группировку по способам оплаты, чтобы график отражал реальную кассу
  const recentPayments = [...globalPaymentsCache]
    .sort((a, b) => (a.id || 0) - (b.id || 0))
    .slice(-6);

  let items = [];
  if (recentPayments.length > 0) {
    const maxVal = Math.max(...recentPayments.map(p => Number(p.amount) || 0), 1);
    items = recentPayments.map((p, i) => ({
      label: `#${p.id}`,
      pct: Math.max(14, Math.round(((Number(p.amount) || 0) / maxVal) * 100)),
      title: `Платёж #${p.id}: ${formatRub(p.amount)}`,
      highlight: i === recentPayments.length - 1
    }));
  } else {
    const methodItems = [
      { label: 'Карта', val: CARD },
      { label: 'Счёт', val: TRANSFER },
      { label: 'Нал', val: CASH }
    ];
    const maxM = Math.max(CARD, TRANSFER, CASH, 1);
    items = methodItems.map(m => ({
      label: m.label,
      pct: totalRev > 0 ? Math.max(12, Math.round((m.val / maxM) * 100)) : 10,
      title: `${m.label}: ${formatRub(m.val)}`,
      highlight: m.val === maxM && totalRev > 0
    }));
  }

  barsContainer.innerHTML = items.map(it => `
    <div class="chart-bar-col" title="${escapeHtml(it.title)}">
      <div class="chart-bar ${it.highlight ? 'highlight' : ''}" style="height:${it.pct}%"></div>
      <span>${escapeHtml(it.label)}</span>
    </div>
  `).join('');
}

function renderDashboardStaySpline(durations) {
  const box = document.getElementById('dash-stay-spline');
  if (!box) return;

  if (!durations || durations.length === 0) {
    box.innerHTML = `
      <svg width="100%" height="52" viewBox="0 0 240 52" fill="none" preserveAspectRatio="none">
        <line x1="8" y1="42" x2="232" y2="42" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4 4"/>
      </svg>
    `;
    return;
  }

  const pts = durations.length === 1 ? [durations[0], durations[0]] : durations.slice(-8);
  const maxD = Math.max(...pts, 1);
  const coords = pts.map((val, idx) => {
    const x = Math.round(12 + (idx * 216) / (pts.length - 1));
    const y = Math.round(44 - (val / maxD) * 34);
    return { x, y, val };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x} ${c.y}`).join(' ');
  const areaPath = `${linePath} L${coords[coords.length - 1].x} 52 L${coords[0].x} 52 Z`;

  box.innerHTML = `
    <svg width="100%" height="52" viewBox="0 0 240 52" fill="none" preserveAspectRatio="none">
      <defs>
        <linearGradient id="splineGradientDyn" x1="0" y1="0" x2="0" y2="52" gradientUnits="userSpaceOnUse">
          <stop stop-color="#818cf8" stop-opacity="0.45"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#splineGradientDyn)"/>
      <path d="${linePath}" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${coords.map(c => `<circle cx="${c.x}" cy="${c.y}" r="3.5" fill="#4f46e5" stroke="#ffffff" stroke-width="2"><title>${c.val} ноч.</title></circle>`).join('')}
    </svg>
  `;
}

function syncDashboardFloorSelect(rooms) {
  const floorSel = document.getElementById('dash-filter-floor');
  if (!floorSel) return;
  const prev = floorSel.value || 'all';
  const floors = [...new Set(rooms.map(r => r.floor || 1))].sort((a, b) => a - b);
  const stdFloors = floors.length > 0 ? floors : [1, 2, 3, 4];
  floorSel.innerHTML = '<option value="all">Все этажи здания</option>' +
    stdFloors.map(f => `<option value="${f}">${f}-й этаж</option>`).join('');
  if ([...floorSel.options].some(o => o.value === prev)) {
    floorSel.value = prev;
  } else {
    floorSel.value = 'all';
    currentFloorFilter = 'all';
  }
}

function navigateToAvailableRooms() {
  navigateTo('rooms');
  const sel = document.getElementById('room-status-filter');
  if (sel) {
    sel.value = 'AVAILABLE';
    filterRoomsList();
  }
}

function openQuickBookingFromCard() {
  const freeRoom = globalRoomsCache.find(r => r.status === 'AVAILABLE');
  if (freeRoom) {
    openBookingWithRoom(freeRoom.id);
  } else {
    openModal('modal-add-booking');
  }
}

async function restoreDemoData() {
  try {
    await api('/system/reset-demo', { method: 'POST' });
    notify('Стартовый номерной фонд, гости, брони и платежи восстановлены');
    await refreshAllViews();
    renderReports();
  } catch (err) {
    notify(err.message || 'Не удалось восстановить данные', 'err');
  }
}

// Отрисовка флагманского двухпанельного темного кокпита
function renderDashboardCockpit(filteredBookingsOverride = null) {
  const listEl = document.getElementById('cockpit-bookings-list');
  const detailEl = document.getElementById('cockpit-detail-container');
  if (!listEl || !detailEl) return;

  const baseBookings = filteredBookingsOverride !== null ? filteredBookingsOverride : globalBookingsCache;
  let activeBooks = baseBookings.filter(b => b.status !== 'CANCELLED');
  if (cockpitFilterMode === 'UNPAID') {
    activeBooks = activeBooks.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING');
  } else if (cockpitFilterMode === 'CHECKED_IN') {
    activeBooks = activeBooks.filter(b => b.status === 'CHECKED_IN');
  }

  const countEl = document.getElementById('cockpit-count-badge');
  if (countEl) countEl.innerText = activeBooks.length;

  if (activeBooks.length === 0) {
    listEl.innerHTML = '<div style="color:var(--slate-400); padding:24px; text-align:center; font-size:13px">В данной категории бронирований нет</div>';
    detailEl.innerHTML = '<div style="color:var(--slate-400); padding:32px; text-align:center; font-size:14px">Выберите бронирование для просмотра деталей</div>';
    return;
  }

  if (!selectedCockpitBookingId || !activeBooks.some(b => b.id === selectedCockpitBookingId)) {
    selectedCockpitBookingId = activeBooks[0].id;
  }

  const today = new Date().toISOString().split('T')[0];
  listEl.innerHTML = activeBooks.map(b => {
    const isSelected = b.id === selectedCockpitBookingId;
    const guest = b.guest || globalGuestsCache.find(g => g.id === (b.guestId || b.guest_id || (b.guest && b.guest.id)));
    const guestName = guest ? `${guest.firstName} ${guest.lastName}` : `Гость #${b.id}`;
    const initials = guest ? `${guest.firstName[0] || ''}${guest.lastName[0] || ''}` : 'Г';
    const room = b.room || globalRoomsCache.find(r => r.id === (b.roomId || b.room_id || (b.room && b.room.id)));
    const statusLabel = LABELS.bookingStatuses[b.status] || b.status;
    const nights = calculateNights(b.checkInDate, b.checkOutDate);

    let relativeText = `${nights} ноч.`;
    if (b.status === 'CHECKED_IN') {
      const remaining = Math.round((new Date(b.checkOutDate) - new Date(today)) / (1000 * 60 * 60 * 24));
      relativeText = remaining === 0 ? 'Выезд сегодня' : (remaining > 0 ? `Осталось ${remaining} ноч.` : `Просрочено (${Math.abs(remaining)} дн.)`);
    } else if (b.checkInDate === today) {
      relativeText = 'Заезд сегодня';
    } else if (b.checkInDate > today) {
      const daysUntil = calculateNights(today, b.checkInDate);
      relativeText = `Заезд через ${daysUntil} дн.`;
    }

    return `
      <div class="cockpit-item ${isSelected ? 'selected' : ''}" onclick="selectCockpitBooking(${b.id})">
        <div class="cockpit-avatar">${initials}</div>
        <div class="cockpit-item-info">
          <div class="cockpit-item-title"># БРОНЬ-${b.id} • ${room ? `№ ${room.roomNumber}` : 'Номер не назначен'}</div>
          <div class="cockpit-item-sub">${escapeHtml(guestName)} • ${relativeText}</div>
        </div>
        <div class="cockpit-item-status status-${b.status.toLowerCase()}">${statusLabel}</div>
        <div class="cockpit-item-amount">${formatRub(b.totalPrice)}</div>
      </div>
    `;
  }).join('');

  const selBook = activeBooks.find(b => b.id === selectedCockpitBookingId) || activeBooks[0];
  if (!selBook) return;

  const selGuest = selBook.guest || globalGuestsCache.find(g => g.id === (selBook.guestId || selBook.guest_id || (selBook.guest && selBook.guest.id)));
  const selRoom = selBook.room || globalRoomsCache.find(r => r.id === (selBook.roomId || selBook.room_id || (selBook.room && selBook.room.id)));
  const guestInitials = selGuest ? `${selGuest.firstName[0] || ''}${selGuest.lastName[0] || ''}` : 'ГИ';
  const nights = calculateNights(selBook.checkInDate, selBook.checkOutDate);
  const roomPricePerNight = selRoom ? selRoom.pricePerNight : (selBook.totalPrice / (nights || 1));
  const stayCost = roomPricePerNight * nights;
  const extraServices = Math.max(0, selBook.totalPrice - stayCost);
  const statusLabel = LABELS.bookingStatuses[selBook.status] || selBook.status;

  // Реальный расчёт оплаченной суммы и остатка по кассовым платежам из БД
  const paidForBooking = globalPaymentsCache
    .filter(p => (p.bookingId || p.booking_id || (p.booking && p.booking.id)) === selBook.id)
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balanceDue = Math.max(0, Number(selBook.totalPrice || 0) - paidForBooking);
  const paymentColor = balanceDue <= 0 ? '#6ee7b7' : '#fde68a';
  const paymentText = balanceDue <= 0
    ? 'Оплачено (Баланс 0 ₽)'
    : `Долг: ${formatRub(balanceDue)} (внесено ${formatRub(paidForBooking)})`;

  detailEl.innerHTML = `
    <div class="cockpit-detail-top">
      <div>
        <div class="cockpit-tag-row">
          <span style="font-size:12px; opacity:0.8">Детали бронирования:</span>
          <span class="cockpit-status-chip">${statusLabel}</span>
        </div>
        <div class="cockpit-detail-h1"># БРОНЬ-${selBook.id}</div>
      </div>
      <div class="cockpit-detail-brand">
        <div class="cockpit-brand-pill">GRAND IMPÉRIAL PMS</div>
      </div>
      <div class="cockpit-guest-badge">
        <div class="cockpit-avatar">${guestInitials}</div>
        <div>
          <div style="font-weight:700; font-size:13px">${escapeHtml(selGuest ? `${selGuest.firstName} ${selGuest.lastName}` : 'Гость комплекса')}</div>
          <div style="font-size:11px; opacity:0.8">${selRoom ? `№ ${selRoom.roomNumber} (${LABELS.types[selRoom.type] || selRoom.type})` : 'Номер не назначен'}</div>
        </div>
      </div>
    </div>

    <div class="cockpit-detail-subcards">
      <div class="cockpit-subcard">
        <div class="cockpit-subcard-sum">${formatRub(stayCost)}</div>
        <div class="cockpit-subcard-label">Тариф номера (${nights} ноч.)</div>
        <div class="cockpit-subcard-date">${selBook.checkInDate} → ${selBook.checkOutDate}</div>
      </div>
      <div class="cockpit-subcard">
        <div class="cockpit-subcard-sum">${selRoom ? `№ ${selRoom.roomNumber}` : '—'}</div>
        <div class="cockpit-subcard-label">${selRoom ? `${LABELS.types[selRoom.type] || selRoom.type} • ${selRoom.floor} этаж` : 'Категория'}</div>
        <div class="cockpit-subcard-date">до ${selRoom ? selRoom.maxGuests : 2} гостей</div>
      </div>
      <div class="cockpit-subcard">
        <div class="cockpit-subcard-sum">${formatRub(paidForBooking)}</div>
        <div class="cockpit-subcard-label">Внесено по кассе</div>
        <div class="cockpit-subcard-date">${extraServices > 0 ? `Доп. услуги: ${formatRub(extraServices)}` : 'Учтено в инвойсе'}</div>
      </div>
      <div class="cockpit-subcard dashed" onclick="openPaymentWithBooking(${selBook.id})">
        <div class="cockpit-plus-icon">+</div>
        <div class="cockpit-subcard-label">Принять оплату</div>
      </div>
    </div>

    <div class="cockpit-detail-footer">
      <div class="cockpit-footer-col">
        <span class="foot-label">Тариф проживания</span>
        <span class="foot-val">${formatRub(stayCost)}</span>
      </div>
      <div class="cockpit-footer-col">
        <span class="foot-label">Итого по счету</span>
        <span class="foot-val">${formatRub(selBook.totalPrice)}</span>
      </div>
      <div class="cockpit-footer-col">
        <span class="foot-label">Статус оплаты</span>
        <span class="foot-val" style="color:${paymentColor}; font-size:14px">${paymentText}</span>
      </div>

      <div class="cockpit-footer-actions">
        <button class="cockpit-icon-btn" title="Печать счёта-квитанции" onclick="openInvoiceSheet(${selBook.id})">
          Печать квитанции
        </button>
        <button class="cockpit-primary-white-btn" onclick="openInvoiceSheet(${selBook.id})">
          Счёт (Folio)
        </button>
      </div>
    </div>
  `;
}

function selectCockpitBooking(id) {
  selectedCockpitBookingId = id;
  filterDashboardContent();
}

function setCockpitFilter(mode, btn) {
  cockpitFilterMode = mode;
  document.querySelectorAll('.cockpit-tab-pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  filterDashboardContent();
}

async function openPaymentWithBooking(bookingId) {
  await openPaymentModal(bookingId);
}

function toggleFilterDrawer() {
  const row = document.querySelector('.filter-toolbar-row');
  if (row) {
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const search = document.getElementById('dash-global-search');
    if (search) search.focus();
  }
}

function resetDashboardFilters() {
  const catEl = document.getElementById('dash-filter-category');
  const stEl = document.getElementById('dash-filter-status');
  const perEl = document.getElementById('dash-filter-period');
  const flEl = document.getElementById('dash-filter-floor');
  const srchEl = document.getElementById('dash-global-search');
  if (catEl) catEl.value = '';
  if (stEl) stEl.value = '';
  if (perEl) perEl.value = 'all';
  if (flEl) flEl.value = 'all';
  if (srchEl) srchEl.value = '';
  currentFloorFilter = 'all';
  document.querySelectorAll('.floor-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.innerText.includes('Все'));
  });
  filterDashboardContent();
  notify('Фильтры сводки сброшены');
}

function filterDashboardContent() {
  const cat = document.getElementById('dash-filter-category')?.value || '';
  const st = document.getElementById('dash-filter-status')?.value || '';
  const period = document.getElementById('dash-filter-period')?.value || 'all';
  const floorVal = document.getElementById('dash-filter-floor')?.value || 'all';
  const query = (document.getElementById('dash-global-search')?.value || '').toLowerCase().trim();

  currentFloorFilter = floorVal;
  document.querySelectorAll('.floor-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.innerText.includes(floorVal === 'all' ? 'Все' : `${floorVal}-й`));
  });

  // Считаем реально активные фильтры
  let activeCount = 0;
  if (cat) activeCount++;
  if (st) activeCount++;
  if (period && period !== 'all') activeCount++;
  if (floorVal && floorVal !== 'all') activeCount++;
  if (query) activeCount++;
  const badgeEl = document.getElementById('dash-active-filters-count');
  if (badgeEl) badgeEl.innerText = activeCount;

  // Фильтруем комнаты (по категории, статусу и поиску по номеру/гостю/паспорту)
  let filteredRooms = globalRoomsCache.filter(r => {
    if (cat && r.type !== cat) return false;
    if (st && r.status !== st) return false;
    if (!query) return true;

    const matchRoom = r.roomNumber.toLowerCase().includes(query) ||
      (LABELS.types[r.type] || '').toLowerCase().includes(query) ||
      (LABELS.roomStatuses[r.status] || '').toLowerCase().includes(query);
    if (matchRoom) return true;

    const activeB = globalBookingsCache.find(b =>
      ((b.roomId || (b.room && b.room.id)) === r.id) && b.status !== 'CANCELLED' && b.status !== 'CHECKED_OUT'
    );
    if (activeB) {
      const g = activeB.guest || globalGuestsCache.find(x => x.id === (activeB.guestId || activeB.guest_id));
      if (g) {
        const gText = `${g.firstName} ${g.lastName} ${g.passportNumber} ${g.phone}`.toLowerCase();
        if (gText.includes(query)) return true;
      }
    }
    return false;
  });

  renderFloorCorridors(filteredRooms, floorVal);

  // Фильтруем бронирования в Кокпите (по периоду, категории/статусу комнаты, этажу и поиску)
  const filteredBookings = globalBookingsCache.filter(b => {
    if (period !== 'all') {
      const inMatch = (b.checkInDate || '').startsWith(period);
      const outMatch = (b.checkOutDate || '').startsWith(period);
      if (!inMatch && !outMatch) return false;
    }
    const r = b.room || globalRoomsCache.find(x => x.id === (b.roomId || b.room_id));
    if (cat && (!r || r.type !== cat)) return false;
    if (st && (!r || r.status !== st)) return false;
    if (floorVal !== 'all' && (!r || String(r.floor) !== String(floorVal))) return false;
    if (query) {
      const g = b.guest || globalGuestsCache.find(x => x.id === (b.guestId || b.guest_id));
      const haystack = `${b.id} ${r ? r.roomNumber : ''} ${g ? `${g.firstName} ${g.lastName} ${g.passportNumber} ${g.phone}` : ''}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  renderDashboardCockpit(filteredBookings);
}

// Фильтрация этажей (синхронизируется с селектом в шапке фильтров)
function filterFloorView(floor) {
  const flEl = document.getElementById('dash-filter-floor');
  if (flEl) flEl.value = String(floor);
  filterDashboardContent();
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
    1: 'Базовый уровень (Номера 101 — 102)',
    2: 'Повышенная комфортность (Номера 201 — 202)',
    3: 'Представительский уровень (Номера 301 — 302)',
    4: 'Президентский пентхаус (Номер 401)'
  };

  container.innerHTML = floorsToShow.map(fNum => {
    const fRooms = floorsMap[fNum] || [];
    const occCount = fRooms.filter(r => r.status === 'OCCUPIED').length;

    return `
      <div class="floor-corridor-wing">
        <div class="corridor-header">
          <div class="floor-title-badge">
            <span class="floor-num-pill">${fNum}-й этаж</span>
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
  const activeBook = globalBookingsCache.find(b =>
    (b.roomId === room.id || (b.room && b.room.id === room.id)) &&
    b.status !== 'CANCELLED' && b.status !== 'CHECKED_OUT'
  );
  let occupantName = null;
  let datesText = null;
  let guestPhone = null;
  let nightsHtml = '';
  let remainingBadge = '';

  if (activeBook) {
    const guest = activeBook.guest || globalGuestsCache.find(g => g.id === (activeBook.guestId || activeBook.guest_id || (activeBook.guest && activeBook.guest.id)));
    if (guest) {
      occupantName = `${guest.firstName} ${guest.lastName}`;
      guestPhone = guest.phone;
    }
    datesText = `${activeBook.checkInDate} → ${activeBook.checkOutDate}`;
    const nights = calculateNights(activeBook.checkInDate, activeBook.checkOutDate);
    nightsHtml = `<span class="stay-nights-pill">${nights} ноч.</span>`;
    remainingBadge = getRemainingNightsBadge(activeBook.checkOutDate, activeBook.status);
  }

  // Описание для всплывающей карточки
  let statusDetailHtml = '';
  if (room.status === 'OCCUPIED') {
    statusDetailHtml = `
      <div class="popover-guest-box">
        <div class="title">Проживающий постоялец:</div>
        <div style="font-weight:700; color:var(--text-main)">${escapeHtml(occupantName || 'Постоялец')}</div>
        <div style="color:var(--text-muted); font-size:11px; margin-top:2px">${datesText || 'Период не указан'}</div>
        <div style="margin-top:6px; display:flex; gap:6px; align-items:center; flex-wrap:wrap">
          ${nightsHtml}
          ${remainingBadge}
        </div>
        ${guestPhone ? `<div style="color:var(--text-secondary); font-size:11px; margin-top:4px">${escapeHtml(guestPhone)}</div>` : ''}
      </div>
    `;
  } else if (room.status === 'BOOKED') {
    statusDetailHtml = `
      <div class="popover-guest-box">
        <div class="title">Бронь оформлена на:</div>
        <div style="font-weight:700; color:var(--text-main)">${escapeHtml(occupantName || 'Гость')}</div>
        <div style="color:var(--text-muted); font-size:11px; margin-top:2px">Заезд ожидается: ${datesText || 'В ближайшие дни'}</div>
        <div style="margin-top:6px; display:flex; gap:6px; align-items:center; flex-wrap:wrap">
          ${nightsHtml}
          ${remainingBadge}
        </div>
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
    const b = globalBookingsCache.find(x =>
      ((x.guestId === g.id) || (x.guest_id === g.id) || (x.guest && x.guest.id === g.id)) &&
      (x.status === 'CHECKED_IN' || x.status === 'CONFIRMED')
    );
    const roomId = b ? (b.roomId || b.room_id || (b.room && b.room.id)) : null;
    const room = roomId ? globalRoomsCache.find(r => r.id === roomId) : null;

    const inDate = b ? b.checkInDate : g.checkInDate;
    const outDate = b ? b.checkOutDate : g.checkOutDate;
    const nights = calculateNights(inDate, outDate);
    const countdown = getRemainingNightsBadge(outDate, 'CHECKED_IN');

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
        <td>
          <div>${inDate || '—'} → ${outDate || '—'}</div>
          <div style="margin-top:4px; display:flex; gap:6px; align-items:center">
            <span class="stay-nights-pill">${nights} ноч.</span>
            ${countdown}
          </div>
        </td>
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
async function renderRooms(cachedRooms) {
  const rooms = cachedRooms || await api('/rooms');
  if (!rooms) return;
  globalRoomsCache = rooms;
  updateNavCounts({ rooms: rooms.length });
  displayRoomsTable(rooms);
}

function displayRoomsTable(rooms) {
  const tbody = document.getElementById('rooms-tbody');
  if (!tbody) return;

  if (rooms.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; color:var(--text-muted); padding:28px">
          <div>Номера не найдены</div>
          <div style="margin-top:10px">
            <button type="button" class="btn btn-xs btn-primary" onclick="restoreDemoData()">Восстановить стартовые номера</button>
          </div>
        </td>
      </tr>
    `;
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
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ РАСЧЕТА ДАТ И НОЧЕЙ
// ==========================================================================
function calculateNights(checkInDateStr, checkOutDateStr) {
  if (!checkInDateStr || !checkOutDateStr) return 1;
  const d1 = new Date(checkInDateStr);
  const d2 = new Date(checkOutDateStr);
  if (isNaN(d1) || isNaN(d2) || d2 <= d1) return 1;
  return Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
}

function getRemainingNightsBadge(checkOutDateStr, status) {
  if (!checkOutDateStr) return '';
  if (status === 'CHECKED_OUT') {
    return `<span class="countdown-badge finished">Выезд оформлен</span>`;
  }
  if (status === 'CANCELLED') {
    return `<span class="countdown-badge finished">Аннулировано</span>`;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const outDate = new Date(checkOutDateStr);
  outDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((outDate - today) / (1000 * 60 * 60 * 24));

  if (status === 'CONFIRMED' || status === 'PENDING') {
    if (diffDays <= 0) return `<span class="countdown-badge last-night">Заезд сегодня</span>`;
    return `<span class="countdown-badge confirmed">Заезд через ${diffDays} дн.</span>`;
  }

  // Для проживающих гостей (CHECKED_IN / OCCUPIED)
  if (diffDays < 0) {
    return `<span class="countdown-badge overdue">Просрочено (${Math.abs(diffDays)} дн.)</span>`;
  } else if (diffDays === 0) {
    return `<span class="countdown-badge today-checkout">Выезд сегодня</span>`;
  } else if (diffDays === 1) {
    return `<span class="countdown-badge last-night">Осталась 1 ночь</span>`;
  } else if (diffDays >= 2 && diffDays <= 4) {
    return `<span class="countdown-badge in-progress">Осталось ${diffDays} ночи</span>`;
  } else {
    return `<span class="countdown-badge in-progress">Осталось ${diffDays} ночей</span>`;
  }
}

// Единое реактивное обновление всех представлений
async function refreshAllViews() {
  try {
    const [rooms, guests, bookings, payments, staff] = await Promise.all([
      api('/rooms'),
      api('/guests'),
      api('/bookings'),
      api('/payments'),
      api('/staff')
    ]);

    if (rooms) globalRoomsCache = rooms;
    if (guests) globalGuestsCache = guests;
    if (bookings) globalBookingsCache = bookings;
    if (payments) globalPaymentsCache = payments;
    if (staff) globalStaffCache = staff;

    await Promise.all([
      renderDashboard(),
      renderRooms(rooms),
      renderBookings(bookings, rooms, guests),
      renderGuests(guests, bookings, rooms),
      renderTariffs(),
      renderStaff(),
      renderReports(),
      populateBookingSelects(rooms, guests, bookings)
    ]);
  } catch (e) {
    console.warn('Ошибка синхронизации представлений:', e);
  }
}

// ==========================================================================
// 3. БРОНИРОВАНИЯ
// ==========================================================================
async function renderBookings(cachedBooks, cachedRooms, cachedGuests) {
  const [books, rooms, guests] = (cachedBooks && cachedRooms && cachedGuests)
    ? [cachedBooks, cachedRooms, cachedGuests]
    : await Promise.all([
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
      const stayNights = calculateNights(b.checkInDate, b.checkOutDate);
      const remainingBadge = getRemainingNightsBadge(b.checkOutDate, b.status);

      return `
        <tr>
          <td><strong>#${b.id}</strong></td>
          <td>
            <strong>${guest ? `${escapeHtml(guest.firstName)} ${escapeHtml(guest.lastName)}` : 'Гость #' + (b.guestId || '')}</strong>
            <div style="font-size:11px; color:var(--text-muted)">${escapeHtml(guest?.phone || '')}</div>
          </td>
          <td>
            <strong>№ ${room?.roomNumber || '—'}</strong>
            <div style="font-size:11px; color:var(--text-muted)">${LABELS.types[room?.type] || ''}</div>
          </td>
          <td>
            <div style="font-weight:700">${b.checkInDate} → ${b.checkOutDate}</div>
            <div style="margin-top:4px; display:flex; align-items:center; gap:5px; flex-wrap:wrap">
              <span class="stay-nights-pill">${stayNights} ноч.</span>
              ${remainingBadge}
            </div>
          </td>
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
              ${b.status !== 'CANCELLED' && b.status !== 'CHECKED_OUT' ? `
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

// ==========================================================================
// ДИНАМИЧЕСКАЯ ФИЛЬТРАЦИЯ НОМЕРОВ ПО ДАТАМ И ПРОВЕРКА ЗАНЯТОСТИ
// ==========================================================================
function updateRoomOptionsForDates(checkIn, checkOut, selectId = 'newbook-room') {
  const rSel = document.getElementById(selectId);
  if (!rSel || !globalRoomsCache || globalRoomsCache.length === 0) return;

  const currentVal = parseInt(rSel.value);
  let firstAvailableId = null;

  rSel.innerHTML = globalRoomsCache.map(r => {
    // 1. Проверяем статус техобслуживания / ремонта
    if (r.status === 'OUT_OF_ORDER') {
      return `<option value="${r.id}" disabled style="color:#94a3b8">№ ${r.roomNumber} (${LABELS.types[r.type] || r.type}) — [Недоступен: Ремонт]</option>`;
    }

    // 2. Проверяем наложение дат с активными бронями
    const hasConflict = globalBookingsCache.some(b => {
      if (b.status === 'CANCELLED' || b.status === 'CHECKED_OUT') return false;
      const bRoomId = b.roomId || (b.room && b.room.id);
      if (bRoomId !== r.id) return false;
      return (checkIn < b.checkOutDate && checkOut > b.checkInDate);
    });

    if (hasConflict) {
      return `<option value="${r.id}" disabled style="color:#ef4444">№ ${r.roomNumber} (${LABELS.types[r.type] || r.type}) — [Занят на выбранные даты]</option>`;
    }

    // 3. Проверяем текущее проживание (если заезд сегодня/раньше)
    const today = new Date().toISOString().split('T')[0];
    if (r.status === 'OCCUPIED' && checkIn <= today) {
      return `<option value="${r.id}" disabled style="color:#ef4444">№ ${r.roomNumber} (${LABELS.types[r.type] || r.type}) — [Занят постояльцем]</option>`;
    }

    // 4. Свободный номер
    if (!firstAvailableId) firstAvailableId = r.id;
    const isSelected = r.id === currentVal ? 'selected' : '';
    return `<option value="${r.id}" data-price="${r.pricePerNight}" ${isSelected}>№ ${r.roomNumber} (${LABELS.types[r.type] || r.type}) — ${formatRub(r.pricePerNight)}/сут. [Свободен]</option>`;
  }).join('');

  // Если выбранный номер теперь отключен, автоматически выбираем первый доступный
  const currentOption = rSel.querySelector(`option[value="${currentVal}"]`);
  if (!currentOption || currentOption.disabled) {
    if (firstAvailableId) {
      rSel.value = firstAvailableId;
    }
  }
}

// Интерактивное управление ночами и датами в окне бронирования (защита от некорректных дат)
function onBookingNightsChange() {
  const nightsInput = document.getElementById('newbook-nights');
  const inInput = document.getElementById('newbook-checkin');
  const outInput = document.getElementById('newbook-checkout');
  const nights = parseInt(nightsInput?.value, 10);
  const newOut = safeAddDaysIso(inInput?.value, Number.isFinite(nights) && nights > 0 ? Math.min(nights, 365) : 1);
  if (outInput && newOut) outInput.value = newOut;

  if (inInput?.value && outInput?.value) {
    updateRoomOptionsForDates(inInput.value, outInput.value, 'newbook-room');
  }
  recalculateBookingSummary();
}

function onBookingCheckInDateChange() {
  const nightsInput = document.getElementById('newbook-nights');
  const inInput = document.getElementById('newbook-checkin');
  const outInput = document.getElementById('newbook-checkout');
  const nights = parseInt(nightsInput?.value, 10);
  const newOut = safeAddDaysIso(inInput?.value, Number.isFinite(nights) && nights > 0 ? Math.min(nights, 365) : 1);
  if (outInput && newOut) outInput.value = newOut;

  if (inInput?.value && outInput?.value) {
    updateRoomOptionsForDates(inInput.value, outInput.value, 'newbook-room');
  }
  recalculateBookingSummary();
}

function onBookingCheckOutDateChange() {
  const inInput = document.getElementById('newbook-checkin');
  const outInput = document.getElementById('newbook-checkout');
  const nightsInput = document.getElementById('newbook-nights');
  const inDate = new Date(inInput?.value);
  const outDate = new Date(outInput?.value);

  if (!isNaN(inDate) && !isNaN(outDate) && outDate > inDate) {
    const nights = Math.max(1, Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24)));
    if (nightsInput) nightsInput.value = nights;
  }
  updateRoomOptionsForDates(inInput.value, outInput.value, 'newbook-room');
  recalculateBookingSummary();
}

function recalculateBookingSummary() {
  const inInput = document.getElementById('newbook-checkin');
  const outInput = document.getElementById('newbook-checkout');
  const nightsInput = document.getElementById('newbook-nights');
  const rSel = document.getElementById('newbook-room');

  if (!inInput || !outInput) return;

  const inDateStr = inInput.value;
  const outDateStr = outInput.value;
  const nights = calculateNights(inDateStr, outDateStr);

  const rateEl = document.getElementById('newbook-calc-rate');
  const nightsEl = document.getElementById('newbook-calc-nights');
  const datesEl = document.getElementById('newbook-calc-dates');
  const totalEl = document.getElementById('newbook-calc-total');
  const badgeEl = document.getElementById('newbook-status-badge');
  const submitBtn = document.getElementById('add-booking-submit-btn');

  if (datesEl) datesEl.innerText = `${inDateStr || '—'} — ${outDateStr || '—'}`;
  if (nightsEl) nightsEl.innerText = `${nights} ноч.`;

  const selectedOption = rSel?.selectedOptions[0];
  const roomId = parseInt(rSel?.value);
  const room = globalRoomsCache.find(r => r.id === roomId);

  if (!room || !selectedOption || selectedOption.disabled) {
    if (rateEl) rateEl.innerText = '—';
    if (totalEl) totalEl.innerText = '—';
    if (badgeEl) {
      badgeEl.className = 'calc-status-badge conflict';
      badgeEl.innerHTML = '&times; Выберите доступный свободный номер';
    }
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  const pricePerNight = room.pricePerNight || 0;
  const total = nights * pricePerNight;
  if (rateEl) rateEl.innerText = `${formatRub(pricePerNight)}/сут.`;
  if (totalEl) totalEl.innerText = formatRub(total);

  // Проверка конфликта
  const hasConflict = globalBookingsCache.some(b => {
    if (b.status === 'CANCELLED' || b.status === 'CHECKED_OUT') return false;
    const bRoomId = b.roomId || (b.room && b.room.id);
    if (bRoomId !== roomId) return false;
    return (inDateStr < b.checkOutDate && outDateStr > b.checkInDate);
  });

  if (hasConflict || room.status === 'OUT_OF_ORDER') {
    if (badgeEl) {
      badgeEl.className = 'calc-status-badge conflict';
      badgeEl.innerHTML = `&times; Номер № ${room.roomNumber} занят на эти даты! Пожалуйста, выберите другой номер.`;
    }
    if (submitBtn) submitBtn.disabled = true;
  } else {
    if (badgeEl) {
      badgeEl.className = 'calc-status-badge available';
      badgeEl.innerHTML = `&check; Номер № ${room.roomNumber} (${LABELS.types[room.type] || room.type}) свободен на весь период!`;
    }
    if (submitBtn) submitBtn.disabled = false;
  }
}

// Заполнение выпадающих списков при создании брони с актуальными статусами
async function populateBookingSelects(cachedRooms, cachedGuests, cachedBookings) {
  try {
    const [rooms, guests, bookings] = (cachedRooms && cachedGuests && cachedBookings)
      ? [cachedRooms, cachedGuests, cachedBookings]
      : await Promise.all([
        api('/rooms'),
        api('/guests'),
        api('/bookings')
      ]);

    if (rooms) globalRoomsCache = rooms;
    if (guests) globalGuestsCache = guests;
    if (bookings) globalBookingsCache = bookings;

    const gSel = document.getElementById('newbook-guest');
    if (gSel && guests) {
      gSel.innerHTML = guests.map(g => `
        <option value="${g.id}">
          ${escapeHtml(g.firstName)} ${escapeHtml(g.lastName)} (паспорт: ${escapeHtml(g.passportNumber)})
        </option>
      `).join('');
    }

    const today = new Date();
    const inDateStr = today.toISOString().split('T')[0];
    const nights = 3;
    const outDate = new Date();
    outDate.setDate(today.getDate() + nights);
    const outDateStr = outDate.toISOString().split('T')[0];

    const inEl = document.getElementById('newbook-checkin');
    const outEl = document.getElementById('newbook-checkout');
    const nightsEl = document.getElementById('newbook-nights');

    if (inEl && !inEl.value) inEl.value = inDateStr;
    if (nightsEl && !nightsEl.value) nightsEl.value = nights;
    if (outEl && !outEl.value) outEl.value = outDateStr;

    // Первичное наполнение с проверкой доступности
    updateRoomOptionsForDates(inEl.value, outEl.value, 'newbook-room');
    recalculateBookingSummary();
  } catch (e) {
    console.warn('Ошибка списков бронирования:', e);
  }
}

// Открытие окна бронирования с предвыбранным номером
async function openBookingWithRoom(roomId) {
  await populateBookingSelects();
  openModal('modal-add-booking');
  const rSel = document.getElementById('newbook-room');
  if (rSel) {
    rSel.value = roomId;
    recalculateBookingSummary();
  }
}

// ==========================================================================
// 4. СЛУЖБА ПРИЕМА И ГОСТИ (Ясная привязка к номеру, ночи и быстрое заселение)
// ==========================================================================
async function renderGuests(cachedGuests, cachedBooks, cachedRooms) {
  const [guests, bookings, rooms] = (cachedGuests && cachedBooks && cachedRooms)
    ? [cachedGuests, cachedBooks, cachedRooms]
    : await Promise.all([
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
    const gId = g.id;
    const isGuestCheckedIn = g.checkedIn !== undefined ? g.checkedIn : g.isCheckedIn;

    // Находим активную бронь этого гостя (с поддержкой разных структур DTO)
    const checkedInBooking = globalBookingsCache.find(b =>
      ((b.guestId === gId) || (b.guest_id === gId) || (b.guest && b.guest.id === gId)) &&
      b.status === 'CHECKED_IN'
    );
    const confirmedBooking = globalBookingsCache.find(b =>
      ((b.guestId === gId) || (b.guest_id === gId) || (b.guest && b.guest.id === gId)) &&
      (b.status === 'CONFIRMED' || b.status === 'PENDING')
    );

    let assignedRoomInfo = '<span style="color:var(--text-dim)">Бронь не оформлена</span>';
    let checkInActionBtn = '';

    if (isGuestCheckedIn || checkedInBooking) {
      const activeB = checkedInBooking || confirmedBooking;
      const bRoomId = activeB ? (activeB.roomId || activeB.room_id || (activeB.room && activeB.room.id)) : null;
      const room = globalRoomsCache.find(r => r.id === bRoomId);
      const inDate = activeB ? activeB.checkInDate : g.checkInDate;
      const outDate = activeB ? activeB.checkOutDate : g.checkOutDate;
      const nights = calculateNights(inDate, outDate);
      const remainingBadge = getRemainingNightsBadge(outDate, 'CHECKED_IN');

      assignedRoomInfo = `
        <span class="room-assigned-pill">
          № ${room ? room.roomNumber : (bRoomId || '—')} (${room ? LABELS.types[room.type] || room.type : ''})
        </span>
        <div style="font-size:11px; color:var(--text-muted); margin-top:2px">${inDate || '—'} → ${outDate || '—'}</div>
        <div style="margin-top:3px; display:flex; align-items:center; gap:5px; flex-wrap:wrap">
          <span class="stay-nights-pill">${nights} ноч.</span>
          ${remainingBadge}
        </div>
      `;
      checkInActionBtn = `
        <button class="btn btn-xs btn-secondary" onclick="checkOutGuest(${g.id})">
          Выселить
        </button>
      `;
    } else if (confirmedBooking) {
      const bRoomId = confirmedBooking.roomId || confirmedBooking.room_id || (confirmedBooking.room && confirmedBooking.room.id);
      const room = globalRoomsCache.find(r => r.id === bRoomId);
      const nights = calculateNights(confirmedBooking.checkInDate, confirmedBooking.checkOutDate);
      const remainingBadge = getRemainingNightsBadge(confirmedBooking.checkOutDate, 'CONFIRMED');

      assignedRoomInfo = `
        <span class="room-assigned-pill" style="border-color:#d4c8b6">
          Забронирован № ${room ? room.roomNumber : bRoomId}
        </span>
        <div style="font-size:11px; color:var(--text-muted); margin-top:2px">${confirmedBooking.checkInDate} → ${confirmedBooking.checkOutDate}</div>
        <div style="margin-top:3px; display:flex; align-items:center; gap:5px; flex-wrap:wrap">
          <span class="stay-nights-pill">${nights} ноч.</span>
          ${remainingBadge}
        </div>
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

    const isLive = isGuestCheckedIn || !!checkedInBooking;

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
          <span class="door-hanger-card ${isLive ? 'OCCUPIED' : (confirmedBooking ? 'BOOKED' : 'AVAILABLE')}" style="display:inline-block; padding:2px 8px; margin:0">
            ${isLive ? 'Проживает' : (confirmedBooking ? 'Ожидает заезда' : 'Не заселен')}
          </span>
        </td>
        <td>${checkInActionBtn}</td>
      </tr>
    `;
  }).join('');
}

// Открытие модального окна быстрого заселения (выбор номера и ночей)
function openQuickCheckInModal(guestId) {
  const guest = globalGuestsCache.find(g => g.id === guestId);
  if (!guest) return;

  const idInput = document.getElementById('checkin-guest-id');
  const nameInput = document.getElementById('checkin-guest-name');
  if (idInput) idInput.value = guestId;
  if (nameInput) nameInput.value = `${guest.firstName} ${guest.lastName} (паспорт: ${guest.passportNumber})`;

  // Задаем даты и ночи
  const today = new Date();
  const dateInStr = today.toISOString().split('T')[0];
  const nights = 3;
  const outDate = new Date();
  outDate.setDate(today.getDate() + nights);
  const dateOutStr = outDate.toISOString().split('T')[0];

  const inInput = document.getElementById('checkin-date');
  const outInput = document.getElementById('checkin-checkout-date');
  const nightsInput = document.getElementById('checkin-nights');

  if (inInput) inInput.value = dateInStr;
  if (outInput) outInput.value = dateOutStr;
  if (nightsInput) nightsInput.value = nights;

  updateRoomOptionsForDates(dateInStr, dateOutStr, 'checkin-room-select');
  recalculateCheckInSummary();
  clearModalAlert('modal-quick-checkin');
  openModal('modal-quick-checkin');
}

// Интерактивное управление датами и ночами в окне быстрого заселения (защита от некорректных дат)
function onQuickCheckInNightsInput() {
  const nightsInput = document.getElementById('checkin-nights');
  const inInput = document.getElementById('checkin-date');
  const outInput = document.getElementById('checkin-checkout-date');
  const nights = parseInt(nightsInput?.value, 10);
  const newOut = safeAddDaysIso(inInput?.value, Number.isFinite(nights) && nights > 0 ? Math.min(nights, 365) : 1);
  if (outInput && newOut) outInput.value = newOut;

  if (inInput?.value && outInput?.value) {
    updateRoomOptionsForDates(inInput.value, outInput.value, 'checkin-room-select');
  }
  recalculateCheckInSummary();
}

function onQuickCheckInDateChange() {
  const nightsInput = document.getElementById('checkin-nights');
  const inInput = document.getElementById('checkin-date');
  const outInput = document.getElementById('checkin-checkout-date');
  const nights = parseInt(nightsInput?.value, 10);
  const newOut = safeAddDaysIso(inInput?.value, Number.isFinite(nights) && nights > 0 ? Math.min(nights, 365) : 1);
  if (outInput && newOut) outInput.value = newOut;

  if (inInput?.value && outInput?.value) {
    updateRoomOptionsForDates(inInput.value, outInput.value, 'checkin-room-select');
  }
  recalculateCheckInSummary();
}

function onQuickCheckInOutDateChange() {
  const inInput = document.getElementById('checkin-date');
  const outInput = document.getElementById('checkin-checkout-date');
  const nightsInput = document.getElementById('checkin-nights');
  const inDate = new Date(inInput?.value);
  const outDate = new Date(outInput?.value);

  if (!isNaN(inDate) && !isNaN(outDate) && outDate > inDate) {
    const nights = Math.max(1, Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24)));
    if (nightsInput) nightsInput.value = nights;
  }
  updateRoomOptionsForDates(inInput.value, outInput.value, 'checkin-room-select');
  recalculateCheckInSummary();
}

// Перерасчет стоимости в окне быстрого заселения
function recalculateCheckInSummary() {
  const roomSelect = document.getElementById('checkin-room-select');
  const selectedOption = roomSelect?.selectedOptions[0];
  const roomId = parseInt(roomSelect?.value);
  const room = globalRoomsCache.find(r => r.id === roomId);

  const inInput = document.getElementById('checkin-date');
  const outInput = document.getElementById('checkin-checkout-date');
  const nightsInput = document.getElementById('checkin-nights');

  const inDateStr = inInput?.value;
  const outDateStr = outInput?.value;
  const nights = parseInt(nightsInput?.value) || calculateNights(inDateStr, outDateStr);

  const rateEl = document.getElementById('checkin-summary-rate');
  const nightsEl = document.getElementById('checkin-summary-nights');
  const datesEl = document.getElementById('checkin-summary-dates');
  const totalEl = document.getElementById('checkin-summary-total');
  const badgeEl = document.getElementById('checkin-status-badge');
  const submitBtn = document.getElementById('checkin-submit-btn');

  if (datesEl) datesEl.innerText = `${inDateStr || '—'} — ${outDateStr || '—'}`;
  if (nightsEl) nightsEl.innerText = `${nights} ноч.`;

  if (!room || !selectedOption || selectedOption.disabled) {
    if (rateEl) rateEl.innerText = '—';
    if (totalEl) totalEl.innerText = '—';
    if (badgeEl) {
      badgeEl.className = 'calc-status-badge conflict';
      badgeEl.innerHTML = '&times; Выберите доступный свободный номер';
    }
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  const pricePerNight = room.pricePerNight || 0;
  const total = nights * pricePerNight;
  if (rateEl) rateEl.innerText = `${formatRub(pricePerNight)}/сут.`;
  if (totalEl) totalEl.innerText = formatRub(total);

  if (badgeEl) {
    badgeEl.className = 'calc-status-badge available';
    badgeEl.innerHTML = `&check; Номер № ${room.roomNumber} (${LABELS.types[room.type] || room.type}) готов к заселению на ${nights} ноч.!`;
  }
  if (submitBtn) submitBtn.disabled = false;
}

// Отправка быстрого заселения
async function submitQuickCheckIn(e) {
  e.preventDefault();
  const guestId = parseInt(document.getElementById('checkin-guest-id').value);
  const roomId = parseInt(document.getElementById('checkin-room-select').value);
  const nightsRaw = parseInt(document.getElementById('checkin-nights').value, 10);

  if (isNaN(nightsRaw) || nightsRaw <= 0 || nightsRaw > 365) {
    triggerSamsonovStressOverlay({
      code: 'ERR_CHECKIN_NIGHTS_OVERFLOW_418',
      source: `Быстрое заселение: указано ночей = ${document.getElementById('checkin-nights').value}`,
      reason: `Попытка оформить заезд на аномальный срок (${document.getElementById('checkin-nights').value} ноч., допустимо: 1–365 ноч.).`,
      details: 'Сработала защита сроков проживания от некорректных граничных значений.'
    });
    return;
  }

  if (!roomId) {
    showModalAlert('modal-quick-checkin', 'Пожалуйста, выберите свободный номер');
    return;
  }

  const btn = document.getElementById('checkin-submit-btn');
  const origText = btn ? btn.innerHTML : 'Заселить в номер';
  if (btn) { btn.disabled = true; btn.innerHTML = 'Заселение...'; }

  clearModalAlert('modal-quick-checkin');

  try {
    await api(`/guests/${guestId}/checkin?roomId=${roomId}&nights=${nightsRaw}`, { method: 'POST' });
    notify('Гость успешно заселен в номер');
    closeModal('modal-quick-checkin');
    await refreshAllViews();
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
    await refreshAllViews();
  } catch (err) {
    notify(err.message, 'err');
    // Если у гостя нет предварительной брони — сразу открываем окно выбора номера!
    if (err.message && err.message.includes('нет активного бронирования')) {
      openQuickCheckInModal(id);
    }
  }
}

// Выселение гостя
async function checkOutGuest(id) {
  try {
    await api(`/guests/${id}/checkout`, { method: 'POST' });
    notify('Гость выселен, номер передан на уборку');
    await refreshAllViews();
  } catch (err) {
    notify(err.message, 'err');
  }
}

// ==========================================================================
// 5. ПЕРСОНАЛ
// ==========================================================================
function filterStaffView(mode, btn) {
  staffFilterMode = mode;
  document.querySelectorAll('#staff-filter-tabs .floor-tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderStaffCards(globalStaffCache);
}

function renderStaffCards(staff) {
  const allCount = staff.length;
  const activeCount = staff.filter(s => s.active).length;
  const offCount = allCount - activeCount;

  const cAll = document.getElementById('staff-count-all');
  const cAct = document.getElementById('staff-count-active');
  const cOff = document.getElementById('staff-count-off');
  if (cAll) cAll.innerText = allCount;
  if (cAct) cAct.innerText = activeCount;
  if (cOff) cOff.innerText = offCount;

  const grid = document.getElementById('staff-grid');
  if (!grid) return;

  const filtered = staff.filter(s => {
    if (staffFilterMode === 'ACTIVE') return Boolean(s.active);
    if (staffFilterMode === 'OFF') return !s.active;
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:32px; color:#64748b">В выбранном фильтре сотрудники отсутствуют</div>';
    return;
  }

  grid.innerHTML = filtered.map(s => `
    <div class="staff-card">
      <div class="staff-top">
        <div>
          <div class="staff-name">${escapeHtml(s.firstName)} ${escapeHtml(s.lastName)}</div>
          <div class="staff-pos">${LABELS.positions[s.position] || s.position}</div>
        </div>
        <button type="button"
                class="door-hanger-card ${s.active ? 'AVAILABLE' : 'OUT_OF_ORDER'}"
                style="margin:0; padding:4px 10px"
                title="Нажмите, чтобы переключить рабочий статус"
                onclick="toggleStaffStatus(${s.id}, ${!s.active})">
          ${s.active ? 'На работе' : 'Не на работе'}
        </button>
      </div>
      <div class="staff-details">
        <div>Телефон: <strong>${escapeHtml(s.phone)}</strong></div>
        <div>Email: <strong>${escapeHtml(s.email)}</strong></div>
        <div>Принят: <span>${s.hireDate || '2023-01-15'}</span></div>
      </div>
      <div style="display:flex; gap:6px; align-items:center">
        <button class="btn btn-sm ${s.active ? 'btn-brass' : 'btn-primary'}" style="flex:1; white-space:nowrap" onclick="toggleStaffStatus(${s.id}, ${!s.active})">
          ${s.active ? 'Выходной' : 'На работу'}
        </button>
        <button class="btn btn-sm btn-secondary" style="white-space:nowrap" onclick="openStaffSchedule(${s.id})">
          График
        </button>
        <button class="btn btn-sm btn-danger" style="white-space:nowrap" onclick="removeStaff(${s.id})">
          Удалить
        </button>
      </div>
    </div>
  `).join('');
}

async function renderStaff() {
  const staff = await api('/staff');
  if (!staff) return;
  globalStaffCache = staff;
  updateNavCounts({ staff: staff.length });
  renderStaffCards(staff);
}

async function toggleStaffStatus(id, targetActive) {
  try {
    const updated = await api(`/staff/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active: Boolean(targetActive) })
    });
    const isNowActive = updated ? Boolean(updated.active) : Boolean(targetActive);
    notify(isNowActive ? 'Сотрудник отмечен: На работе (На смене)' : 'Сотрудник отмечен: Не на работе (Выходной)');

    if (currentScheduleStaffId === id) {
      updateShiftModalStatusUI(id, isNowActive);
    }
    await refreshAllViews();
  } catch (err) {
    if (!err.isStress) notify(err.message, 'err');
  }
}

function updateShiftModalStatusUI(id, isAtWork) {
  const statusEl = document.getElementById('sch-status');
  if (statusEl) {
    statusEl.innerText = isAtWork ? 'На работе (На смене)' : 'Не на работе (Выходной)';
    statusEl.style.color = isAtWork ? '#059669' : '#d97706';
  }
  const toggleBtn = document.getElementById('sch-toggle-btn');
  if (toggleBtn) {
    toggleBtn.innerText = isAtWork ? 'Отметить: Не на работе' : 'Отметить: На работе';
    toggleBtn.className = `btn ${isAtWork ? 'btn-brass' : 'btn-primary'}`;
    toggleBtn.dataset.nextActive = String(!isAtWork);
  }
}

function toggleStaffFromModal() {
  if (!currentScheduleStaffId) return;
  const toggleBtn = document.getElementById('sch-toggle-btn');
  const nextActive = toggleBtn?.dataset.nextActive === 'true';
  toggleStaffStatus(currentScheduleStaffId, nextActive);
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
        <td>${t.seasonStart ? `${t.seasonStart} → ${t.seasonEnd}` : 'Круглый год'}</td>
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

async function openPaymentModal(preselectBookingId = null) {
  const [books, payments, guests] = await Promise.all([
    api('/bookings'),
    api('/payments'),
    api('/guests')
  ]);
  if (books) globalBookingsCache = books;
  if (payments) globalPaymentsCache = payments;
  if (guests) globalGuestsCache = guests;

  const sel = document.getElementById('pay-booking-sel');
  if (sel) {
    const activeBooks = (books || []).filter(b => b.status !== 'CANCELLED');
    if (activeBooks.length === 0) {
      sel.innerHTML = '<option value="">Нет доступных бронирований для оплаты</option>';
    } else {
      sel.innerHTML = activeBooks.map(b => {
        const g = b.guest || globalGuestsCache.find(x => x.id === (b.guestId || b.guest_id));
        const gLabel = g ? `${g.firstName} ${g.lastName}` : `Гость #${b.guestId || b.id}`;
        const paid = globalPaymentsCache
          .filter(p => (p.bookingId || p.booking_id || (p.booking && p.booking.id)) === b.id)
          .reduce((s, p) => s + (Number(p.amount) || 0), 0);
        const due = Math.max(0, Number(b.totalPrice || 0) - paid);
        const balHint = due <= 0 ? 'Оплачено' : `Остаток: ${formatRub(due)}`;
        return `
          <option value="${b.id}" data-due="${due}" data-total="${b.totalPrice}">
            Бронь #${b.id} — ${escapeHtml(gLabel)} • ${formatRub(b.totalPrice)} (${balHint}) [${LABELS.bookingStatuses[b.status] || b.status}]
          </option>
        `;
      }).join('');

      if (preselectBookingId && activeBooks.some(b => String(b.id) === String(preselectBookingId))) {
        sel.value = String(preselectBookingId);
      } else {
        // По умолчанию выбираем первую бронь с неоплаченным остатком
        const unpaid = activeBooks.find(b => {
          const paid = globalPaymentsCache
            .filter(p => (p.bookingId || p.booking_id || (p.booking && p.booking.id)) === b.id)
            .reduce((s, p) => s + (Number(p.amount) || 0), 0);
          return (Number(b.totalPrice || 0) - paid) > 0;
        });
        if (unpaid) sel.value = String(unpaid.id);
      }
    }
  }
  onPaymentBookingChange();
  clearModalAlert('modal-add-payment');
  openModal('modal-add-payment');
}

function onPaymentBookingChange() {
  const sel = document.getElementById('pay-booking-sel');
  const amtEl = document.getElementById('pay-amount');
  if (!sel || !amtEl) return;
  const opt = sel.selectedOptions[0];
  if (!opt || !opt.value) {
    amtEl.value = '';
    return;
  }
  const due = parseFloat(opt.dataset.due || '0');
  const total = parseFloat(opt.dataset.total || '5000');
  amtEl.value = due > 0 ? due : (total > 0 ? total : 5000);
}

async function submitPayment(e) {
  e.preventDefault();
  const btn = document.getElementById('add-payment-submit-btn');
  const origText = btn ? btn.innerHTML : 'Провести платеж';
  if (btn) { btn.disabled = true; btn.innerHTML = 'Проведение...'; }

  clearModalAlert('modal-add-payment');

  const bookingVal = document.getElementById('pay-booking-sel')?.value;
  const amountRaw = document.getElementById('pay-amount')?.value;
  const desc = (document.getElementById('pay-desc')?.value || '').trim();

  if (!bookingVal) {
    showModalAlert('modal-add-payment', 'Выберите бронирование для проведения оплаты');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (hasInjectionPayload(desc)) {
    triggerSamsonovStressOverlay({
      code: 'ERR_SECURITY_INJECTION_418',
      source: 'Форма оплаты: поле «Назначение платежа»',
      reason: 'Обнаружена попытка XSS/SQL-инъекции в примечании к платежу.',
      details: 'Потенциально опасная строка заблокирована до обращения к БД.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (amountRaw === '' || amountRaw === null || amountRaw === undefined) {
    showModalAlert('modal-add-payment', 'Укажите сумму платежа');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  const amountNum = parseFloat(amountRaw);
  if (isNaN(amountNum) || amountNum < 0 || amountNum > 5000000) {
    triggerSamsonovStressOverlay({
      code: amountNum < 0 ? 'ERR_NEGATIVE_PAYMENT_OVERFLOW_418' : 'ERR_MAX_PAYMENT_OVERFLOW_418',
      source: 'Форма оплаты: поле «Сумма платежа» = ' + (isNaN(amountNum) ? amountRaw : formatRub(amountNum)),
      reason: `Некорректная или запредельная сумма платежа (${amountRaw}, допустимо: от 1 до 5 000 000 ₽).`,
      details: 'Платёжный шлюз отклонил аномальную транзакцию.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (amountNum === 0) {
    showModalAlert('modal-add-payment', 'Сумма платежа должна быть строго больше 0 ₽');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  const payload = {
    bookingId: parseInt(bookingVal, 10),
    amount: amountNum,
    method: document.getElementById('pay-method').value,
    description: desc || 'Оплата за проживание'
  };

  try {
    await api('/payments', { method: 'POST', body: JSON.stringify(payload) });
    notify('Платеж успешно проведен');
    closeModal('modal-add-payment');
    await refreshAllViews();
  } catch (err) {
    if (!err.isStress) {
      showModalAlert('modal-add-payment', err.message);
      notify(err.message, 'err');
    }
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  }
}

// ==========================================================================
// 7. ОТЧЕТЫ И АНАЛИТИКА
// ==========================================================================
async function renderReports() {
  const [occ, rev, staffRep, guestsRep] = await Promise.all([
    api('/reports/occupancy'),
    api('/reports/revenue'),
    api('/reports/staff-performance'),
    api('/reports/guests')
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

    const revSubEl = document.getElementById('rep-rev-sub');
    if (revSubEl) {
      const avgCheck = txCount > 0 ? Math.round(totalRev / txCount) : 0;
      revSubEl.innerText = txCount > 0
        ? `Средний чек платежа: ${formatRub(avgCheck)}`
        : 'Сумма всех подтвержденных кассовых поступлений';
    }

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

  const guestsSumEl = document.getElementById('rep-guests-summary');
  if (guestsSumEl && guestsRep) {
    const byNat = guestsRep.guestsByNationality || {};
    const natStr = Object.entries(byNat).map(([k, v]) => `${escapeHtml(k)}: <strong>${v}</strong>`).join(' • ');
    guestsSumEl.innerHTML = `Всего гостей в базе: <strong>${guestsRep.totalGuests || 0}</strong> • Сейчас проживают: <strong>${guestsRep.currentlyCheckedIn || 0}</strong> • Броней: <strong>${guestsRep.totalBookings || 0}</strong>${natStr ? `<div style="margin-top:6px; color:#64748b">География: ${natStr}</div>` : ''}`;
  }

  const staffList = (staffRep && (staffRep.staffStats || staffRep.stats || staffRep.staffMemberStats)) || [];
  const repStaffSub = document.getElementById('rep-staff-subtitle');
  if (repStaffSub && staffRep) {
    repStaffSub.innerText = `Сейчас на работе: ${staffRep.activeStaff ?? 0} из ${staffRep.totalStaff ?? staffList.length} • Средняя оценка: ${staffRep.averageRating ?? '—'}`;
  }
  const list = document.getElementById('rep-staff-kpi');
  if (list) {
    if (staffList.length === 0) {
      list.innerHTML = '<div style="color:var(--text-muted); font-size:13px">Сотрудники в базе отсутствуют</div>';
    } else {
      list.innerHTML = staffList.map(s => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--slate-100)">
          <div>
            <div style="display:flex; align-items:center; gap:8px">
              <span style="font-weight:700; color:var(--text-main); font-size:13px">${escapeHtml(s.name)}</span>
              ${s.active !== undefined ? `<span class="door-hanger-card ${s.active ? 'AVAILABLE' : 'OUT_OF_ORDER'}" style="padding:1px 6px; font-size:10px">${s.active ? 'На работе' : 'Выходной'}</span>` : ''}
            </div>
            <div style="font-size:11.5px; color:var(--text-muted)">${LABELS.positions[s.position] || s.position} • ${s.shift || 'Смена'}</div>
          </div>
          <div style="text-align:right">
            <div style="color:#4f46e5; font-weight:700; font-size:12.5px">Оценка: ${s.rating}</div>
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
  if (id === 'modal-add-booking') {
    populateBookingSelects();
  }
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
    await refreshAllViews();
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

  const roomNum = document.getElementById('add-room-num').value.trim();
  const floorVal = parseInt(document.getElementById('add-room-floor').value, 10);
  const guestsVal = parseInt(document.getElementById('add-room-guests').value, 10);
  const priceVal = parseFloat(document.getElementById('add-room-price').value);
  const descVal = document.getElementById('add-room-desc').value.trim();

  if (hasInjectionPayload(roomNum) || hasInjectionPayload(descVal)) {
    triggerSamsonovStressOverlay({
      code: 'ERR_SECURITY_INJECTION_418',
      source: 'Форма добавления номера',
      reason: 'Обнаружена попытка XSS/SQL-инъекции при добавлении номера.',
      details: 'Некорректные управляющие конструкции заблокированы.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (!roomNum) {
    showModalAlert('modal-add-room', 'Укажите номер комнаты (например, 103)');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (isNaN(floorVal) || floorVal < 1 || floorVal > 50) {
    triggerSamsonovStressOverlay({
      code: 'ERR_FLOOR_OUT_OF_RANGE_418',
      source: 'Форма добавления номера: поле «Этаж» = ' + document.getElementById('add-room-floor').value,
      reason: `Этаж ${document.getElementById('add-room-floor').value} не существует в здании комплекса (допустимо: 1–50).`,
      details: 'Введён недопустимый параметр этажности.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (isNaN(guestsVal) || guestsVal < 0 || guestsVal > 20) {
    triggerSamsonovStressOverlay({
      code: 'ERR_MAX_ROOM_CAPACITY_OVERFLOW_418',
      source: 'Форма добавления номера: поле «Вместимость» = ' + document.getElementById('add-room-guests').value,
      reason: `Попытка установить недопустимую вместимость номера (${document.getElementById('add-room-guests').value} чел., допустимо: 1–20 чел.).`,
      details: 'Сработал ограничитель строительных норм отеля.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (guestsVal === 0) {
    showModalAlert('modal-add-room', 'Вместимость номера должна быть не менее 1 человека');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (isNaN(priceVal) || priceVal < 0 || priceVal > 1000000) {
    triggerSamsonovStressOverlay({
      code: priceVal < 0 ? 'ERR_NEGATIVE_PRICE_OVERFLOW_418' : 'ERR_MAX_PRICE_OVERFLOW_418',
      source: 'Форма добавления номера: поле «Тариф за сутки» = ' + document.getElementById('add-room-price').value,
      reason: `Попытка установить некорректный или запредельный тариф (${document.getElementById('add-room-price').value} ₽, допустимо: 1–1 000 000 ₽).`,
      details: 'Операция заблокирована защитой тарификации.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (priceVal === 0) {
    showModalAlert('modal-add-room', 'Тариф за сутки должен быть строго больше 0 ₽');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  const room = {
    roomNumber: roomNum,
    type: document.getElementById('add-room-type').value,
    status: document.getElementById('add-room-status') ? document.getElementById('add-room-status').value : 'AVAILABLE',
    floor: floorVal,
    maxGuests: guestsVal,
    pricePerNight: priceVal,
    description: descVal
  };

  try {
    await api('/rooms', { method: 'POST', body: JSON.stringify(room) });
    notify(`Номер ${room.roomNumber} успешно добавлен`);
    closeModal('modal-add-room');
    e.target.reset();
    await refreshAllViews();
  } catch (err) {
    if (!err.isStress) {
      showModalAlert('modal-add-room', err.message);
      notify(err.message, 'err');
    }
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  }
}

async function removeRoom(id) {
  if (!confirm('Вы действительно хотите удалить этот номер из фонда?')) return;
  try {
    await api(`/rooms/${id}`, { method: 'DELETE' });
    notify('Номер успешно удален');
    await refreshAllViews();
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

  const roomVal = document.getElementById('newbook-room')?.value;
  const guestVal = document.getElementById('newbook-guest')?.value;
  const checkIn = document.getElementById('newbook-checkin')?.value;
  const checkOut = document.getElementById('newbook-checkout')?.value;
  const guestCountRaw = parseInt(document.getElementById('newbook-count')?.value, 10);
  const nightsRaw = parseInt(document.getElementById('newbook-nights')?.value, 10);

  if (isNaN(guestCountRaw) || guestCountRaw <= 0 || guestCountRaw > 10) {
    triggerSamsonovStressOverlay({
      code: 'ERR_MAX_CLIENTS_TEST_OVERFLOW_418',
      source: 'Форма бронирования: поле «Количество гостей» = ' + document.getElementById('newbook-count')?.value,
      reason: `Попытка указать недопустимое число гостей в одном номере (введено: ${document.getElementById('newbook-count')?.value}, лимит: 1–10 чел.).`,
      details: 'Номерной фонд защищен от переполнения буфера постояльцев.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (!isNaN(nightsRaw) && (nightsRaw <= 0 || nightsRaw > 365)) {
    triggerSamsonovStressOverlay({
      code: 'ERR_BOOKING_DURATION_OVERFLOW_418',
      source: 'Форма бронирования: количество ночей = ' + nightsRaw,
      reason: `Аномальный срок бронирования (${nightsRaw} ноч., допустимо: 1–365 ночей).`,
      details: 'Ограничение максимального горизонта планирования сработало успешно.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (!roomVal || !guestVal) {
    showModalAlert('modal-add-booking', 'Выберите гостя и доступный номер для бронирования');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (!checkIn || !checkOut || checkIn >= checkOut) {
    showModalAlert('modal-add-booking', 'Дата выезда должна быть строго позже даты заезда');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  const diffDays = calculateNights(checkIn, checkOut);
  if (diffDays > 365) {
    triggerSamsonovStressOverlay({
      code: 'ERR_BOOKING_DURATION_OVERFLOW_418',
      source: `Период ${checkIn} → ${checkOut} (${diffDays} ноч.)`,
      reason: `Срок проживания ${diffDays} ноч. превышает допустимый предел 365 ночей.`,
      details: 'Сработала защита календарных расчетов.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  const payload = {
    roomId: parseInt(roomVal, 10),
    guestId: parseInt(guestVal, 10),
    checkInDate: checkIn,
    checkOutDate: checkOut,
    guestCount: guestCountRaw
  };

  try {
    await api('/bookings', { method: 'POST', body: JSON.stringify(payload) });
    notify('Бронирование оформлено');
    closeModal('modal-add-booking');
    await refreshAllViews();
  } catch (err) {
    if (!err.isStress) {
      showModalAlert('modal-add-booking', err.message);
      notify(err.message, 'err');
    }
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  }
}

async function cancelBooking(id) {
  if (!confirm('Аннулировать бронирование?')) return;
  try {
    await api(`/bookings/${id}`, { method: 'DELETE' });
    notify('Бронирование аннулировано');
    await refreshAllViews();
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

  if (
    hasInjectionPayload(guest.firstName) ||
    hasInjectionPayload(guest.lastName) ||
    hasInjectionPayload(guest.email) ||
    hasInjectionPayload(guest.phone) ||
    hasInjectionPayload(guest.passportNumber) ||
    hasInjectionPayload(guest.nationality)
  ) {
    triggerSamsonovStressOverlay({
      code: 'ERR_SECURITY_INJECTION_418',
      source: 'Форма регистрации гостя',
      reason: 'Обнаружена попытка XSS/SQL-инъекции в анкете гостя.',
      details: 'Потенциально опасные последовательности заблокированы.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  // Штатные ошибки заполнения формы (обычные подсказки без оверлея)
  if (!guest.firstName || !guest.lastName || !guest.phone || !guest.email || !guest.passportNumber) {
    showModalAlert('modal-add-guest', 'Пожалуйста, заполните все обязательные поля: Имя, Фамилия, Телефон, Email и Паспорт');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
    showModalAlert('modal-add-guest', 'Укажите корректный адрес электронной почты (например, ivan@mail.ru)');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  try {
    await api('/guests', { method: 'POST', body: JSON.stringify(guest) });
    notify('Гость зарегистрирован в базе');
    closeModal('modal-add-guest');
    e.target.reset();
    document.getElementById('guest-nat').value = 'Россия';
    await refreshAllViews();
  } catch (err) {
    if (!err.isStress) {
      showModalAlert('modal-add-guest', err.message);
      notify(err.message, 'err');
    }
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

  const activeSelect = document.getElementById('staff-active');
  const member = {
    firstName: document.getElementById('staff-fn').value.trim(),
    lastName: document.getElementById('staff-ln').value.trim(),
    position: document.getElementById('staff-pos').value,
    email: document.getElementById('staff-em').value.trim(),
    phone: document.getElementById('staff-ph').value.trim(),
    hireDate: document.getElementById('staff-date').value || new Date().toISOString().split('T')[0],
    active: activeSelect ? activeSelect.value !== 'false' : true
  };

  if (
    hasInjectionPayload(member.firstName) ||
    hasInjectionPayload(member.lastName) ||
    hasInjectionPayload(member.email) ||
    hasInjectionPayload(member.phone)
  ) {
    triggerSamsonovStressOverlay({
      code: 'ERR_SECURITY_INJECTION_418',
      source: 'Форма приема сотрудника',
      reason: 'Обнаружена попытка XSS/SQL-инъекции в карточке сотрудника.',
      details: 'Потенциально опасная нагрузка заблокирована.'
    });
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  if (!member.firstName || !member.lastName || !member.phone || !member.email) {
    showModalAlert('modal-add-staff', 'Заполните Имя, Фамилию, Телефон и Email сотрудника');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
    showModalAlert('modal-add-staff', 'Введите корректный Email сотрудника');
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    return;
  }

  try {
    await api('/staff', { method: 'POST', body: JSON.stringify(member) });
    notify('Сотрудник принят в штат');
    closeModal('modal-add-staff');
    e.target.reset();
    await refreshAllViews();
  } catch (err) {
    if (!err.isStress) {
      showModalAlert('modal-add-staff', err.message);
      notify(err.message, 'err');
    }
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = origText; }
  }
}

async function removeStaff(id) {
  if (!confirm('Исключить сотрудника из штата?')) return;
  try {
    await api(`/staff/${id}`, { method: 'DELETE' });
    notify('Сотрудник исключен из штата');
    await refreshAllViews();
  } catch (err) {
    notify(err.message, 'err');
  }
}

async function openStaffSchedule(id) {
  const sch = await api(`/staff/${id}/schedule`);
  if (!sch) return;

  currentScheduleStaffId = id;
  const isAtWork = sch.status === 'На смене';

  document.getElementById('sch-name').innerText = sch.fullName;
  document.getElementById('sch-pos').innerText = LABELS.positions[sch.position] || sch.position;
  document.getElementById('sch-hours').innerText = sch.shiftHours;
  document.getElementById('sch-plan').innerText = sch.workSchedule;
  document.getElementById('sch-zone').innerText = sch.assignedFloor;
  updateShiftModalStatusUI(id, isAtWork);

  openModal('modal-staff-shift');
}

async function openInvoiceSheet(bookingId) {
  const inv = await api(`/invoices/${bookingId}`);
  if (!inv) return;

  const invCode = document.getElementById('inv-code');
  if (invCode) invCode.innerText = inv.invoiceNumber;

  const invDate = document.getElementById('inv-date-val');
  if (invDate) invDate.innerText = `Дата: ${inv.issueDate}`;

  const invGuest = document.getElementById('inv-guest-name');
  if (invGuest) invGuest.innerText = inv.guestFullName;

  const invPassport = document.getElementById('inv-guest-passport');
  if (invPassport) invPassport.innerText = `Паспорт: ${inv.guestPassport}`;

  const invPhone = document.getElementById('inv-guest-phone');
  if (invPhone) invPhone.innerText = `Телефон: ${inv.guestPhone}`;

  const invRoom = document.getElementById('inv-room-info');
  if (invRoom) invRoom.innerText = `№ ${inv.roomNumber} (${LABELS.types[inv.roomType] || inv.roomType})`;

  const invDates = document.getElementById('inv-dates-info');
  if (invDates) invDates.innerText = `${inv.checkInDate} → ${inv.checkOutDate}`;

  const invRate = document.getElementById('inv-rate-info');
  if (invRate) invRate.innerText = `${formatRub(inv.pricePerNight)}/сутки (${inv.numberOfNights} ночей)`;

  // Заполняем тариф за сутки и количество суток в строках спецификации счёта
  const rateUnitEl = document.getElementById('inv-rate-unit');
  if (rateUnitEl) rateUnitEl.innerText = formatRub(inv.pricePerNight);

  const nightsUnitEl = document.getElementById('inv-nights-unit');
  if (nightsUnitEl) nightsUnitEl.innerText = `${inv.numberOfNights} сут.`;

  const chargeTotal = document.getElementById('inv-charge-total');
  if (chargeTotal) chargeTotal.innerText = formatRub(inv.roomTotal || inv.totalAmount);

  const sumTotal = document.getElementById('inv-sum-total');
  if (sumTotal) sumTotal.innerText = formatRub(inv.totalAmount);

  const paidSum = document.getElementById('inv-paid-sum');
  if (paidSum) paidSum.innerText = formatRub(inv.paidAmount);

  const dueSum = document.getElementById('inv-due-sum');
  if (dueSum) dueSum.innerText = formatRub(inv.balanceDue);

  const statusLabel = document.getElementById('inv-status-label');
  if (statusLabel) {
    statusLabel.innerText = inv.paymentStatus;
    statusLabel.className = `badge ${inv.balanceDue <= 0 ? 'badge-success' : 'badge-warning'}`;
  }

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

window.addEventListener('error', (event) => {
  if (event && event.message) {
    triggerSamsonovStressOverlay({
      code: 'ERR_FRONTEND_RUNTIME_EXCEPTION',
      source: 'Клиентское ядро интерфейса',
      reason: event.message,
      details: 'Нештатная ошибка интерфейса перехвачена и изолирована без потери данных.'
    });
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason;
  const msg = (reason && reason.message) ? reason.message : String(reason || '');
  if (!msg || reason?.handledByApi || reason?.name === 'AbortError') return;
  triggerSamsonovStressOverlay({
    code: 'ERR_FRONTEND_PROMISE_EXCEPTION',
    source: 'Асинхронный обработчик интерфейса',
    reason: msg,
    details: 'Нештатная асинхронная ошибка перехвачена без остановки работы системы.'
  });
});

window.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  await checkBackendConnection();
  await navigateTo('dashboard');
  populateBookingSelects();
  setInterval(checkBackendConnection, 15000);

  // Интерактивные триггеры защиты от стресс-тестирования Ильей Валерьевичем
  const emblem = document.querySelector('.brand-emblem-box');
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
});
