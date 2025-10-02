// npm i pg dotenv @neondatabase/serverless
import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

// Uses HTTPS/WebSockets under the hood
const sql = neon(process.env.DATABASE_URL)

try {
  const [row] = await sql`select now() as connected_at, version()`
  console.log(row) // { connected_at: ..., version: 'PostgreSQL ...' }
} catch (err) {
  console.error('DB test failed:', err)
  process.exit(1)
}