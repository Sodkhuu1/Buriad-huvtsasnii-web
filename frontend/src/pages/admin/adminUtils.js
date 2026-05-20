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
  submitted:           'Захиалга илгээгдсэн',
  under_review:        'Захиалга илгээгдсэн',
  needs_clarification: 'Захиалга илгээгдсэн',
  accepted:            'Захиалга баталсан',
  rejected:            'Захиалга татгалзсан',
  deposit_paid:        'Захиалга баталсан',
  in_production:       'Оёдол хийгдэж байна',
  ready:               'Хүргэлтэд бэлэн',
  shipped:             'Хүргэлтэд гарсан',
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
