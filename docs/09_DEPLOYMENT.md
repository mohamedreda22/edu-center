# 09 — Deployment

## 1. Frontend — Vercel

- Root directory: `frontend/` (if monorepo) or a dedicated frontend repo.
- Build command: `npm run build` (Vite production build, code-split by route via `React.lazy` + `React Router`'s lazy route loading).
- Environment variable: `VITE_API_BASE_URL=https://api.yourdomain.com/api/v1`.
- Preview deployments per PR (Vercel default) for review before merge.

## 2. Backend — Hostinger VPS

### Process management
- **PM2** running the Express app in cluster mode (`pm2 start server.js -i max --name edu-core-api`), giving multi-core utilization and zero-downtime reloads (`pm2 reload`).
- PM2 configured to start on boot (`pm2 startup` + `pm2 save`).

### Reverse proxy & TLS
- **Nginx** in front of PM2/Node, proxying `api.yourdomain.com` → `127.0.0.1:<port>`.
- TLS via **Let's Encrypt/certbot**, auto-renewal cron.
- Nginx also enforces a request body size limit (file upload cap) and basic connection rate limiting as a second layer in front of the application-level `express-rate-limit`.

### MongoDB (local on the VPS)
- Installed as a standard Linux service (`mongod`), bound to `127.0.0.1` only (never exposed publicly).
- **Must be initialized as a single-node replica set** to support the transactions used throughout Edu-Core:
  ```bash
  mongod --replSet rs0 --bind_ip 127.0.0.1
  # then, once running:
  mongosh --eval "rs.initiate({_id:'rs0', members:[{_id:0, host:'localhost:27017'}]})"
  ```
- Authentication enabled (`--auth`), a dedicated application user with least-privilege access to only the `edu-core` database (not the Mongo admin user).

### Backups
- Nightly `mongodump` via cron, compressed and rotated (keep last 14 daily + 6 monthly), stored outside the VPS (e.g. pushed to an object storage bucket or pulled by an external backup service) — a single-VPS deployment has no redundancy otherwise, so off-box backup copies are mandatory, not optional.
- Documented restore procedure tested at least once before go-live (`mongorestore` against a scratch database, verified against the reconciliation checks from `07_MIGRATION_PLAN.md`).

## 3. CI/CD (recommended, not mandated by the stated stack)

- GitHub Actions: on push to `main` — run lint, run tests (`18_TESTING_STRATEGY.md`), build. Backend deploy step SSHes to the VPS, pulls latest, `npm ci`, `pm2 reload`. Frontend deploy is automatic via Vercel's GitHub integration.

## 4. Health Checks & Monitoring

- `GET /health` (unauthenticated, minimal) — checks process is up and Mongo connection is alive (`mongoose.connection.readyState`).
- Nginx/uptime monitoring (external, e.g. a simple uptime-ping service) against `/health`.
- Winston file logs rotated (`winston-daily-rotate-file`) under `/var/log/edu-core/`, with disk-space alerting since a single VPS has finite storage.

## 5. Environment Promotion

- Single production environment initially (consistent with a single-VPS, single-Mongo-node deployment target). A local `docker-compose` (Node + Mongo replica set) is recommended for developer machines so the transaction behavior is testable locally without touching production — see `18_TESTING_STRATEGY.md`.

## 6. Deployment Checklist (cross-reference `17_PRODUCTION_CHECKLIST.md` for the full list)

- [ ] Replica set initialized before first transactional write
- [ ] All required env vars set (boot-time Zod validation will otherwise refuse to start — this is intentional, treat a crash-on-boot here as the check working correctly)
- [ ] Nginx TLS certificates valid and auto-renewal cron confirmed
- [ ] Off-box backup job running and a restore verified at least once
- [ ] CORS origin list matches the actual Vercel production domain (and any preview domains, if previews need API access)
