import * as core from '@actions/core'
import * as finder from 'setup-python/src/find-python'

interface InstalledVersion {
    impl: string
    version: string
}

export async function setupPythonInfra(version: string, arch: string): Promise<InstalledVersion> {
    core.info(`##[python-install] Installing Python Version ${version} on ${arch}`)
    const installed = await finder.findPythonVersion(version, arch)
    core.info(`##[python-install] Successfully setup ${installed.impl} (${installed.version})`)
    return {impl: installed.impl, version: installed.version}
}
