export const STATUS_LABEL = {
  draft:                'Ноорог',
  submitted:            'Захиалга илгээгдсэн',
  under_review:         'Захиалга илгээгдсэн',
  needs_clarification:  'Захиалга илгээгдсэн',
  accepted:             'Захиалга баталсан',
  rejected:             'Захиалга татгалзсан',
  deposit_paid:         'Захиалга баталсан',
  in_production:        'Хийгдэж эхэлсэн',
  ready:                'Хүлээлгэж өгсөн',
  shipped:              'Хүлээлгэж өгсөн',
  delivered:            'Хүлээлгэж өгсөн',
  completed:            'Хүлээлгэж өгсөн',
  cancelled:            'Цуцлагдсан',
}

export const statusBadgeClass = (status) =>
  `co-badge--${(status ?? '').toLowerCase()}`

export const SHIPMENT_MODE_LABEL = {
  pickup:  'Өөрөө ирж авах',
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

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('mn-MN', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : ''

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('mn-MN', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : ''
