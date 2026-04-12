# Буриад хувцасны веб системийн шинжилгээ ба диаграмм

## 1. Төслийн одоогийн төлөв

Одоогийн repository нь `React + Vite + react-router-dom` дээр суурилсан эхний загвар байна. Нүүр хуудасны визуал чиглэл, навигаци, брендийн өнгө төрх, үндсэн route-ууд бэлэн болсон боловч системийн үндсэн бизнес логик хараахан хэрэгжээгүй байна.

Одоогийн байдлаар:

- Нүүр хуудас, танилцуулгын хэсгүүд бэлэн.
- `Захиалга өгөх`, `Хувцасны утга`, `Бидний тухай` хуудсууд placeholder төлөвтэй.
- Хэрэглэгчийн бүртгэл, нэвтрэлт, өгөгдлийн сан, API, оёдолчин удирдлага, хэмжээсийн форм, захиалгын төлөв, admin хэсэг одоогоор алга.

Иймээс доорх диаграммууд нь одоогийн кодыг тайлбарлах бус, дипломын ажлын зорилтот системийг зөв архитектуртайгаар төлөвлөхөд зориулагдсан.

## 2. Системийн зорилго

Энэхүү веб системийн зорилго нь:

- Монгол дахь буриад хэрэглэгчид болон оёдолчдыг онлайнаар холбох
- Биеийн хэмжээс авч, алдааг багасгасан захиалгын урсгал бий болгох
- Буриад хувцасны гарал, утга, бэлгэдэл, хэрэглээний тухай мэдлэгийн сан үүсгэх
- Уламжлалт хувцасны захиалга, үйлдвэрлэл, хүргэлтийн явцыг нэг системээр удирдах

## 3. Гол actor-ууд

1. `Захиалагч / Хэрэглэгч`
Хувцасны мэдээлэл үзэх, хэмжээс оруулах, захиалга өгөх, төлөв хянах үндсэн хэрэглэгч.

2. `Оёдолчин / Дархан`
Захиалга хүлээн авах, хэмжээс шалгах, үйлдвэрлэлийн явц шинэчлэх, хүргэлт рүү шилжүүлэх хэрэглэгч.

3. `Админ / Контент менежер`
Хувцасны түүх, утга, тайлбар контент нийтлэх, хэрэглэгч болон оёдолчдын мэдээлэл удирдах, маргаантай захиалга хянах үүрэгтэй.

4. `Гадаад системүүд`
Төлбөр, хүргэлт, мэдэгдлийн системүүд.

## 4. Гол модулиуд

- `Authentication & Profile`
- `Measurement Guide & Measurement Profile`
- `Garment Catalog`
- `Tailor Marketplace`
- `Order Management`
- `Payment & Delivery`
- `Cultural Knowledge Base`
- `Admin & Content Management`
- `Notification Center`

## 5. Use Case Diagram

Энэ диаграмм нь системийн оролцогчид болон тэдний хийж чадах үндсэн үйлдлүүдийг харуулна.

```mermaid
flowchart LR
  customer["Захиалагч"]
  tailor["Оёдолчин"]
  admin["Админ"]
  payment["Төлбөрийн систем"]
  delivery["Хүргэлтийн үйлчилгээ"]

  subgraph system["Буриад хувцасны захиалга, судалгааны систем"]
    uc1(("Бүртгүүлэх / нэвтрэх"))
    uc2(("Хувцасны түүх, утга судлах"))
    uc3(("Хэмжээ авах заавар үзэх"))
    uc4(("Хэмжээсийн профайл хадгалах"))
    uc5(("Загвар, материал сонгох"))
    uc6(("Оёдолчин сонгох"))
    uc7(("Захиалга үүсгэх"))
    uc8(("Төлбөр хийх"))
    uc9(("Захиалгын төлөв хянах"))
    uc10(("Сэтгэгдэл үлдээх"))
    uc11(("Захиалга батлах / татгалзах"))
    uc12(("Үйлдвэрлэл, хүргэлт шинэчлэх"))
    uc13(("Соёлын контент нийтлэх"))
    uc14(("Хэрэглэгч, оёдолчин удирдах"))
  end

  customer --> uc1
  customer --> uc2
  customer --> uc3
  customer --> uc4
  customer --> uc5
  customer --> uc6
  customer --> uc7
  customer --> uc8
  customer --> uc9
  customer --> uc10

  tailor --> uc11
  tailor --> uc12
  tailor --> uc9

  admin --> uc13
  admin --> uc14
  admin --> uc9

  uc7 --> uc3
  uc7 --> uc4
  uc7 --> uc5
  uc7 --> uc6
  uc8 --> payment
  uc12 --> delivery
```

