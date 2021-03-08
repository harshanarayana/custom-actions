import * as core from '@actions/core'
import os from 'os'
import * as finder from 'setup-python/src/find-python'
import path from 'path'
import {installTox} from './tox/install'
import {runTox} from './tox/run'

async function run(): Promise<void> {
  try {
    const toxVersion = core.getInput('tox-version')
    const version = core.getInput('python-version')
    const toxEnv = core.getInput('tox-env')
    if (version) {
      const arch: string = core.getInput('architecture') || os.arch()
      core.info(
        `##[python-install] Installing Python Version ${version} on ${arch}`
      )
      const installed = await finder.findPythonVersion(version, arch)
      core.info(
        `##[python-install] Successfully setup ${installed.impl} (${installed.version})`
      )
    } else {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(`Found invalid Python Version ${version}`)
    }
    const matchersPath = path.join(__dirname, '..', '.github')
    core.info(`##[add-matcher]${path.join(matchersPath, 'python.json')}`)
    core.info(`##[tox-install] Installing Tox for version ${toxVersion}`)
    await installTox(toxVersion)
    core.info(
      `##[tox-install] Successfully installed Tox for version ${toxVersion}`
    )
    core.info(`##[tox-run] Running Tox environment Action for ${toxEnv}`)
    await runTox(toxEnv)
    core.info(
      `##[tox-run] Completed Running Tox environment Action for ${toxEnv}`
    )
  } catch (err) {
    core.setFailed(err.message)
  }
}

run()
