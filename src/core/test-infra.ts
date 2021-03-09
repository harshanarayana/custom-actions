import {getToxInfra} from '../test-infra/tox'
import {installPythonPackage} from './comon'

export async function runTests(
    testInfraName: string,
    testInfraVersion: string,
    force: boolean,
    additionalArgs: string
): Promise<number> {
    switch (testInfraName.toLowerCase()) {
        case 'tox': {
            const infra = getToxInfra(testInfraVersion, force, additionalArgs)
            await installPythonPackage(infra)
            await infra.setVersion()
            return await infra.runTests()
        }
        default: {
            throw new Error(`Invalid Test Infra with Name ${testInfraName} and version ${testInfraVersion}`)
        }
    }
}