## 6. Component Diagram

Энэ нь системийг frontend, backend service, өгөгдлийн түвшинд хэрхэн хуваахыг харуулсан зорилтот архитектур юм.

```mermaid
flowchart TB
  subgraph client["Client Layer"]
    web["React Web App"]
  end

  subgraph application["Application Layer"]
    auth["Auth Service"]
    profile["Measurement Service"]
    catalog["Catalog Service"]
    tailorService["Tailor Service"]
    order["Order Service"]
    content["Content Service"]
    notify["Notification Service"]
  end

  subgraph data["Data Layer"]
    db["Relational Database"]
    storage["Media Storage"]
  end

  payment["Payment Gateway"]
  courier["Delivery API"]

  web --> auth
  web --> profile
  web --> catalog
  web --> tailorService
  web --> order
  web --> content

  auth --> db
  profile --> db
  catalog --> db
  tailorService --> db
  order --> db
  content --> db
  content --> storage
  notify --> db

  order --> payment
  order --> courier
  order --> notify
```

## 7. Domain Class Diagram

Энэ диаграмм нь системийн үндсэн entity-үүд болон тэдгээрийн хамаарлыг тодорхойлно. Дараа нь database schema, API contract, backend model гаргахад энэ хэсэг маш хэрэгтэй.

Дэлгэрэнгүй, дипломын баримт бичигт зориулагдсан тусдаа class diagram-г [class-diagram.md](./class-diagram.md)-д бэлдсэн.

```mermaid
classDiagram
  class User {
    +UUID id
    +string fullName
    +string phone
    +string email
    +string passwordHash
    +UserRole role
    +AccountStatus status
  }

  class Customer {
    +string defaultAddress
    +string preferredLanguage
  }

  class Tailor {
    +string shopName
    +string specialization
    +string location
    +decimal rating
    +bool verified
  }

  class Admin {
    +string permissionLevel
  }

  class MeasurementGuide {
    +UUID id
    +string title
    +string bodyPart
    +string instructionText
    +string imageUrl
    +int stepOrder
  }

  class MeasurementProfile {
    +UUID id
    +string profileName
    +decimal height
    +decimal chest
    +decimal waist
    +decimal hip
    +decimal sleeve
    +decimal shoulder
    +date capturedAt
  }

  class GarmentDesign {
    +UUID id
    +string name
    +string category
    +string genderGroup
    +string season
    +decimal basePrice
    +bool active
  }

  class CulturalArticle {
    +UUID id
    +string title
    +string slug
    +string originRegion
    +string summary
    +string status
    +datetime publishedAt
  }

  class SymbolMeaning {
    +UUID id
    +string symbolName
    +string meaning
    +string placement
  }

  class Order {
    +UUID id
    +string orderNumber
    +OrderStatus status
    +decimal totalAmount
    +datetime createdAt
    +datetime expectedDeliveryAt
  }

  class OrderItem {
    +UUID id
    +int quantity
    +string selectedMaterial
    +string selectedColor
    +string note
    +decimal unitPrice
  }

  class MeasurementSnapshot {
    +UUID id
    +json measurementData
    +string measurementNote
  }

  class Payment {
    +UUID id
    +decimal amount
    +PaymentStatus status
    +string method
    +datetime paidAt
  }

  class Delivery {
    +UUID id
    +string carrierName
    +string trackingCode
    +string destinationAddress
    +DeliveryStatus status
  }

  class Notification {
    +UUID id
    +string channel
    +string title
    +string message
    +bool isRead
    +datetime sentAt
  }

  User <|-- Customer
  User <|-- Tailor
  User <|-- Admin

  Customer "1" --> "0..*" MeasurementProfile : owns
  MeasurementGuide "1" --> "0..*" MeasurementProfile : guides

  Customer "1" --> "0..*" Order : places
  Tailor "1" --> "0..*" Order : fulfills

  Order "1" *-- "1..*" OrderItem : contains
  Order "1" *-- "1" MeasurementSnapshot : uses
  Order "1" --> "0..1" Payment : has
  Order "1" --> "0..1" Delivery : ships via

  OrderItem "*" --> "1" GarmentDesign : references

  Admin "1" --> "0..*" CulturalArticle : publishes
  CulturalArticle "1" --> "0..*" SymbolMeaning : includes
  GarmentDesign "*" --> "0..*" CulturalArticle : described by

  User "1" --> "0..*" Notification : receives
```

