import * as core from '@actions/core'
import os from 'os'
import path from 'path'
import {setupPythonInfra} from './core/python'
import {runTests} from './core/test-infra'

async function run(): Promise<void> {
  try {
    const action = core.getInput('action')
    const testToolName = core.getInput('text-infra-tool')
    const testToolVersion = core.getInput('test-infra-version')
    const additionalTestArgs = core.getInput('additional-test-args')
    const force =
      core.getInput('force-test-tool-install').toLowerCase() === 'true'
    const version = core.getInput('python-version')
    const arch: string = core.getInput('architecture') || os.arch()
    await setupPythonInfra(version, arch)
    const matchersPath = path.join(__dirname, '..', '.github')
    core.info(`##[add-matcher]${path.join(matchersPath, 'python.json')}`)
    switch (action.toLowerCase()) {
      case 'tests':
      case 'test':
        await runTests(testToolName, testToolVersion, force, additionalTestArgs)
        break
      default:
        core.info(`Plugin action ${action} is a non supported entity`)
    }
  } catch (err) {
    core.setFailed(err.message)
  }
}

run()
