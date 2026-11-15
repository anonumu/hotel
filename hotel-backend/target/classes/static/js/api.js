// Клиент для взаимодействия с REST API бэкенда

const API_BASE = (window.location.protocol === 'http:' || window.location.protocol === 'https:')
  ? `${window.location.origin}/api/v1`
  : 'http://localhost:8080/api/v1';

let isApiOnline = false;
let globalPaymentsCache = [];
let globalStaffCache = [];

// Справочники для отображения в интерфейсе
const LABELS = {
  types: {
    STANDARD: 'Стандарт',
    SUPERIOR: 'Супериор',
    DELUXE: 'Делюкс',
    SUITE: 'Люкс',
    PRESIDENTIAL: 'Президентский'
  },
  statuses: {
    AVAILABLE: 'Свободен',
    BOOKED: 'Бронь',
    OCCUPIED: 'Занят',
    CLEANING: 'Уборка',
    OUT_OF_ORDER: 'Ремонт'
  },
  bookingStatuses: {
    CONFIRMED: 'Подтверждено',
    CHECKED_IN: 'Проживает',
    CHECKED_OUT: 'Выехал',
    CANCELLED: 'Отменено'
  },
  positions: {
    MANAGER: 'Менеджер',
    RECEPTIONIST: 'Портье',
    MAID: 'Горничная',
    ACCOUNTANT: 'Бухгалтер',
    ADMIN: 'Администратор'
  },
  paymentMethods: {
    CASH: 'Наличные',
    CARD: 'Банковская карта',
    TRANSFER: 'Безналичный расчет'
  }
};
LABELS.roomStatuses = LABELS.statuses;
LABELS.methods = LABELS.paymentMethods;

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hasInjectionPayload(value) {
  if (!value || typeof value !== 'string') return false;
  const p = /(<\s*script\b|<\/\s*script>|javascript\s*:|onerror\s*=|onload\s*=|\bdrop\s+table\b|\btruncate\s+table\b|\bdelete\s+from\b|\bunion\s+select\b|'\s*or\s*'1'\s*=\s*'1|"\s*or\s*"1"\s*=\s*"1)/i;
  return p.test(value);
}

function safeAddDaysIso(baseDateStr, days) {
  const d = baseDateStr ? new Date(baseDateStr) : new Date();
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  d.setDate(d.getDate() + Number(days));
  return d.toISOString().split('T')[0];
}

function formatRub(val) {
  return `${(Number(val) || 0).toLocaleString('ru-RU')} ₽`;
}

// Проверка доступности Spring Boot сервера
async function checkBackendConnection(manual = false) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(`${API_BASE}/system/health`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      isApiOnline = true;
      syncServerStatus(true);
      if (manual) notify('Связь с сервером установлена');
      return true;
    }
  } catch (e) {
    // Сервер пока не отвечает
  }
  isApiOnline = false;
  syncServerStatus(false);
  if (manual) notify('Сервер не отвечает (проверьте порт 8080)', 'err');
  return false;
}

function syncServerStatus(online) {
  const dot = document.getElementById('server-status-dot');
  const txt = document.getElementById('server-status-label');
  if (dot) dot.className = `server-pulse-dot ${online ? '' : 'offline'}`;
  if (txt) txt.innerText = online ? '8080 OK' : 'Нет связи';
}

// Базовый метод отправки HTTP-запросов к API
async function api(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  if (typeof checkFloodProtection === 'function' && !checkFloodProtection(method)) {
    throw new Error('Илья Валерьевич, перестаньте насиловать мой проект! Зафиксирован флуд запросами.');
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    isApiOnline = true;
    syncServerStatus(true);
  } catch (networkError) {
    isApiOnline = false;
    syncServerStatus(false);
    notify('Ошибка сети: сервер недоступен', 'err');
    throw new Error('Сервер недоступен на порту 8080');
  }

  if (!res.ok) {
    let errorMsg = `Ошибка (${res.status})`;
    let errJson = null;
    try {
      errJson = await res.json();
      if (errJson && errJson.message) errorMsg = errJson.message;
      else if (errJson && errJson.error) errorMsg = errJson.error;
    } catch (_) {}

    const errCode = errJson?.errorCode || '';
    const isStressOrCrash =
      res.status === 418 ||
      res.status === 429 ||
      res.status >= 500 ||
      errCode.startsWith('ERR_');

    if (isStressOrCrash && typeof triggerSamsonovStressOverlay === 'function') {
      triggerSamsonovStressOverlay({
        code: errCode || `ERR_HTTP_${res.status}`,
        source: `${method} ${endpoint}`,
        reason: errorMsg,
        details: errorMsg
      });
    }

    const error = new Error(errorMsg);
    error.status = res.status;
    error.data = errJson;
    throw error;
  }

  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Всплывающие уведомления
function notify(msg, type = 'ok') {
  const rack = document.getElementById('toast-rack');
  if (!rack) return;
  const t = document.createElement('div');
  t.className = `toast ${type === 'err' ? 'error' : ''}`;
  t.innerText = msg;
  rack.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(-6px)';
    setTimeout(() => t.remove(), 250);
  }, 3200);
}
