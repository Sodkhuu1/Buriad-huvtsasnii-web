export const STATUS_LABEL = {
  draft:                'Ноорог',
  submitted:            'Илгээгдсэн',
  under_review:         'Хянагдаж байна',
  needs_clarification:  'Тодруулга шаардлагатай',
  accepted:             'Батлагдсан',
  rejected:             'Татгалзсан',
  deposit_paid:         'Урьдчилгаа төлөгдсөн',
  in_production:        'Үйлдвэрлэлд',
  ready:                'Бэлэн',
  shipped:              'Хүргэлтэд',
  delivered:            'Хүргэгдсэн',
  completed:            'Дууссан',
  cancelled:            'Цуцлагдсан',
}

export const statusBadgeClass = (status) =>
  `co-badge--${(status ?? '').toLowerCase()}`

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
