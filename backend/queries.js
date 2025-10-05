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

export async function runQuery(sqlText, params = []) {
  console.log('\nSQL:\n', sqlText)
  const client = await pool.connect()
  try {
    const res = await client.query(sqlText, params)
    if (res?.rows?.length) console.dir(res.rows, { depth: null })
    else console.log('OK')
    return res?.rows ?? null
  } catch (e) {
    console.error('Error:', e.message)
    throw e
  } finally {
    client.release()
  }
}


// Extensions
export const enablePgcrypto = `create extension if not exists pgcrypto;`
export const enableCitext   = `create extension if not exists citext;`

// creating tables
export const createUsersTable = `
  create table if not exists users (
    id                   uuid primary key default gen_random_uuid(),
    first_name           text,
    last_name            text,
    email                citext not null unique,
    password_hash        bytea not null check (octet_length(password_hash) = 60),
    password_salt        bytea not null check (octet_length(password_salt) = 16),
    password_updated_at  timestamptz not null default now(),
    created_at           timestamptz not null default now(),
    constraint users_first_name_len check (char_length(btrim(first_name)) between 1 and 100),
    constraint users_last_name_len  check (char_length(btrim(last_name))  between 1 and 100),
    constraint users_email_len      check (char_length(btrim(email)) <= 254)
  );
`;

// Diagnostics / helpers
export const listCurrentSchemaTables = `
  select table_schema, table_name
  from information_schema.tables
  where table_schema = current_schema()
  order by table_name;
`

// users queries
export const selectAllUsers = `select * from users order by created_at desc;`
export const countUsers = `select count(*) from users;`

//custom query for testing
export const customQuery = `drop table Users;`
runQuery(countUsers).catch(() => {}) 