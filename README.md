# Product Management System - Kiyim Do'koni

Kiyim do'koni uchun mahsulotlarni boshqarish tizimi.

## Xususiyatlar

- ✅ Barcha mahsulotlarni ko'rish
- ✅ Tezkor qidiruv (nomi, kategoriya, rang, kod, status, razmer bo'yicha)
- ✅ Yangi mahsulot qo'shish
- ✅ JSON fayl bazasi
- ✅ Responsive dizayn (Tailwind CSS)
- ✅ Statistika ko'rsatkichlari

## Texnologiyalar

- **Frontend**: HTML, Tailwind CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: JSON file (data/products.json)

## O'rnatish

1. Loyihani yuklab oling
2. Dependencylarni o'rnating:
```bash
npm install
```

3. Serverni ishga tushiring:
```bash
npm start
```

4. Brauzerda oching:
```
http://localhost:3000
```

## API Endpoints

- `GET /api/products` - Barcha mahsulotlarni olish
- `POST /api/products` - Yangi mahsulot qo'shish
- `GET /api/products/:code` - Kod bo'yicha mahsulot topish
- `GET /api/products/search/:query` - Mahsulotlarni qidirish

## Mahsulot Ma'lumotlari

Har bir mahsulot quyidagi ma'lumotlarni o'z ichiga oladi:

- **title** - Mahsulot nomi
- **category** - Kategoriya
- **price** - Narxi
- **code** - Mahsulot kodi
- **status** - Status (yangi/ostatka)
- **color** - Rangi
- **stock** - Omborda qolgan miqdor
- **size** - Razmer (vergul bilan ajratilgan ko'p razmerlar mumkin, masalan: "S, M, L, XL")
- **purchase_price** - Kirib kelgan narx
- **sold_price** - Sotilgan narx
- **sold_date** - Sotilgan sana

## Foydalanish

1. **Mahsulotlarni ko'rish**: Sahifa ochilganda barcha mahsulotlar jadvalda ko'rsatiladi
2. **Qidirish**: Yuqoridagi qidiruv maydoniga yozing - natijalar darhol ko'rsatiladi
3. **Yangi mahsulot qo'shish**: "Yangi Mahsulot" tugmasini bosing va formani to'ldiring

## Loyiha Strukturasi

```
product-management-system/
├── data/
│   └── products.json       # Mahsulotlar bazasi
├── public/
│   ├── index.html          # Frontend sahifa
│   └── app.js              # Frontend logika
├── server.js               # Backend server
├── package.json            # Dependencies
└── README.md               # Dokumentatsiya
```

## Development

Development rejimida ishga tushirish (auto-restart):
```bash
npm run dev
```

## Muallif

BLACKBOXAI - Full-stack Developer
