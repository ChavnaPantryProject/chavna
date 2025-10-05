import 'dotenv/config'
import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
  host: process.env.DATABASE_URL,
  port: Number(process.env.DATABASE_PORT || 5432),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'postgres',
  ssl: { rejectUnauthorized: false }
})


export { pool }

// If run directly just test the connection and print info
if (import.meta.url === `file://${process.argv[1]}`) {
  ;(async () => {
    const client = await pool.connect()
    try {
      const { rows } = await client.query(`
        select current_database() as db,
               current_user      as user,
               now()             as connected_at,
               version()
      `)
      console.log(rows[0])
    } catch (e) {
      console.error('Connect failed:', e.message)
      process.exit(1)
    } finally {
      client.release()
      await pool.end()
    }
  })()
}