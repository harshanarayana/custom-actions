import * as core from '@actions/core'
import {getPySpellingInfra} from '../spell-infra/pyspelling'
import {installPythonPackage} from './comon'

export async function runSpellCheck(): Promise<void> {
    const name = core.getInput('spellcheck-infra-name')
    const version = core.getInput('spellcheck-infra-version')
    switch (name.toLowerCase()) {
        case 'pyspelling': {
            const infra = getPySpellingInfra(version, true, core.getInput('spellcheck-additional-args'))
            const required = await infra.installRequired()
            if (required) {
                await infra.setupPreRequisites()
                await installPythonPackage(infra)
                await infra.findItAll()
            } else {
                core.info('No installation of the Spell check infra requires as no matching configuration found')
            }
            return Promise.resolve(undefined)
        }
        default: {
            throw new Error(`No spell check infra with name ${name} and version ${version} is supported`)
        }
    }
}
