import * as core from '@actions/core'
import * as finder from 'setup-python/src/find-python'
import os from 'os'
import {getPipInfra} from '../package-infra/pip'
import {installPythonPackage} from './comon'
import {getBuildToolInfra} from '../package-infra/build'

interface InstalledVersion {
    impl: string
    version: string
}

export async function setupPythonInfra(): Promise<InstalledVersion> {
    const version = core.getInput('python-version')
    const arch = os.arch()
    const pipVersion = core.getInput('pip-version')
    core.info(`##[python-install] Installing Python Version ${version} on ${arch}`)
    const installed = await finder.findPythonVersion(version, arch)
    core.info(`##[python-install] Successfully setup ${installed.impl} (${installed.version})`)
    const pipInfra = getPipInfra(pipVersion)
    await installPythonPackage(pipInfra)
    const buildInfra = getBuildToolInfra('latest')
    await installPythonPackage(buildInfra)
    return {impl: installed.impl, version: installed.version}
}
