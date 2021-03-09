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

export async function commandRunnerWithEnv(
    cmd: string,
    args: string[],
    silent: boolean,
    env: Map<string, string>,
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
    if (env !== undefined && env.size > 0) {
        // eslint-disable-next-line github/array-foreach
        env.forEach((value, key) => {
            process.env[key] = value
        })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        opts.env = {
            ...process.env
        }
    }
    return exec.exec(cmd, args, opts)
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
    return exec.exec(cmd, args, opts)
}
