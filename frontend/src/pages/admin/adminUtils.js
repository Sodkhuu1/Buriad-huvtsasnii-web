// adminUtils.js — Admin dashboard labels & helpers

export const ROLE_LABEL = {
  customer: 'Харилцагч',
  tailor:   'Оёдолчин',
  admin:    'Администратор',
}

export const USER_STATUS_LABEL = {
  active:   'Идэвхтэй',
  inactive: 'Идэвхгүй',
  blocked:  'Хаагдсан',
}

export const ORDER_STATUS_LABEL = {
  draft:               'Ноорог',
  submitted:           'Шинэ',
  under_review:        'Шалгаж байна',
  needs_clarification: 'Тодруулга шаардлагатай',
  accepted:            'Зөвшөөрсөн',
  rejected:            'Татгалзсан',
  deposit_paid:        'Урьдчилгаа төлсөн',
  in_production:       'Үйлдвэрлэлд',
  ready:               'Бэлэн',
  shipped:             'Илгээгдсэн',
  delivered:           'Хүргэгдсэн',
  completed:           'Дууссан',
  cancelled:           'Цуцлагдсан',
}

export const roleBadgeClass = (role) => ({
  customer: 'ad-badge--customer',
  tailor:   'ad-badge--tailor',
  admin:    'ad-badge--admin',
}[role] ?? '')

export const userStatusBadgeClass = (status) => ({
  active:   'ad-badge--active',
  inactive: 'ad-badge--inactive',
  blocked:  'ad-badge--blocked',
}[status] ?? '')

export const orderStatusBadgeClass = (status) => `ad-badge--order-${status}`

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('mn-MN') : '—'

export const fmtMoney = (n) =>
  n ? `${Number(n).toLocaleString()}₮` : '—'
