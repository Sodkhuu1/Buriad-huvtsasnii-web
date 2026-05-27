// measurements.routes.js
const router = require('express').Router()
const { protect, requireRole } = require('../middleware/auth')
const ctrl = require('../controllers/measurements.controller')

// зөвхөн нэвтэрсэн хэрэглэгч (customer)
router.get('/',      protect, requireRole('customer'), ctrl.getMyProfiles)
router.post('/',     protect, requireRole('customer'), ctrl.createProfile)
router.patch('/:id', protect, requireRole('customer'), ctrl.updateProfile)
router.delete('/:id',protect, requireRole('customer'), ctrl.deleteProfile)

module.exports = router
