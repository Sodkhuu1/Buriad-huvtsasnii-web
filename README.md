# Buriad-huvtsasnii-web

Дипломын ажлаар хөгжүүлэх сэдэв бөгөөд энэхүү веб нь:

- онлайнаар биеийн хэмжээс оруулж захиалга өгөх
- буриад хувцасны гарал, утга, бэлгэдлийг танин мэдэх
- хэрэглэгч болон оёдолчдыг нэг платформ дээр холбох

зорилготой веб систем юм.


## Local setup

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run migrate
npm run dev
```

`.env` файлд PostgreSQL тохиргоо, `JWT_SECRET`, `CLIENT_URL`, шаардлагатай бол QPay credential-уудыг тохируулна.

QPay credential байхгүй үед систем demo/mock төлбөрийн горимоор ажиллана. Бодит QPay ашиглах бол QPay merchant эрх авч `QPAY_CLIENT_ID`, `QPAY_CLIENT_SECRET`, `QPAY_INVOICE_CODE`, `SERVER_URL` утгуудыг бөглөнө.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Production эсвэл өөр backend URL ашиглах бол `VITE_API_URL`-г өөрчилнө.
