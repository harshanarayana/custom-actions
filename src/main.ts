import * as core from '@actions/core'
import os from 'os'
import path from 'path'
import {setupPythonInfra} from './core/python'
import {runTests} from './core/test-infra'
import {runLinter} from './core/lint-infra'

async function run(): Promise<void> {
    try {
        const action = core.getInput('action')

        // Base Python Infra
        const version = core.getInput('python-version')
        const arch: string = core.getInput('architecture') || os.arch()

        // Test Tool Version
        const testToolName = core.getInput('test-infra-tool')
        const testToolVersion = core.getInput('test-infra-version')
        const additionalTestArgs = core.getInput('additional-test-args')
        const force = core.getInput('force-test-tool-install').toLowerCase() === 'true'

        // linter tool config
        const linterToolName = core.getInput('linter-infra-tool')
        const linterToolVersion = core.getInput('linter-infra-version')
        const additionalLinterArgs = core.getInput('additional-linter-args')

        await setupPythonInfra(version, arch)
        const matchersPath = path.join(__dirname, '..', '.github')
        core.info(`##[add-matcher]${path.join(matchersPath, 'python.json')}`)
        switch (action.toLowerCase()) {
            case 'tests':
            case 'test':
                await runTests(testToolName, testToolVersion, force, additionalTestArgs)
                break
            case 'lint':
            case 'linter':
                await runLinter(linterToolName, linterToolVersion, true, additionalLinterArgs)
                break
            default:
                core.info(`Plugin action ${action} is a non supported entity`)
        }
    } catch (err) {
        core.setFailed(err.message)
    }
}

run()
