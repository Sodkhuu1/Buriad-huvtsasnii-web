# Frontend tests

Vitest + React Testing Library + jsdom ashiglaj bga.

## Buteets

```
tests/
  setup.js              # jest-dom matcher, cleanup
  components/           # componenter iin test
  pages/                # uuriin pages
```

## Ajilluulah

```bash
npm test
npm run test:watch
```

## Tips

- `useAuth` shig context hook iig `vi.mock(...)` oor solih
- Router iin Link ashigladag componenter iig `<MemoryRouter>` oor boo
- screen.getByRole iig tergelsen songoh — accessibility tal deer ch oyerhgui
