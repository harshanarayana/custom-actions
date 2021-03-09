/* eslint-disable @typescript-eslint/no-unused-vars */
import {ExecOptions} from '@actions/exec/lib/interfaces'
import * as exec from '@actions/exec'
import * as core from '@actions/core'

export function argToMap(additionalArgs: string): Map<string, string> {
    const argArray = additionalArgs.split(/\s*,\s*/).map(part => part.split('='))
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new Map<string, string>(argArray)
}

function defaultStdOutCallback(): (data: Buffer) => void {
    return (data: Buffer) => {
        core.info(data.toString().trim())
    }
}

function defaultStdErrCallback(): (data: Buffer) => void {
    return (data: Buffer) => {
        core.error(data.toString().trim())
    }
}

export async function commandRunner(
    cmd: string,
    args: string[],
    silent: boolean,
    stdoutCallback: ((data: Buffer) => void) | null,
    stderrCallback: ((data: Buffer) => void) | null
): Promise<number> {
    const opts: ExecOptions = {
        silent,
        listeners: {
            stdout: stderrCallback || defaultStdOutCallback,
            stderr: stderrCallback || defaultStdErrCallback
        }
    }
    return await exec.exec(cmd, args, opts)
}