## 8. Sequence Diagram: Хэрэглэгч захиалга үүсгэх

Энэ нь хэмжээс оруулж, оёдолчин сонгон захиалга үүсгэх үндсэн бизнес урсгал юм.

```mermaid
sequenceDiagram
  actor Customer as Захиалагч
  participant Web as React Web App
  participant Measurement as Measurement Service
  participant Catalog as Catalog Service
  participant Tailor as Tailor Service
  participant Order as Order Service
  participant Notify as Notification Service
  participant DB as Database

  Customer->>Web: Захиалга эхлүүлэх
  Web->>Measurement: Хэмжээ авах заавар, талбар авах
  Measurement->>DB: Measurement guide, validation rule авах
  DB-->>Measurement: Guide + rules
  Measurement-->>Web: Хэмжээсийн бүтэц буцаах

  Customer->>Web: Хэмжээс, загвар, материал оруулах
  Web->>Catalog: Загвар, материал шалгах
  Catalog->>DB: Catalog мэдээлэл унших
  DB-->>Catalog: Design data
  Catalog-->>Web: Valid options

  Web->>Tailor: Тохирох оёдолчин хайх
  Tailor->>DB: Чадвар, байршил, ачаалал шүүх
  DB-->>Tailor: Tailor list
  Tailor-->>Web: Боломжит оёдолчид

  Customer->>Web: Оёдолчин сонгон батлах
  Web->>Order: Захиалга үүсгэх хүсэлт
  Order->>DB: Order, items, measurement snapshot хадгалах
  DB-->>Order: Order ID
  Order->>Notify: Оёдолчинд шинэ захиалга мэдэгдэх
  Notify-->>Order: Notification queued
  Order-->>Web: Захиалга амжилттай, төлөв=PendingReview
  Web-->>Customer: Захиалгын дугаар харуулах
```

## 9. Sequence Diagram: Оёдолчин захиалга боловсруулах

Энэ нь захиалга батлах, төлбөр, үйлдвэрлэл, хүргэлтийн шат дарааллыг харуулна.

```mermaid
sequenceDiagram
  actor Tailor as Оёдолчин
  actor Customer as Захиалагч
  participant Web as React Web App
  participant Order as Order Service
  participant Payment as Payment Gateway
  participant Delivery as Delivery API
  participant Notify as Notification Service
  participant DB as Database

  Tailor->>Web: Шинэ захиалгын дэлгэрэнгүй харах
  Web->>Order: Захиалгын мэдээлэл авах
  Order->>DB: Order + measurement snapshot унших
  DB-->>Order: Захиалгын өгөгдөл
  Order-->>Web: Захиалгын дэлгэрэнгүй буцаах

  Tailor->>Web: Батлах, үнэ ба хугацаа тогтоох
  Web->>Order: status=Accepted, estimate update
  Order->>DB: Захиалгын төлөв шинэчлэх
  Order->>Notify: Захиалагчид баталгаажсан тухай мэдэгдэх
  Notify-->>Customer: Захиалга батлагдлаа

  Customer->>Web: Урьдчилгаа төлөх
  Web->>Payment: Payment request
  Payment-->>Web: Payment success
  Web->>Order: Төлбөр амжилттай
  Order->>DB: Payment status=Paid

  Tailor->>Web: Үйлдвэрлэл эхэлсэн, дараа нь бэлэн болсон гэж шинэчлэх
  Web->>Order: status=InProduction / Ready
  Order->>DB: Төлөв хадгалах

  Tailor->>Web: Хүргэлт үүсгэх
  Web->>Delivery: Shipping request
  Delivery-->>Web: Tracking code
  Web->>Order: status=Shipped + tracking code
  Order->>DB: Хүргэлтийн мэдээлэл хадгалах
  Order->>Notify: Захиалагчид tracking code илгээх
  Notify-->>Customer: Хүргэлтийн код ирлээ
```

