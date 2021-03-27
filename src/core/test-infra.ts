import * as core from '@actions/core'
import {getToxInfra} from '../test-infra/tox'
import {installPythonPackage} from './comon'

export async function runTests(): Promise<number> {
    const name = core.getInput('test-infra-tool')
    const version = core.getInput('test-infra-version')
    core.startGroup(`Running Test infra with tool: ${name} and version ${version}`)
    switch (name.toLowerCase()) {
        case 'tox': {
            const infra = getToxInfra(
                version,
                core.getInput('test-tool-install-force') === 'true',
                core.getInput('test-additional-args')
            )
            core.startGroup(`Setting up Tox dependencies`)
            await installPythonPackage(infra)
            core.endGroup()
            await infra.setVersion()
            core.startGroup(`Running Tox Tests`)
            const stat = await infra.runTests()
            core.endGroup()
            core.endGroup()
            return Promise.resolve(stat)
        }
        default: {
            core.endGroup()
            throw new Error(`Invalid Test Infra with Name ${name} and version ${version}`)
        }
    }
}
