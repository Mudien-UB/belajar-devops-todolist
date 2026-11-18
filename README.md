# Belajar Devops dengan Todos App

## Run locally

```bash
npm start
```

The server runs on `http://localhost:3000` by default. Set `PORT` to use a
different port. A health check is available at `GET /health`.

## Database

Copy `.env.example` to `.env` and update `DATABASE_URL` with your MySQL
connection details. The Todo schema is defined in `prisma/schema.prisma`.

```bash
npx prisma migrate dev --name init
```
