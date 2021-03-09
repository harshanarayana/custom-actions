import * as core from '@actions/core'
import {getTwineInfra} from '../package-infra/twine'
import {installPythonPackage} from './comon'

export async function runPackagePublish(): Promise<number> {
    const name = core.getInput('package-infra-name')
    const version = core.getInput('package-infra-version')
    switch (name.toLowerCase()) {
        case 'twine': {
            const infra = getTwineInfra(
                version,
                true,
                '',
                core.getInput('pypi-user'),
                core.getInput('pypi-user-password'),
                core.getInput('pypi-access-token'),
                core.getInput('pypi-package-dir'),
                core.getInput('pypi-verify-metadata') === 'true',
                core.getInput('pypi-skip-existing') === 'true'
            )
            await installPythonPackage(infra)
            return infra.runPackagePublish()
        }
        default: {
            throw new Error(`Invalid Package Publish Infra with name ${name} and ${version}`)
        }
    }
}
