import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL in backend/.env')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

// 1) Single-statement runner 
export async function runQuery(query, params = []) {
  console.log('\nRunning SQL:\n', query)
  try {
    const res = await sql.query(query, params) // one statement per call
    // If it's a SELECT, print rows (res.rows may be undefined in some versions)
    const rows = Array.isArray(res) ? res : (res?.rows ?? undefined)
    if (rows) console.dir(rows, { depth: null })
    else console.log('OK')
    return rows ?? null
  } catch (e) {
    console.error('Error:', e.message)
    throw e
  }
}

// 2) Multi-statement helper 
export async function runScript(script) {
  const statements = script
    .split(';')                 // simple split 
    .map(s => s.trim())
    .filter(Boolean)

  for (const stmt of statements) {
    await runQuery(stmt)
  }
}

export const createUsersTable = `
  -- helpers
  create extension if not exists pgcrypto;
  create extension if not exists citext;

  create table if not exists users (
    id                  uuid primary key default gen_random_uuid(),

    first_name          text not null,
    last_name           text not null,
    email               citext not null unique,

    password_hash       bytea not null check (octet_length(password_hash) = 60),
    password_salt       bytea not null check (octet_length(password_salt) = 16),

    created_at          timestamptz not null default now(),

    constraint users_first_name_len check (char_length(btrim(first_name)) between 1 and 100),
    constraint users_last_name_len  check (char_length(btrim(last_name))  between 1 and 100),
    constraint users_email_len      check (char_length(btrim(email)) <= 254)
  );
`;

// Example reads/writes
export const selectAllUsers = "select * from users";

export const listCurrentSchemaTables = `
  select table_name
  from information_schema.tables
  where table_schema = current_schema()
  order by table_name;
`;

export const customQuery = `
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
`

const all = {
  customQuery,
  createUsersTable,
  selectAllUsers,
  listCurrentSchemaTables
}

const query = all.customQuery

await runQuery(query)
//await runScript(query)