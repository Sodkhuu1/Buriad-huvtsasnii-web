// DB-н order_status ENUM lowercase утгуудтай таарна
export const STATUS_LABEL = {
  submitted:            'Захиалга илгээгдсэн',
  under_review:         'Захиалга илгээгдсэн',
  needs_clarification:  'Захиалга илгээгдсэн',
  accepted:             'Захиалга баталсан',
  deposit_paid:         'Захиалга баталсан',
  in_production:        'Оёдол хийгдэж байна',
  ready:                'Хүргэлтэд бэлэн',
  shipped:              'Хүргэлтэд гарсан',
  delivered:            'Хүргэгдсэн',
  completed:            'Дууссан',
  rejected:             'Захиалга татгалзсан',
  cancelled:            'Цуцлагдсан',
}

export const statusBadgeClass = (status) =>
  `td-badge--${(status ?? '').toLowerCase()}`

export const TAILOR_ACTIONS = {
  accepted: [
    { label: 'Оёдол эхлүүлэх', next: 'in_production', style: 'primary' },
  ],
  deposit_paid: [
    { label: 'Оёдол эхлүүлэх', next: 'in_production', style: 'primary' },
  ],
  in_production: [
    { label: 'Хүргэлтэд бэлэн', next: 'ready', style: 'primary' },
  ],
  ready: [
    { label: 'Шууд хүргэгдсэн', next: 'delivered', style: 'primary' },
  ],
  shipped: [
    { label: 'Хүргэгдсэн', next: 'delivered', style: 'primary' },
  ],
}

export const SHIPMENT_MODE_LABEL = {
  pickup:  'Захиалагч өөрөө ирж авах',
  courier: '3-дагч хүргэлт',
}

export const MEASUREMENT_LABEL = {
  height:   'Өндөр',
  chest:    'Цээж',
  waist:    'Бүсэлхий',
  hip:      'Ташаа',
  sleeve:   'Гарын урт',
  shoulder: 'Мөрний өргөн',
}

export const SHIPMENT_STATUS_LABEL = {
  preparing:  'Бэлтгэгдэж байна',
  in_transit: 'Хүргэлтэд явж байна',
  delivered:  'Хүргэгдсэн',
  returned:   'Буцаагдсан',
}

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('mn-MN', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : ''
