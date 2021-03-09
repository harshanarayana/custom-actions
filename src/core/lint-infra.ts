import * as core from '@actions/core'
import {getBlackInfra} from '../linter-infra/black'
import {installPythonPackage} from './comon'

export async function runLinter(): Promise<number> {
    const name = core.getInput('linter-infra-tool')
    const version = core.getInput('linter-infra-version')
    switch (name.toLowerCase()) {
        case 'black': {
            const infra = getBlackInfra(version, true, core.getInput('linter-additional-args'))
            await installPythonPackage(infra)
            await infra.setVersion()
            return infra.runLinter()
        }
        default: {
            throw new Error(`Invalid Linter Infra with Name ${name} and version ${version}`)
        }
    }
}
