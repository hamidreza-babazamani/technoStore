# TechnoStore Backend

A production-ready REST API for an e-commerce platform built with Node.js, Express, TypeScript, and MongoDB.

## Features
- TypeScript strict mode and clean architecture (Controllers, Services, Models).
- Secure admin authentication using `scrypt` password hashing and HMAC tokens.
- Security features: Helmet, Rate Limiting, body size limits.
- Concurrency-safe order creation to prevent negative stock.
- Complete API documentation via Swagger.
- 33+ automated integration tests using Jest and Supertest.

## Getting Started
1. Install dependencies: `npm install`
2. Copy environment variables: `cp .env.example .env`
3. Generate admin password hash: `npm run admin:hash`
4. Run development server: `npm run dev`
5. Run tests: `npm test`

## API Documentation
Once the server is running, Swagger UI is available at: `http://localhost:5001/api-docs`

## Author
Hamidreza Babazamani

---

# بک‌اند فروشگاه تکنو (TechnoStore)

یک REST API آماده برای فروشگاه اینترنتی که با Node.js، Express، TypeScript و MongoDB توسعه یافته است.

## امکانات
- استفاده از حالت سخت‌گیرانه TypeScript و معماری تمیز (کنترلرها، سرویس‌ها، مدل‌ها).
- احراز هویت امن ادمین با استفاده از هش کردن پسورد (`scrypt`) و توکن‌های HMAC.
- ویژگی‌های امنیتی: Helmet، Rate Limiting و محدودیت حجم بدنه درخواست.
- ثبت سفارش ایمن در برابر همزمانی (جلوگیری از منفی شدن موجودی انبار).
- مستندات کامل API با استفاده از Swagger.
- بیش از ۳۳ تست خودکار با استفاده از Jest و Supertest.

## راه‌اندازی
۱. نصب پکیج‌ها: `npm install`
۲. کپی متغیرهای محیطی: `cp .env.example .env`
۳. ساخت هش پسورد ادمین: `npm run admin:hash`
۴. اجرای سرور در محیط توسعه: `npm run dev`
۵. اجرای تست‌ها: `npm test`

## مستندات API
پس از اجرای سرور، صفحه مستندات Swagger در آدرس زیر در دسترس است: `http://localhost:5001/api-docs`

## نویسنده
حمیدرضا بابازمانی
