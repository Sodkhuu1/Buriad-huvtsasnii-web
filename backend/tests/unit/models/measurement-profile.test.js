// measurement-profile.test.js — MeasurementProfile класс шалгана

const pool = { query: vi.fn(), connect: vi.fn() }
const mockModule = (path, exports) => {
  const resolved = require.resolve(path)
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports }
}
mockModule('../../../src/db', pool)

const MeasurementProfile = require('../../../src/models/MeasurementProfile')

beforeEach(() => { vi.clearAllMocks() })

// ── toJSON ─────────────────────────────────────────────────

describe('MeasurementProfile#toJSON()', () => {
  it('profile_name, gender_category, measurements талбарыг буцаана', () => {
    const mp = new MeasurementProfile({
      id: 'mp1', user_id: 'u1',
      profile_name: 'Миний профайл', gender_category: 'male',
      measurements: { chest: 90, waist: 72 },
      captured_at: '2026-01-01',
    })
    const json = mp.toJSON()

    expect(json.profile_name).toBe('Миний профайл')
    expect(json.gender_category).toBe('male')
    expect(json.measurements).toEqual({ chest: 90, waist: 72 })
    // user_id нь exposedгүй байна
    expect(json.user_id).toBeUndefined()
  })

  it('measurements байхгүй бол хоосон object байна', () => {
    const mp = new MeasurementProfile({ id: 'mp2', user_id: 'u1', profile_name: 'Test' })
    expect(mp.toJSON().measurements).toEqual({})
  })
})

// ── update ─────────────────────────────────────────────────

describe('MeasurementProfile#update()', () => {
  const makeClient = () => ({
    query:   vi.fn(async () => ({ rows: [] })),
    release: vi.fn(),
  })

  it('буруу өгөгдлөөр 400 алдаа өгнө', async () => {
    const mp = new MeasurementProfile({ id: 'mp1', user_id: 'u1', profile_name: 'Test' })

    await expect(mp.update(null)).rejects.toMatchObject({ statusCode: 400 })
    await expect(mp.update('string')).rejects.toMatchObject({ statusCode: 400 })
  })

  it('хуучин утгыг устгаж шинийг оруулна', async () => {
    const client = makeClient()
    pool.connect.mockResolvedValue(client)

    const mp = new MeasurementProfile({ id: 'mp1', user_id: 'u1', profile_name: 'Test' })
    const newMeasurements = { chest: 95, waist: 75, hip: 98 }
    await mp.update(newMeasurements)

    // DELETE хуучин, INSERT шинэ
    expect(client.query.mock.calls.some(([sql]) =>
      String(sql).includes('DELETE FROM measurement_values')
    )).toBe(true)
    expect(client.query.mock.calls.filter(([sql]) =>
      String(sql).includes('INSERT INTO measurement_values')
    )).toHaveLength(3)
    expect(mp.bodyMeasurements).toEqual(newMeasurements)
    expect(client.query).toHaveBeenCalledWith('COMMIT')
    expect(client.release).toHaveBeenCalledTimes(1)
  })

  it('DB алдаа гарвал ROLLBACK хийнэ', async () => {
    const client = {
      query:   vi.fn(async (sql) => {
        if (String(sql).includes('DELETE FROM measurement_values')) throw new Error('DB error')
        return { rows: [] }
      }),
      release: vi.fn(),
    }
    pool.connect.mockResolvedValue(client)

    const mp = new MeasurementProfile({ id: 'mp1', user_id: 'u1', profile_name: 'Test' })

    await expect(mp.update({ chest: 90 })).rejects.toThrow('DB error')
    expect(client.query).toHaveBeenCalledWith('ROLLBACK')
    expect(client.release).toHaveBeenCalledTimes(1)
  })
})

// ── findByUserId ───────────────────────────────────────────

describe('MeasurementProfile.findByUserId()', () => {
  it('DB-ийн row-уудыг instance массив болгоно', async () => {
    pool.query.mockResolvedValue({
      rows: [
        { id: 'mp1', user_id: 'u1', profile_name: 'Default', gender_category: 'male', measurements: {}, captured_at: null },
        { id: 'mp2', user_id: 'u1', profile_name: 'Sport', gender_category: 'male', measurements: {}, captured_at: null },
      ],
    })

    const profiles = await MeasurementProfile.findByUserId('u1')

    expect(profiles).toHaveLength(2)
    expect(profiles[0]).toBeInstanceOf(MeasurementProfile)
    expect(profiles[1].name).toBe('Sport')
  })

  it('profile байхгүй бол хоосон массив буцаана', async () => {
    pool.query.mockResolvedValue({ rows: [] })
    const profiles = await MeasurementProfile.findByUserId('u-nobody')
    expect(profiles).toEqual([])
  })
})
