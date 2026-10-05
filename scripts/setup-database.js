/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node entrypoint uses CommonJS. */
const { runDatabaseScript } = require('./database-runner')
try { runDatabaseScript() } catch (error) { console.error(error.message); process.exitCode = 1 }

