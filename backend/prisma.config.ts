import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  // the main entry for your schema
  schema: 'prisma/schema.prisma',
  // where migrations should be generated
  // what script to run for "prisma db seed"
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  // The database URL 
  datasource: {
    // Type Safe env() helper 
    // Does not replace the need for dotenv
    // use process.env to access environment variables
    url: process.env.DATABASE_URL,
  },
})