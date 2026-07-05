# Edu-Core — Deployment & System Guide

## 1. About the System
**Edu-Core** is a production-grade Educational Management Platform (ERP) designed to streamline the operations of educational institutes. It is a modern rebuild of a legacy system, focusing on scalability, security, and high performance.

### Key Capabilities:
*   **Student Management**: Tracking enrollments, educational levels, and personal details.
*   **Teacher Management**: Managing teacher profiles, structured availability, and commission models.
*   **Smart Scheduling**: True time-overlap conflict detection for lesson booking.
*   **Financial Tracking**: Managing student payments (including partial payments) and teacher payroll.
*   **Dual Compensation Models**: Supporting both "Per Lesson" (Commission) and "Hourly" pay structures.
*   **Advanced Reporting**: Native MongoDB aggregation pipelines for deep insights into performance, revenue, and subjects.
*   **Security First**: RBAC, JWT Access/Refresh token rotation, session management, and full audit logging.

---

## 2. Page Access & Navigation Guide
The system is divided into functional modules, with access controlled by user roles (**ADMIN, RECEPTIONIST, TEACHER, ACCOUNTANT**).

### Modules:
1.  **Dashboard**: Overview KPIs (Total Students, Active Lessons, Monthly Revenue).
2.  **Students**: List, search, and manage student records. (Admin, Receptionist)
3.  **Teachers**: Manage teacher profiles and availability. (Admin)
4.  **Scheduling**: A grid-based view to book and manage lessons. (Admin, Receptionist, Teacher)
5.  **Payments**: Record and track student fees. (Admin, Receptionist, Accountant)
6.  **Payroll & Salaries**: Automated recalculation of teacher earnings based on completed lessons or hours. (Admin, Accountant)
7.  **Reports**: Performance analysis by teacher, subject, or level. Exportable to CSV. (Admin, Accountant)
8.  **Settings**: Profile management, password changes, and active session tracking. (All Roles)
9.  **Activity Log**: Searchable audit trail of all system actions. (Admin)

---

## 3. Hosting the Backend (Hostinger VPS)

### Step 1: Server Provisioning
1.  Purchase a Hostinger VPS (Ubuntu 22.04 recommended).
2.  SSH into your server: `ssh root@your_vps_ip`.
3.  Update system: `sudo apt update && sudo apt upgrade -y`.

### Step 2: Install Node.js & PM2
1.  Install Node.js (v20+):
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```
2.  Install PM2 globally: `sudo npm install pm2 -g`.

### Step 3: Install & Configure MongoDB
1.  Install MongoDB per official Ubuntu instructions.
2.  **Crucial: Initialize Replica Set** (Required for Transactions):
    *   Edit config: `sudo nano /etc/mongod.conf`.
    *   Add/Uncomment:
        ```yaml
        replication:
          replSetName: "rs0"
        ```
    *   Restart Mongo: `sudo systemctl restart mongod`.
    *   Initiate: `mongosh --eval "rs.initiate()"`.

### Step 4: Deploy API
1.  Clone the repository: `git clone <your-repo-url>`.
2.  Navigate to `edu-core-api`.
3.  Install dependencies: `npm install`.
4.  Create `.env` (see Environment Variables section).
5.  Start with PM2: `pm2 start src/server.js --name edu-core-api`.
6.  Set to start on boot: `pm2 startup && pm2 save`.

### Step 5: Nginx & SSL
1.  Install Nginx: `sudo apt install nginx -y`.
2.  Configure reverse proxy for port 5000.
3.  Install Certbot and enable HTTPS: `sudo snap install --classic certbot && sudo certbot --nginx`.

---

## 4. Hosting the Frontend (Vercel)

1.  Push your code to GitHub/GitLab/Bitbucket.
2.  Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3.  Import the repository.
4.  **Root Directory**: Set to `edu-core-web`.
5.  **Build Settings**:
    *   Framework Preset: Vite.
    *   Build Command: `npm run build`.
    *   Output Directory: `dist`.
6.  **Environment Variables**: Add `VITE_API_BASE_URL` (e.g., `https://api.yourdomain.com/api`).
7.  Click **Deploy**.

---

## 5. Environment Variables Reference

### Backend (`edu-core-api/.env`)
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/edu_core?replicaSet=rs0
JWT_ACCESS_SECRET=your_super_secret_at_least_32_chars
JWT_REFRESH_SECRET=your_other_super_secret_at_least_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

### Frontend (`edu-core-web/.env`)
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

---

## 6. Accessing the System
Once deployed:
1.  Navigate to your Vercel URL.
2.  Log in using the credentials provided during the database seeding process (or create the first Admin user manually in MongoDB).
3.  Use the **Sidebar** to navigate between modules.
4.  For security, ensure you change your default password in the **Settings** module immediately.
