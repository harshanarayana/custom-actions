import * as core from '@actions/core'
import os from 'os'
import path from 'path'
import {setupPythonInfra} from './core/python'
import {runTests} from './core/test-infra'
import {runLinter} from './core/lint-infra'
import {runPackagePublish} from './core/package-infra'
import {runImageBuilder} from './core/image-infra'
import {runSpellCheck} from './core/spell-infra'
import {runCommentInfra} from './core/comment-infra'

async function run(): Promise<void> {
    const action = core.getInput('action')
    core.startGroup(`Workflow Handler for Action: ${action}`)
    try {
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
            case 'image-publish':
            case 'docker-build':
            case 'docker-image':
                await runImageBuilder()
                break
            case 'spellcheck':
            case 'typo':
                await runSpellCheck()
                break
            case 'comment':
            case 'comment-bot':
                await runCommentInfra()
                break
            default:
                core.info(`Plugin action ${action} is a non supported entity`)
        }
    } catch (err) {
        core.setFailed(err.message)
    }
    core.endGroup()
}

run()
