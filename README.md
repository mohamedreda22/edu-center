# Rakan Academy - Enterprise ERP
نظام إدارة أكاديمية ركان المتكامل

## Overview
**أكاديمية ركان** is a production-grade Educational Management Platform (ERP) designed to streamline the operations of educational institutes. It features a robust Node.js API and a modern React/Vite frontend.

### 🚀 Production URLs
- **Frontend**: [https://app.rakaninstitutekw.com](https://app.rakaninstitutekw.com)
- **Backend API**: [https://rakaninstitutekw.com/api](https://rakaninstitutekw.com/api)
- **Landing Page**: [https://rakaninstitutekw.com](https://rakaninstitutekw.com)

## 🏗️ Architecture
The system is built as a monorepo consisting of:
- `edu-core-api`: Node.js/Express backend with MongoDB Atlas.
- `edu-core-web`: React/Vite frontend hosted on Vercel.

## ✨ Key Features
- **Smart Scheduling**: Conflict-aware lesson management.
- **Financial Module**: Automated teacher payroll and student payment tracking.
- **Role-Based Access Control (RBAC)**: Admin, Receptionist, Teacher, and Accountant roles.
- **Branded UI**: Custom-designed interface matching Rakan Academy's identity.

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Shadcn/UI, TanStack Query.
- **Backend**: Node.js, Express, Mongoose, JWT (Access/Refresh Tokens), Winston Logging.
- **Database**: MongoDB Atlas (Cloud).
- **Deployment**: Vercel (Web), Hostinger Cloud (API).

## 🚀 Getting Started

### Prerequisites
- Node.js v20+
- MongoDB instance (Atlas recommended)

### Backend Setup
```bash
cd edu-core-api
npm install
cp .env.example .env # Configure your Atlas URI and Secrets
npm run dev
```

### Frontend Setup
```bash
cd edu-core-web
npm install
cp .env.example .env # Configure VITE_API_BASE_URL
npm run dev
```

## 📖 Documentation
Detailed deployment and configuration steps can be found in [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

---
© 2026 Rakan Academy. All rights reserved.
