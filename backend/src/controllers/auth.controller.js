// auth.controller.js — handles register and login logic
//
// Controller = the function that runs when a route is called
// It reads the request, does work (DB query, etc), and sends a response

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { createError } = require('../middleware/errorHandler');

// Generate a JWT token for a user
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Set the JWT as an httpOnly cookie — keeps it out of JS reach (XSS-safe)
// Matches JWT_EXPIRES_IN (default 7d) in milliseconds
const AUTH_COOKIE_NAME = 'auth_token';
const SEVEN_DAYS_MS    = 7 * 24 * 60 * 60 * 1000;

const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   SEVEN_DAYS_MS,
    path:     '/',
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
  });
};

const profileSelect = `
  SELECT
    u.id, u.full_name, u.email, u.phone, u.gender, u.age, u.role, u.status, u.created_at,
    cp.preferred_language,
    tp.business_name, tp.specialization, tp.introduction, tp.avatar_url,
    tp.rating, tp.verified, tp.min_lead_days, tp.max_lead_days,
    a.id AS address_id, a.city, a.district, a.street, a.detail AS address_detail
  FROM users u
  LEFT JOIN customer_profiles cp ON cp.user_id = u.id
  LEFT JOIN tailor_profiles tp ON tp.user_id = u.id
  LEFT JOIN LATERAL (
    SELECT id, city, district, street, detail
    FROM addresses
    WHERE user_id = u.id
    ORDER BY is_default DESC, id
    LIMIT 1
  ) a ON TRUE
  WHERE u.id = $1
`;

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { full_name, email, phone, password, role } = req.body;

    // Basic validation
    if (!full_name || !email || !password) {
      return next(createError(400, 'Full name, email and password are required'));
    }

    // Only allow these roles for self-registration
    const allowedRoles = ['customer', 'tailor'];
    const userRole = allowedRoles.includes(role) ? role : 'customer';

    // Check if email is already taken
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return next(createError(409, 'Email already registered'));
    }

    // Hash the password (never store plain text passwords!)
    // bcrypt adds a "salt" and hashes the password — 10 = work factor (higher = slower but safer)
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const result = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, phone, role, status, created_at`,
      [full_name, email, phone || null, passwordHash, userRole]
    );

    const newUser = result.rows[0];

    // If registering as customer, create a customer profile row
    if (userRole === 'customer') {
      await pool.query(
        'INSERT INTO customer_profiles (user_id) VALUES ($1)',
        [newUser.id]
      );
    }

    // If registering as tailor, create a tailor profile row
    if (userRole === 'tailor') {
      const { business_name, specialization } = req.body;
      await pool.query(
        'INSERT INTO tailor_profiles (user_id, business_name, specialization) VALUES ($1, $2, $3)',
        [newUser.id, business_name || null, specialization || null]
      );
    }

    const token = generateToken(newUser);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Registered successfully',
      user: newUser,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createError(400, 'Email and password are required'));
    }

    // Find user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return next(createError(401, 'Invalid email or password'));
    }

    const user = result.rows[0];

    // Check if account is active
    if (user.status !== 'active') {
      return next(createError(403, 'Account is not active'));
    }

    // Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return next(createError(401, 'Invalid email or password'));
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        age: user.age,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout — clears the auth cookie
const logout = (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out' });
};

// GET /api/auth/me — get current logged-in user's info
const getMe = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, phone, gender, age, role, status, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return next(createError(404, 'User not found'));
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/profile — current user's editable profile details
const getProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      profileSelect,
      [req.user.id]
    );

    if (!result.rows.length) {
      return next(createError(404, 'User not found'));
    }

    res.json({ success: true, profile: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/profile — update safe profile fields
const updateProfile = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const currentRes = await client.query(
      'SELECT id, role, gender, age FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!currentRes.rows.length) {
      throw createError(404, 'User not found');
    }

    const role = currentRes.rows[0].role;
    const fullName = String(req.body.full_name || '').trim();
    const phone = req.body.phone === undefined ? undefined : String(req.body.phone || '').trim();
    const gender = req.body.gender === undefined ? undefined : String(req.body.gender || '').trim();
    const age = req.body.age === undefined
      ? undefined
      : req.body.age === ''
      ? null
      : Number(req.body.age);

    if (!fullName) {
      throw createError(400, 'Овог нэр шаардлагатай');
    }
    if (fullName.length > 100) {
      throw createError(400, 'Овог нэр 100 тэмдэгтээс ихгүй байх ёстой');
    }
    if (phone !== undefined && phone.length > 20) {
      throw createError(400, 'Утасны дугаар 20 тэмдэгтээс ихгүй байх ёстой');
    }
    if (gender !== undefined && gender.length > 30) {
      throw createError(400, 'Хүйс 30 тэмдэгтээс ихгүй байх ёстой');
    }
    if (age !== undefined && age !== null && (!Number.isInteger(age) || age < 0 || age > 130)) {
      throw createError(400, 'Нас 0-130 хооронд бүхэл тоо байх ёстой');
    }

    await client.query(
      `UPDATE users
       SET full_name = $1,
           phone = $2,
           gender = $3,
           age = $4
       WHERE id = $5`,
      [
        fullName,
        phone === '' ? null : phone,
        gender === undefined ? currentRes.rows[0].gender : gender === '' ? null : gender,
        age === undefined ? currentRes.rows[0].age : age,
        req.user.id,
      ]
    );

    const addressFields = ['city', 'district', 'street', 'address_detail'];
    const hasAddressPayload = addressFields.some(field => req.body[field] !== undefined);
    if (hasAddressPayload) {
      const city = String(req.body.city || '').trim();
      const district = String(req.body.district || '').trim();
      const street = String(req.body.street || '').trim();
      const detail = String(req.body.address_detail || '').trim();

      if (city.length > 100 || district.length > 100 || street.length > 200) {
        throw createError(400, 'Хаягийн талбарын урт зөвшөөрөгдөх хэмжээнээс их байна');
      }

      const addressRes = await client.query(
        `SELECT id
         FROM addresses
         WHERE user_id = $1
         ORDER BY is_default DESC, id
         LIMIT 1`,
        [req.user.id]
      );

      await client.query(
        'UPDATE addresses SET is_default = FALSE WHERE user_id = $1',
        [req.user.id]
      );

      if (addressRes.rows.length) {
        await client.query(
          `UPDATE addresses
           SET city = $1,
               district = $2,
               street = $3,
               detail = $4,
               is_default = TRUE
           WHERE id = $5 AND user_id = $6`,
          [
            city || null,
            district || null,
            street || null,
            detail || null,
            addressRes.rows[0].id,
            req.user.id,
          ]
        );
      } else if (city || district || street || detail) {
        await client.query(
          `INSERT INTO addresses (user_id, city, district, street, detail, is_default)
           VALUES ($1, $2, $3, $4, $5, TRUE)`,
          [req.user.id, city || null, district || null, street || null, detail || null]
        );
      }
    }

    if (role === 'customer' && req.body.preferred_language !== undefined) {
      const preferredLanguage = String(req.body.preferred_language || 'mn').trim() || 'mn';
      if (preferredLanguage.length > 20) {
        throw createError(400, 'Хэлний тохиргоо 20 тэмдэгтээс ихгүй байх ёстой');
      }

      await client.query(
        `INSERT INTO customer_profiles (user_id, preferred_language)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE
           SET preferred_language = EXCLUDED.preferred_language`,
        [req.user.id, preferredLanguage]
      );
    }

    if (role === 'tailor') {
      const businessName = req.body.business_name === undefined ? undefined : String(req.body.business_name || '').trim();
      const specialization = req.body.specialization === undefined ? undefined : String(req.body.specialization || '').trim();
      const introduction = req.body.introduction === undefined ? undefined : String(req.body.introduction || '').trim();
      const avatarUrl = req.body.avatar_url === undefined ? undefined : String(req.body.avatar_url || '').trim();
      const minLeadDays = req.body.min_lead_days === undefined || req.body.min_lead_days === ''
        ? null
        : Number(req.body.min_lead_days);
      const maxLeadDays = req.body.max_lead_days === undefined || req.body.max_lead_days === ''
        ? null
        : Number(req.body.max_lead_days);

      if (businessName !== undefined && businessName.length > 150) {
        throw createError(400, 'Бизнес нэр 150 тэмдэгтээс ихгүй байх ёстой');
      }
      if (avatarUrl !== undefined && avatarUrl.length > 0) {
        try {
          const url = new URL(avatarUrl);
          if (!['http:', 'https:'].includes(url.protocol)) throw new Error('bad protocol');
        } catch {
          throw createError(400, 'Зургийн URL зөв http/https URL байх ёстой');
        }
      }
      if (minLeadDays !== null && (!Number.isInteger(minLeadDays) || minLeadDays < 1 || minLeadDays > 365)) {
        throw createError(400, 'Бага хугацаа 1-365 өдрийн хооронд байх ёстой');
      }
      if (maxLeadDays !== null && (!Number.isInteger(maxLeadDays) || maxLeadDays < 1 || maxLeadDays > 365)) {
        throw createError(400, 'Их хугацаа 1-365 өдрийн хооронд байх ёстой');
      }
      if (minLeadDays !== null && maxLeadDays !== null && minLeadDays > maxLeadDays) {
        throw createError(400, 'Бага хугацаа их хугацаанаас их байж болохгүй');
      }

      await client.query(
        `INSERT INTO tailor_profiles
           (user_id, business_name, specialization, introduction, avatar_url, min_lead_days, max_lead_days)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6, 7), COALESCE($7, 30))
         ON CONFLICT (user_id) DO UPDATE
           SET business_name = COALESCE(EXCLUDED.business_name, tailor_profiles.business_name),
               specialization = COALESCE(EXCLUDED.specialization, tailor_profiles.specialization),
               introduction = COALESCE(EXCLUDED.introduction, tailor_profiles.introduction),
               avatar_url = COALESCE(EXCLUDED.avatar_url, tailor_profiles.avatar_url),
               min_lead_days = COALESCE($6, tailor_profiles.min_lead_days),
               max_lead_days = COALESCE($7, tailor_profiles.max_lead_days)`,
        [
          req.user.id,
          businessName === undefined || businessName === '' ? null : businessName,
          specialization === undefined || specialization === '' ? null : specialization,
          introduction === undefined || introduction === '' ? null : introduction,
          avatarUrl === undefined || avatarUrl === '' ? null : avatarUrl,
          minLeadDays,
          maxLeadDays,
        ]
      );
    }

    const profileRes = await client.query(
      profileSelect,
      [req.user.id]
    );

    await client.query('COMMIT');

    const profile = profileRes.rows[0];
    res.json({
      success: true,
      profile,
      user: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        gender: profile.gender,
        age: profile.age,
        role: profile.role,
        status: profile.status,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { register, login, logout, getMe, getProfile, updateProfile, AUTH_COOKIE_NAME };