## 10. State Diagram: Захиалгын төлөв

Энэ диаграмм нь `Order` entity-ийн lifecycle-ийг тодорхойлно.

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Submitted: Захиалагч илгээх
  Submitted --> UnderReview: Оёдолчин нээх
  UnderReview --> NeedClarification: Хэмжээс дутуу
  NeedClarification --> Submitted: Захиалагч засварлах
  UnderReview --> Rejected: Татгалзах
  UnderReview --> Accepted: Батлах
  Accepted --> DepositPaid: Урьдчилгаа төлөх
  DepositPaid --> InProduction: Оёдол эхлэх
  InProduction --> Ready: Бэлэн болох
  Ready --> Shipped: Хүргэлтэд шилжүүлэх
  Shipped --> Delivered: Хүлээн авах
  Delivered --> Completed: Сэтгэгдэл үлдээх
  Rejected --> [*]
  Completed --> [*]
```

## 11. Дипломын ажлын хувьд санал болгох шаардлагын бүтэц

Доорх бүлгүүдийг дипломын бичиг баримтад тусгавал систем илүү цэгцтэй харагдана.

1. `Оршил`
Судалгааны үндэслэл, асуудал, зорилго, зорилтууд.

2. `Одоогийн нөхцөл байдлын шинжилгээ`
Уламжлалт буриад хувцас захиалах хүндрэл, хэмжээсийн алдаа, мэдээллийн хомсдол.

3. `Системийн шаардлагын шинжилгээ`
Functional requirements, non-functional requirements, actor-ууд.

4. `Системийн зохиомж`
Use case, component, class, sequence, state diagram.

5. `Өгөгдлийн сангийн зохиомж`
ERD, хүснэгтүүд, primary/foreign key.

6. `Хэрэгжүүлэлт`
Frontend, backend, database, deployment.

7. `Туршилт ба үнэлгээ`
Form validation, order flow test, usability test, performance test.

## 12. Дараагийн санал болгож буй алхмууд

Диаграммын дараа дараах ажлуудыг хийхэд хамгийн зөв дараалал болно:

1. `Requirement specification` бичих
Use case бүрийн pre-condition, main flow, alternative flow, post-condition-ийг тодорхойлох.

2. `Database ERD` гаргах
Одоогийн class diagram-аас реляц бүтэц рүү хөрвүүлэх.

3. `Information architecture` тодорхойлох
Нүүр, захиалга, хэмжээсийн заавар, каталог, оёдолчин, контент, admin dashboard.

4. `Low-fidelity wireframe` зурах
Ялангуяа хэмжээсийн форм, захиалгын алхамчилсан wizard, контент хуудсууд.

5. `API contract` тодорхойлох
`/auth`, `/measurements`, `/orders`, `/tailors`, `/articles`, `/admin`.

---

Хэрэв хүсвэл дараагийн алхамд би энэ баримт дээр үндэслээд:

- `ERD` диаграмм
- `requirement specification`
- `user flow`
- `wireframe structure`
- эсвэл энэ системийн `page map / sitemap`

гэсэн дараагийн дипломын материалуудыг мөн шууд бэлдэж өгч чадна.
