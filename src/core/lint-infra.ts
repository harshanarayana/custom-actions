import {getBlackInfra} from '../linter-infra/black'
import {installPythonPackage} from './comon'

export async function runLinter(
    lintInfraName: string,
    lintInfraVersion: string,
    force: boolean,
    additionalArgs: string
): Promise<number> {
    switch (lintInfraName.toLowerCase()) {
        case 'black': {
            const infra = getBlackInfra(lintInfraVersion, force, additionalArgs)
            await installPythonPackage(infra)
            await infra.setVersion()
            return await infra.runLinter()
        }
        default: {
            throw new Error(`Invalid Linter Infra with Name ${lintInfraName} and version ${lintInfraVersion}`)
        }
    }
}
