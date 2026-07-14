import { cp, mkdir, readdir, stat } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const appsDir = join(root, 'apps')

async function exists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', shell: false })
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
  })
}

async function buildApp(slug, appDir) {
  const pkgPath = join(appDir, 'package.json')
  if (!(await exists(pkgPath))) return

  console.log(`Building app: ${slug}`)
  await run('npm', ['run', 'build'], appDir)

  const appDist = join(appDir, 'dist')
  if (!(await exists(appDist))) {
    throw new Error(`Expected build output at apps/${slug}/dist`)
  }

  await cp(appDist, join(dist, slug), { recursive: true })
}

async function main() {
  await mkdir(dist, { recursive: true })
  await cp(join(root, 'index.html'), join(dist, 'index.html'))

  const publicDir = join(root, 'public')
  if (await exists(publicDir)) {
    await cp(publicDir, join(dist, 'public'), { recursive: true })
  }

  if (!(await exists(appsDir))) return

  const entries = await readdir(appsDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue
    await buildApp(entry.name, join(appsDir, entry.name))
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
