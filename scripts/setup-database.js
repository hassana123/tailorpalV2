import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_SERVICE_ROLE_KEY',
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const migrationsDir = path.resolve(__dirname, '..', 'supabase', 'migrations')

async function setupDatabase() {
  try {
    console.log('Applying Supabase SQL migrations...')
    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b))

    if (files.length === 0) {
      console.log('No migration files found.')
      return
    }

    for (const file of files) {
      const fullPath = path.join(migrationsDir, file)
      const sql = await readFile(fullPath, 'utf8')
      console.log(`Running migration: ${file}`)

      const { error } = await supabase.rpc('execute_sql', { sql })
      if (error) {
        console.error(`Migration failed: ${file}`)
        console.error(error.message)
        console.error(
          'If execute_sql RPC is not available, run this SQL manually in Supabase SQL Editor.',
        )
        process.exit(1)
      }
    }

    console.log('Database migrations completed successfully.')
  } catch (error) {
    console.error('Database setup error:', error)
    process.exit(1)
  }
}

setupDatabase()
