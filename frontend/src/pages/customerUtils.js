export const STATUS_LABEL = {
  draft:                'Ноорог',
  submitted:            'Захиалга илгээгдсэн',
  under_review:         'Захиалга илгээгдсэн',
  needs_clarification:  'Захиалга илгээгдсэн',
  accepted:             'Захиалга баталсан',
  rejected:             'Захиалга татгалзсан',
  deposit_paid:         'Захиалга баталсан',
  in_production:        'Оёдол хийгдэж байна',
  ready:                'Хүргэлтэд бэлэн',
  shipped:              'Хүргэлтэд гарсан',
  delivered:            'Хүргэгдсэн',
  completed:            'Дууссан',
  cancelled:            'Цуцлагдсан',
}

export const statusBadgeClass = (status) =>
  `co-badge--${(status ?? '').toLowerCase()}`

export const SHIPMENT_MODE_LABEL = {
  pickup:  'Өөрөө ирж авах',
  courier: '3-дагч хүргэлт',
}

export const SHIPMENT_STATUS_LABEL = {
  preparing:  'Бэлтгэгдэж байна',
  in_transit: 'Хүргэлтэд явж байна',
  delivered:  'Хүргэгдсэн',
  returned:   'Буцаагдсан',
}

export const ORDER_PROGRESS_STEPS = [
  { key: 'submitted', label: 'Илгээсэн', statuses: ['submitted', 'under_review', 'needs_clarification'] },
  { key: 'accepted', label: 'Баталгаажсан', statuses: ['accepted', 'deposit_paid'] },
  { key: 'in_production', label: 'Оёдол', statuses: ['in_production'] },
  { key: 'ready', label: 'Бэлэн', statuses: ['ready'] },
  { key: 'shipped', label: 'Хүргэлт', statuses: ['shipped'] },
  { key: 'delivered', label: 'Хүргэгдсэн', statuses: ['delivered', 'completed'] },
]

export const getProgressIndex = (status) => {
  const index = ORDER_PROGRESS_STEPS.findIndex(step => step.statuses.includes(status))
  return index === -1 ? 0 : index
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
