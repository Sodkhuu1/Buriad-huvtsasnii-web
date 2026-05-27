// measurements.controller.js — Customer.saveMeasurement() + MeasurementProfile.update()
const { MeasurementProfile, Customer } = require('../models')
const { createError } = require('../middleware/errorHandler')

// GET /api/measurements — өөрийн профайлуудыг харна
const getMyProfiles = async (req, res, next) => {
  try {
    const profiles = await MeasurementProfile.findByUserId(req.user.id)
    res.json({ success: true, profiles: profiles.map(p => p.toJSON()) })
  } catch (err) {
    next(err)
  }
}

// POST /api/measurements — Customer.saveMeasurement() ашиглана
const createProfile = async (req, res, next) => {
  try {
    const { profile_name, gender_category, measurements } = req.body
    if (!measurements) return next(createError(400, 'measurements шаардлагатай'))

    // Customer instance үүсгэж saveMeasurement() дуудна
    const customer = new Customer({ id: req.user.id, role: 'customer' })
    const profile  = await customer.saveMeasurement({
      profileName:    profile_name,
      genderCategory: gender_category,
      measurements,
    })

    res.status(201).json({ success: true, profile })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/measurements/:id — MeasurementProfile.update() ашиглана
const updateProfile = async (req, res, next) => {
  try {
    const { measurements } = req.body
    if (!measurements) return next(createError(400, 'measurements шаардлагатай'))

    const profile = await MeasurementProfile.findById(req.params.id)

    // өөрийн профайл мөн эсэхийг шалгана
    if (profile.userId !== req.user.id) return next(createError(403, 'Хандах эрхгүй'))

    // update() — хэмжээсүүдийг шинэчилнэ
    await profile.update(measurements)
    res.json({ success: true, profile: profile.toJSON() })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/measurements/:id
const deleteProfile = async (req, res, next) => {
  try {
    const profile = await MeasurementProfile.findById(req.params.id)
    if (profile.userId !== req.user.id) return next(createError(403, 'Хандах эрхгүй'))

    const pool = require('../db')
    await pool.query('DELETE FROM measurement_profiles WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

module.exports = { getMyProfiles, createProfile, updateProfile, deleteProfile }
