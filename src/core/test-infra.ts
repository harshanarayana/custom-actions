import * as core from '@actions/core'
import {getToxInfra} from '../test-infra/tox'
import {installPythonPackage} from './comon'

export async function runTests(): Promise<number> {
    const name = core.getInput('test-infra-tool')
    const version = core.getInput('test-infra-version')
    switch (name.toLowerCase()) {
        case 'tox': {
            const infra = getToxInfra(
                version,
                core.getInput('test-tool-install-force') === 'true',
                core.getInput('test-additional-args')
            )
            await installPythonPackage(infra)
            await infra.setVersion()
            return infra.runTests()
        }
        default: {
            throw new Error(`Invalid Test Infra with Name ${name} and version ${version}`)
        }
    }
}
