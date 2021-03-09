import * as core from '@actions/core'
import os from 'os'
import path from 'path'
import {setupPythonInfra} from './install/python'
import {runTests} from './install/test-infra'

async function run(): Promise<void> {
  try {
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
    await runTests(testToolName, testToolVersion, force, additionalTestArgs)
  } catch (err) {
    core.setFailed(err.message)
  }
}

run()
