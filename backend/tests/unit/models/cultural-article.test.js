// cultural-article.test.js — CulturalArticle класс шалгана

const pool = { query: vi.fn(), connect: vi.fn() }
const mockModule = (path, exports) => {
  const resolved = require.resolve(path)
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports }
}
mockModule('../../../src/db', pool)

const CulturalArticle = require('../../../src/models/CulturalArticle')

beforeEach(() => { vi.clearAllMocks() })

// ── publish / archive ──────────────────────────────────────

describe('CulturalArticle#publish()', () => {
  it('status-ийг published болгоно', async () => {
    pool.query.mockResolvedValue({ rows: [] })

    const a = new CulturalArticle({ id: 'a1', title: 'Deel', status: 'draft' })
    const result = await a.publish()

    expect(a.status).toBe('published')
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("status = 'published'"),
      ['a1']
    )
    // өөрийгөө буцаана
    expect(result).toBe(a)
  })

  it('publishedAt-ийг тохируулна', async () => {
    pool.query.mockResolvedValue({ rows: [] })

    const a = new CulturalArticle({ id: 'a2', title: 'Toortsog', status: 'draft' })
    await a.publish()

    expect(a.publishedAt).toBeInstanceOf(Date)
  })
})

describe('CulturalArticle#archive()', () => {
  it('status-ийг archived болгоно', async () => {
    pool.query.mockResolvedValue({ rows: [] })

    const a = new CulturalArticle({ id: 'a3', title: 'Gombo', status: 'published' })
    await a.archive()

    expect(a.status).toBe('archived')
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("status = 'archived'"),
      ['a3']
    )
  })
})

// ── toJSON ─────────────────────────────────────────────────

describe('CulturalArticle#toJSON()', () => {
  it('гол талбаруудыг зөв буцаана', () => {
    const a = new CulturalArticle({
      id: 'a1', title: 'Deel', slug: 'deel',
      origin_region: 'Buryatia', era: '19th century',
      summary: 'Traditional garment', status: 'published',
    })
    const json = a.toJSON()

    expect(json.id).toBe('a1')
    expect(json.title).toBe('Deel')
    expect(json.origin_region).toBe('Buryatia')
    expect(json.era).toBe('19th century')
    expect(json.status).toBe('published')
  })

  it('symbols байхгүй үед хоосон массив байна', () => {
    const a = new CulturalArticle({ id: 'a1', title: 'Test', status: 'draft' })
    const json = a.toJSON()
    expect(json.symbols).toEqual([])
  })
})

// ── create — validation ────────────────────────────────────

describe('CulturalArticle.create()', () => {
  it('title эсвэл slug байхгүй бол 400 алдаа өгнө', async () => {
    await expect(CulturalArticle.create({ authorId: 'u1', title: '', slug: '' }))
      .rejects.toMatchObject({ statusCode: 400 })
  })

  it('зөв өгөгдлөөр DB-д хадгалж instance буцаана', async () => {
    pool.query.mockResolvedValue({
      rows: [{ id: 'new-1', title: 'Deel', slug: 'deel', status: 'draft', created_at: new Date() }],
    })

    const a = await CulturalArticle.create({
      authorId: 'u1', title: 'Deel', slug: 'deel', originRegion: 'Buryatia',
    })

    expect(a).toBeInstanceOf(CulturalArticle)
    expect(a.title).toBe('Deel')
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO cultural_articles'),
      expect.arrayContaining(['u1', 'Deel', 'deel'])
    )
  })
})
