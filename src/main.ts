import * as core from '@actions/core'
import os from 'os'
import path from 'path'
import {setupPythonInfra} from './core/python'
import {runTests} from './core/test-infra'
import {runLinter} from './core/lint-infra'
import {runPackagePublish} from './core/package-infra'

async function run(): Promise<void> {
    try {
        const action = core.getInput('action')
        await setupPythonInfra()
        const matchersPath = path.join(__dirname, '..', '.github')
        core.info(`##[add-matcher]${path.join(matchersPath, 'python.json')}`)
        switch (action.toLowerCase()) {
            case 'tests':
            case 'test':
                await runTests()
                break
            case 'lint':
            case 'linter':
                await runLinter()
                break
            case 'publish':
            case 'pypi':
            case 'package-publish':
                await runPackagePublish()
                break
            default:
                core.info(`Plugin action ${action} is a non supported entity`)
        }
    } catch (err) {
        core.setFailed(err.message)
    }
}

run()
