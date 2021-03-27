import * as core from '@actions/core'
import * as finder from 'setup-python/src/find-python'
import * as finderPypy from 'setup-python/src/find-pypy'
import os from 'os'
import {getPipInfra} from '../package-infra/pip'
import {installPythonPackage} from './comon'
import {getBuildToolInfra} from '../package-infra/build'

interface InstalledVersion {
    impl: string
    version: string
}

export async function setupPythonInfra(): Promise<InstalledVersion | void> {
    if (core.getInput('ignore-python-setup') === 'true') {
        core.info('Ignoring setting up python Environment as it was configured by the Build context')
        return Promise.resolve(undefined)
    }
    const version = core.getInput('python-version')
    const arch = os.arch()
    const pipVersion = core.getInput('pip-version')
    let pyImpl: string
    let pyVersion: string
    if (version.startsWith('pypy')) {
        core.info(`##[pypy-python-install] Installing Python Version ${version} on ${arch}`)
        const installed = await finderPypy.findPyPyVersion(version, arch)
        core.info(
            `##[pypy-python-install] Successfully setup ${installed.resolvedPyPyVersion} (${installed.resolvedPythonVersion})`
        )
        pyImpl = installed.resolvedPyPyVersion
        pyVersion = installed.resolvedPythonVersion
    } else {
        core.info(`##[python-install] Installing Python Version ${version} on ${arch}`)
        const installed = await finder.findPythonVersion(version, arch)
        core.info(`##[python-install] Successfully setup ${installed.impl} (${installed.version})`)
        pyImpl = installed.impl
        pyVersion = installed.version
    }
    const pipInfra = getPipInfra(pipVersion)
    await installPythonPackage(pipInfra)
    const buildInfra = getBuildToolInfra('latest')
    await installPythonPackage(buildInfra)
    return {impl: pyImpl, version: pyVersion}
}
