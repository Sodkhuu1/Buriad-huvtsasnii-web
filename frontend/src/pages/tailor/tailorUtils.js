// DB-н order_status ENUM lowercase утгуудтай таарна
export const STATUS_LABEL = {
  submitted:            'Шинэ захиалга',
  under_review:         'Хянагдаж байна',
  needs_clarification:  'Тодруулга шаардлагатай',
  accepted:             'Батлагдсан',
  deposit_paid:         'Урьдчилгаа төлөгдсөн',
  in_production:        'Үйлдвэрлэлд',
  ready:                'Бэлэн',
  shipped:              'Хүргэлтэд',
  delivered:            'Хүргэгдсэн',
  completed:            'Дууссан',
  rejected:             'Татгалзсан',
}

export const statusBadgeClass = (status) =>
  `td-badge--${(status ?? '').toLowerCase()}`

// Тухайн статусд оёдолчин хийж болох үйлдлүүд
export const TAILOR_ACTIONS = {
  submitted: [
    { label: 'Батлах',    next: 'accepted', style: 'primary' },
    { label: 'Татгалзах', next: 'rejected', style: 'danger'  },
  ],
  deposit_paid: [
    { label: 'Үйлдвэрлэл эхлэх', next: 'in_production', style: 'primary' },
  ],
  in_production: [
    { label: 'Бэлэн болсон гэж тэмдэглэх', next: 'ready', style: 'primary' },
  ],
  ready: [
    { label: 'Хүргэлтэд өгсөн', next: 'shipped', style: 'primary' },
  ],
}

export const MEASUREMENT_LABEL = {
  height:   'Өндөр',
  chest:    'Цээж',
  waist:    'Бүсэлхий',
  hip:      'Ташаа',
  sleeve:   'Гарын урт',
  shoulder: 'Мөрний өргөн',
}
