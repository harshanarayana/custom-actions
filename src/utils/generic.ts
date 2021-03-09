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

function defaultStdOutLineCallback(): (data: string) => void {
    return (data: string) => {
        core.info(data)
    }
}

function defaultStdErrLineCallback(): (data: string) => void {
    return (data: string) => {
        core.error(data)
    }
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

function createExecOpts(
    bufferMode: boolean,
    silent: boolean,
    env: Map<string, string>,
    stdoutCallback: ((data: Buffer) => void) | null,
    stderrCallback: ((data: Buffer) => void) | null,
    stdLineCallback: ((data: string) => void) | null,
    errLineCallback: ((data: string) => void) | null
): ExecOptions {
    const opts: ExecOptions = {
        silent: true
    }
    if (bufferMode) {
        opts.listeners = {
            stdout: stdoutCallback || defaultStdOutCallback,
            stderr: stderrCallback || defaultStdErrCallback
        }
    } else {
        opts.listeners = {
            stdline: stdLineCallback || defaultStdOutLineCallback,
            errline: errLineCallback || defaultStdErrLineCallback
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
    return opts
}

export async function commandRunnerWithEnv(
    cmd: string,
    args: string[],
    silent: boolean,
    env: Map<string, string>,
    stdoutCallback: ((data: Buffer) => void) | null,
    stderrCallback: ((data: Buffer) => void) | null
): Promise<number> {
    const opts = createExecOpts(true, silent, env, stdoutCallback, stderrCallback, null, null)
    return await exec.exec(cmd, args, opts)
}

export async function commandRunner(
    cmd: string,
    args: string[],
    silent: boolean,
    stdoutCallback: ((data: Buffer) => void) | null,
    stderrCallback: ((data: Buffer) => void) | null
): Promise<number> {
    const opts = createExecOpts(true, silent, new Map<string, string>(), stdoutCallback, stderrCallback, null, null)
    return await exec.exec(cmd, args, opts)
}

export async function commandRunnerWithLineCallback(
    cmd: string,
    args: string[],
    silent: boolean,
    env: Map<string, string>,
    stdLineCallback: ((data: string) => void) | null,
    errLineCallback: ((data: string) => void) | null
): Promise<number> {
    const opts = createExecOpts(false, silent, env, null, null, stdLineCallback, errLineCallback)
    return await exec.exec(cmd, args, opts)
}
