import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

if (existsSync('db.sqlite')) {
  process.exit(0)
}

const result = spawnSync('npx', ['cds', 'deploy', '--to', 'sqlite:db.sqlite'], { stdio: 'inherit' })
process.exit(result.status ?? 1)
