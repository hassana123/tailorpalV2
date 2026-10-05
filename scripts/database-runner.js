/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node scripts use CommonJS in this package. */
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
function runDatabaseScript(seed = false) {
  const relative = seed ? 'supabase/seed.sql' : 'supabase/migrations/202610050001_master_schema.sql'
  if (!process.argv.includes('--apply')) {
    console.log(`Run the complete contents of ${relative} in your new Supabase project's SQL Editor.`)
    if (seed) console.log('Sign up first, then check tailorpal.demo_owner_email in the SQL matches your account email.')
    console.log('Terminal: install psql, set SUPABASE_DB_URL in .env, then add -- --apply.')
    return
  }
  const connection = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  if (!connection) throw new Error('Set SUPABASE_DB_URL to the new project direct/session PostgreSQL connection string. API keys cannot run schema SQL.')
  let sql = fs.readFileSync(path.resolve(__dirname, '..', relative), 'utf8')
  if (seed) {
    const email = process.env.DEMO_OWNER_EMAIL
    if (!email) throw new Error('Set DEMO_OWNER_EMAIL to your signed-up owner account email.')
    sql = sql.replace(
      /set local tailorpal\.demo_owner_email = '[^\n]*';/,
      () => `set local tailorpal.demo_owner_email = '${email.replace(/'/g, "''")}';`,
    )
  }
  const result = spawnSync('psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-f', '-'], {
    env: { ...process.env, PGDATABASE: connection }, input: sql, encoding: 'utf8',
  })
  if (result.error) throw new Error('Could not run psql. Install PostgreSQL client tools or use Supabase SQL Editor.')
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.status !== 0) {
    if (result.stderr) process.stderr.write(result.stderr.replaceAll(connection, '[database connection]'))
    throw new Error('Database script failed; check the SQL error above.')
  }
  console.log(`${seed ? 'Demo seed' : 'Schema setup'} completed.`)
}
module.exports = { runDatabaseScript }
