import {LinterInfra, TestInfra} from '../types/types'
import * as core from '@actions/core'
import {ExecOptions} from '@actions/exec/lib/interfaces'
import * as exec from '@actions/exec'

export async function installPythonPackage(infra: TestInfra | LinterInfra): Promise<number> {
    if (!(await infra.installRequired())) {
        core.info(`Package install check returned a false. Ignoring the setup of the test infra`)
        return 0
    } else {
        const options: ExecOptions = {
            silent: true,
            listeners: {
                stdout: (data: Buffer) => {
                    core.info(data.toString().trim())
                },
                stderr: (data: Buffer) => {
                    core.error(data.toString().trim())
                }
            }
        }
        let state: number
        if (infra.version.startsWith('latest')) {
            state = await exec.exec('pip', ['install', '--upgrade', infra.name], options)
        } else {
            state = await exec.exec('pip', ['install', '--upgrade', `${infra.name}==${infra.version}`], options)
        }
        if (state !== 0) {
            throw new Error(`Error setting up ${infra.name} installation for version ${infra.version}`)
        }
        await infra.setVersion()
        return state
    }
}
