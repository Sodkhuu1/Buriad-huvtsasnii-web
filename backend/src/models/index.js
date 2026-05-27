// models/index.js — бүх классыг нэг дороос экспортлоно
// circular dependency-с зайлсхийх ухаантай арга

module.exports = {
  User:               require('./User'),
  Customer:           require('./Customer'),
  Tailor:             require('./Tailor'),
  Admin:              require('./Admin'),
  MeasurementProfile: require('./MeasurementProfile'),
  Order:              require('./Order'),
  Payment:            require('./Payment'),
  Review:             require('./Review'),
  Consultation:       require('./Consultation'),
  CulturalArticle:    require('./CulturalArticle'),
}
