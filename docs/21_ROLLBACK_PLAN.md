# 21 — Rollback Plan

This document outlines the procedure to revert the system to a previous stable state in case of a critical failure during or after deployment.

## 1. Scenario: Backend API Failure (VPS)

### Identification
- `/health` endpoint returning 500 or unresponsive.
- PM2 logs showing repeated crashes (`pm2 logs edu-core-api`).
- Frontend showing "Network Error" or "Server Error" on all requests.

### Reversion Steps
1. **Stop the current process:**
   ```bash
   pm2 stop edu-core-api
   ```
2. **Revert code to previous tag/commit:**
   ```bash
   git checkout <previous_stable_commit_hash>
   cd edu-core-api && npm install
   ```
3. **Restart the process:**
   ```bash
   pm2 start ecosystem.config.cjs
   ```
4. **Verify:** Check logs and `/health` endpoint.

## 2. Scenario: Frontend Failure (Vercel)

### Identification
- Vercel deployment logs showing build errors.
- Live site showing 404 or a blank page.

### Reversion Steps
1. **Vercel Dashboard Reversion:**
   - Log in to the [Vercel Dashboard](https://vercel.com).
   - Navigate to the project -> **Deployments**.
   - Find the last successful deployment.
   - Click the three dots (...) and select **Promote to Production**.
2. **Local Reversion (if necessary):**
   - Revert the main branch to the previous stable commit.
   - Push to GitHub to trigger a new Vercel deployment.

## 3. Scenario: Database Corruption (VPS)

### Identification
- Application failing with "Database error" or "Invalid data".
- Data missing or inconsistent after a migration script.

### Reversion Steps
1. **Identify the latest backup:**
   - Check `./backups/` directory on the VPS.
2. **Restore from dump:**
   ```bash
   # Unzip the backup
   tar -xzvf backups/edu_core_YYYYMMDD_HHMMSS.tar.gz
   # Restore using mongorestore
   mongorestore --db=edu_core backups/edu_core_YYYYMMDD_HHMMSS/edu_core
   ```
3. **Verify:** Run a few critical aggregation queries manually.

## 4. Scenario: Branding/Config Error

### Identification
- Incorrect domains in environment variables.
- Branding assets not loading.

### Reversion Steps
1. **Fix Environment Variables:**
   - Correct the `.env` file on the VPS or the Environment Variables section in Vercel.
2. **Restart/Redeploy:**
   - `pm2 restart edu-core-api` for the backend.
   - Trigger a "Redeploy" in Vercel for the frontend.

## 5. Emergency Contacts
- **System Administrator:** [Your Contact Info]
- **Hostinger Support:** hPanel Help Center
- **Vercel Support:** Vercel Dashboard Help
