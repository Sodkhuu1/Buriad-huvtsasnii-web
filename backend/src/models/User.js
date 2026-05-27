// User.js — бүх хэрэглэгчийн үндсэн класс
const pool    = require('../db')
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const { createError } = require('../middleware/errorHandler')

class User {
  constructor(data) {
    this.id       = data.id
    this.fullName = data.full_name
    this.email    = data.email
    this.phone    = data.phone
    this.gender   = data.gender
    this.age      = data.age
    this.role     = data.role
    this.status   = data.status
    this.createdAt = data.created_at
  }

  // шинэ хэрэглэгч бүртгэнэ
  static async register({ full_name, email, phone, password, role = 'customer' }) {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length) throw createError(409, 'И-мэйл аль хэдийн бүртгэлтэй байна')

    const hash = await bcrypt.hash(password, 10)
    const r = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, phone, gender, age, role, status, created_at`,
      [full_name, email, phone || null, hash, role]
    )
    return User.factory(r.rows[0])
  }

  // имэйл + нууц үгээр нэвтрэнэ
  static async login(email, password) {
    const r = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (!r.rows.length) throw createError(401, 'Имэйл эсвэл нууц үг буруу байна')

    const data = r.rows[0]
    if (data.status !== 'active') throw createError(403, 'Бүртгэл идэвхгүй байна')

    const ok = await bcrypt.compare(password, data.password_hash)
    if (!ok) throw createError(401, 'Имэйл эсвэл нууц үг буруу байна')

    return User.factory(data)
  }

  static async findById(id) {
    const r = await pool.query(
      `SELECT id, full_name, email, phone, gender, age, role, status, created_at
       FROM users WHERE id = $1`,
      [id]
    )
    if (!r.rows.length) throw createError(404, 'Хэрэглэгч олдсонгүй')
    return User.factory(r.rows[0])
  }

  // role-оос хамаарч зөв дэд классыг буцаана
  static factory(data) {
    const { Customer } = require('./index')
    const { Tailor }   = require('./index')
    const { Admin }    = require('./index')

    switch (data.role) {
      case 'customer': return new Customer(data)
      case 'tailor':   return new Tailor(data)
      case 'admin':    return new Admin(data)
      default:         return new User(data)
    }
  }

  generateToken() {
    return jwt.sign(
      { id: this.id, email: this.email, role: this.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )
  }

  toJSON() {
    return {
      id:         this.id,
      full_name:  this.fullName,
      email:      this.email,
      phone:      this.phone,
      gender:     this.gender,
      age:        this.age,
      role:       this.role,
      status:     this.status,
    }
  }
}

module.exports = User
