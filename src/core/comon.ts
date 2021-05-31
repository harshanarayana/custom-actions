import {BaseInfra} from '../types/types'
import * as core from '@actions/core'
import {ExecOptions} from '@actions/exec/lib/interfaces'
import * as exec from '@actions/exec'
import {commandRunner} from '../utils/generic'

export async function installPythonPackage(infra: BaseInfra): Promise<number> {
    if (!(await infra.installRequired())) {
        core.info(`Package install check returned a false. Ignoring the setup of the test infra`)
        return Promise.resolve(0)
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
        const pipArgs = ['install', '--upgrade', ]
        if (infra.version.startsWith('latest')) {
            pipArgs.push(infra.name)
        } else {
            pipArgs.push(`${infra.name}==${infra.version}`)
        }
        const pipExtraArgs = core.getInput('pip-extra-args')
        if (pipExtraArgs) {
            pipArgs.push(pipExtraArgs)
        }
        state = await exec.exec('pip', pipArgs, options)
        if (state !== 0) {
            throw new Error(`Error setting up ${infra.name} installation for version ${infra.version}`)
        }
        await infra.setVersion()
        return Promise.resolve(state)
    }
}

export async function buildWheelFiles(): Promise<number> {
    const distPath = core.getInput('pypi-package-dir') || 'dist/'
    return commandRunner(
        'python',
        ['-m', 'build', '--sdist', '--wheel', '--outdir', distPath],
        true,
        data => {
            core.info(data.toString().trim())
        },
        data => {
            core.error(data.toString().trim())
        }
    )
}

export async function setToolVersionWithCustomCommand(
    outputName: string,
    cmd: string,
    infra: BaseInfra
): Promise<number> {
    let info = ''
    const state = await commandRunner(
        infra.name,
        [cmd],
        true,
        data => {
            info += data.toString().trim()
        },
        data => {
            info += data.toString().trim()
        }
    )
    core.setOutput(outputName, info)
    return Promise.resolve(state)
}

export async function setToolVersion(outputName: string, infra: BaseInfra): Promise<number> {
    return commandRunner(
        infra.name,
        ['--version'],
        true,
        data => {
            core.setOutput(outputName, data.toString().trim())
        },
        null
    )
}
