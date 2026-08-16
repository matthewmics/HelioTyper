// Prisma CLI configuration. Prisma 7 does not read .env on its own, so dotenv
// loads api/.env here for host-side CLI runs. Inside Docker, DATABASE_URL comes
// from docker-compose.yml and dotenv leaves the existing value alone.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
