# 🎓 Community Skill Exchange Platform - Backend

Production-grade Next.js backend API for the skill exchange platform.

---

## 📋 **What This Backend Does**

This is a **complete RESTful API** that handles:

- ✅ User authentication (register, login, JWT)
- ✅ Profile management (update, upload pictures)
- ✅ Lesson booking system
- ✅ Payment processing (Razorpay/Stripe)
- ✅ Review & rating system
- ✅ File uploads (Cloudinary)
- ✅ Real-time notifications

---

## 🏗️ **Technology Stack**

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: JWT (JSON Web Tokens)
- **Payment**: Razorpay (India) + Stripe (International)
- **File Upload**: Cloudinary
- **Validation**: Zod
- **Email**: Nodemailer

---

## 🚀 **Quick Start**

### **1. Install Dependencies**

```bash
npm install
```

### **2. Set Up Database**

Create a PostgreSQL database and add the connection URL to `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/skill_exchange"
```

### **3. Run Migrations**

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### **4. Seed Database (Optional)**

```bash
npm run prisma:seed
```

### **5. Start Development Server**

```bash
npm run dev
```

Server runs at: `http://localhost:3000`

---

## 📁 **Project Structure**

```
skill-exchange-backend/
├── prisma/
│   └── schema.prisma          # Database models
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── auth/          # Authentication endpoints
│   │       ├── users/         # User management
│   │       ├── lessons/       # Lesson booking
│   │       ├── payments/      # Payment processing
│   │       ├── reviews/       # Rating system
│   │       └── upload/        # File uploads
│   ├── lib/
│   │   ├── db.ts              # Database connection
│   │   ├── auth.ts            # Auth helpers
│   │   └── validators.ts      # Input validation
│   ├── middleware.ts          # Global middleware
│   └── types/
│       └── index.ts           # TypeScript types
└── .env                       # Environment variables
```

---

## 🔑 **API Endpoints**

### **Authentication**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |

### **Users**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user |
| PUT | `/api/users/me` | Update profile |

### **Lessons**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/lessons` | Book a lesson |
| GET | `/api/lessons` | Get user's lessons |
| GET | `/api/lessons/:id` | Get lesson details |
| PUT | `/api/lessons/:id` | Update lesson status |

### **Payments**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create` | Create payment order |
| POST | `/api/payments/verify` | Verify payment |

### **Reviews**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews` | Submit review |
| GET | `/api/reviews?userId=xxx` | Get user reviews |

### **Upload**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload file |
| DELETE | `/api/upload` | Delete file |

---

## 🔐 **Authentication Flow**

### **1. Register**

```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "role": "STUDENT"
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **2. Login**

```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **3. Use Token**

Include token in headers for protected routes:

```bash
GET /api/users/me
Headers: Authorization: Bearer <your-token-here>
```

---

## 💳 **Payment Flow**

### **1. Create Payment Order**

```bash
POST /api/payments/create
Headers: Authorization: Bearer <token>
{
  "lessonId": "uuid",
  "provider": "RAZORPAY",
  "amount": 500,
  "currency": "INR"
}
```

**Response:**
```json
{
  "payment": { ... },
  "razorpayOrder": {
    "id": "order_xyz",
    "amount": 50000,
    "currency": "INR"
  },
  "razorpayKeyId": "rzp_test_..."
}
```

### **2. Frontend Shows Razorpay Popup**

User completes payment on Razorpay.

### **3. Verify Payment**

```bash
POST /api/payments/verify
Headers: Authorization: Bearer <token>
{
  "razorpay_order_id": "order_xyz",
  "razorpay_payment_id": "pay_abc",
  "razorpay_signature": "signature_string"
}
```

**Response:**
```json
{
  "message": "Payment verified successfully",
  "payment": { ... }
}
```

---

## 📚 **Database Schema**

### **Main Tables**

1. **User** - User accounts
2. **Skill** - Skills (Python, Guitar, etc.)
3. **Lesson** - Lesson bookings
4. **Payment** - Payment records
5. **Review** - Ratings & reviews
6. **Availability** - Teacher schedules
7. **Notification** - User notifications
8. **Badge** - Achievement badges
9. **Certificate** - Completion certificates

---

## 🔧 **Environment Variables**

Create a `.env` file with:

```env
# Database
DATABASE_URL="postgresql://..."

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Razorpay
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."

# Stripe
STRIPE_SECRET_KEY="sk_test_..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## 🧪 **Testing the API**

### **Using cURL**

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123"}'

# Get current user
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### **Using Postman**

1. Import the endpoints
2. Set `Authorization` header: `Bearer <token>`
3. Test each endpoint

---

## 🚨 **Common Issues & Solutions**

### **1. Database Connection Error**

```
Error: Can't reach database server
```

**Solution:** Check PostgreSQL is running and `DATABASE_URL` is correct.

### **2. JWT Invalid Signature**

```
Error: invalid signature
```

**Solution:** Make sure `JWT_SECRET` is the same across all requests.

### **3. File Upload Fails**

```
Error: Upload failed
```

**Solution:** Check Cloudinary credentials in `.env`.

### **4. Payment Verification Fails**

```
Error: Invalid payment signature
```

**Solution:** Ensure `RAZORPAY_KEY_SECRET` is correct.

---

## 📖 **Next Steps**

After setting up the backend:

1. **Add Frontend** - Build React/Next.js frontend
2. **Add WebSockets** - Real-time chat with Socket.io
3. **Add Email** - Send notifications via Nodemailer
4. **Add Search** - Elasticsearch for teacher search
5. **Add Analytics** - Track user behavior
6. **Deploy** - Deploy to Vercel/AWS

---

## 🤝 **Need Help?**

If you get stuck:

1. Check the console logs
2. Verify `.env` variables
3. Run `npx prisma studio` to inspect database
4. Check Prisma migrations: `npx prisma migrate status`

---

## 🎉 **You're All Set!**

Your production-grade backend is ready. Now you can:

- Connect it to a frontend
- Test all endpoints
- Add more features
- Deploy to production

Happy coding! 🚀