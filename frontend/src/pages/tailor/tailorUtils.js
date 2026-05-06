// DB-н order_status ENUM lowercase утгуудтай таарна
export const STATUS_LABEL = {
  submitted:            'Захиалга илгээгдсэн',
  under_review:         'Захиалга илгээгдсэн',
  needs_clarification:  'Захиалга илгээгдсэн',
  accepted:             'Захиалга баталсан',
  deposit_paid:         'Захиалга баталсан',
  in_production:        'Хийгдэж эхэлсэн',
  ready:                'Хүлээлгэж өгсөн',
  shipped:              'Хүлээлгэж өгсөн',
  delivered:            'Хүлээлгэж өгсөн',
  completed:            'Хүлээлгэж өгсөн',
  rejected:             'Захиалга татгалзсан',
  cancelled:            'Цуцлагдсан',
}

export const statusBadgeClass = (status) =>
  `td-badge--${(status ?? '').toLowerCase()}`

export const TAILOR_ACTIONS = {
  accepted: [
    { label: 'Хийгдэж эхэлсэн', next: 'in_production', style: 'primary' },
  ],
  deposit_paid: [
    { label: 'Хийгдэж эхэлсэн', next: 'in_production', style: 'primary' },
  ],
  in_production: [
    { label: 'Хүлээлгэж өгсөн', next: 'delivered', style: 'primary' },
  ],
  ready: [
    { label: 'Хүлээлгэж өгсөн', next: 'delivered', style: 'primary' },
  ],
  shipped: [
    { label: 'Хүлээлгэж өгсөн', next: 'delivered', style: 'primary' },
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
