/* eslint-disable @typescript-eslint/no-unused-vars */
import {ExecOptions} from '@actions/exec/lib/interfaces'
import * as exec from '@actions/exec'
import * as core from '@actions/core'
import execa from 'execa'
import {promisify} from 'util'
import * as fs from 'fs'

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
            stderr: stderrCallback || defaultStdErrCallback,
            stdline: stdLineCallback || defaultStdOutLineCallback,
            errline: errLineCallback || defaultStdErrLineCallback,
            debug: defaultStdOutLineCallback
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
    const status = await execaCommandRunner(cmd, args, env, stdoutCallback, stderrCallback, null, null)
    if (status === 237) {
        return await exec.exec(cmd, args, opts)
    } else {
        return Promise.resolve(status)
    }
}

export async function commandRunner(
    cmd: string,
    args: string[],
    silent: boolean,
    stdoutCallback: ((data: Buffer) => void) | null,
    stderrCallback: ((data: Buffer) => void) | null
): Promise<number> {
    const opts = createExecOpts(true, silent, new Map<string, string>(), stdoutCallback, stderrCallback, null, null)
    const status = await execaCommandRunner(
        cmd,
        args,
        new Map<string, string>(),
        stdoutCallback,
        stderrCallback,
        null,
        null
    )
    if (status === 237) {
        return await exec.exec(cmd, args, opts)
    } else {
        return Promise.resolve(status)
    }
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
    const status = await execaCommandRunner(cmd, args, env, null, null, stdLineCallback, errLineCallback)
    if (status === 237) {
        return await exec.exec(cmd, args, opts)
    } else {
        return Promise.resolve(status)
    }
}

export async function execaCommandRunner(
    cmd: string,
    args: string[],
    env: Map<string, string>,
    stdoutCallback: ((data: Buffer) => void) | null,
    stderrCallback: ((data: Buffer) => void) | null,
    stdLineCallback: ((data: string) => void) | null,
    errLineCallback: ((data: string) => void) | null
): Promise<number> {
    if (env !== undefined && env.size > 0) {
        // eslint-disable-next-line github/array-foreach
        env.forEach((value, key) => {
            process.env[key] = value
        })
    }
    let stderr: execa.StdioOption = undefined
    let stdout: execa.StdioOption = undefined
    if (stderrCallback === undefined && errLineCallback === undefined) {
        stderr = process.stderr
    }
    if (stdoutCallback === undefined && stdLineCallback === undefined) {
        stdout = process.stdout
    }
    const opts: execa.Options = {
        cleanup: true,
        stdout,
        stderr,
        extendEnv: true,
        env: process.env,
        buffer: true
    }

    let cmdToLog = cmd
    if (cmd === 'docker') {
        if (!args.includes('login')) {
            cmdToLog += ` ${args.join(' ')}`
        }
    } else {
        cmdToLog += ` ${args.join(' ')}`
    }

    core.info(`Running Base command: ${cmdToLog}`)
    try {
        const out = await execa(cmd, args, opts)
        core.info(`Command : ${cmdToLog} finished with ${out.exitCode}`)
        if (out.exitCode !== 0) {
            if (out.stderr !== undefined) {
                core.error(out.stderr)
                if (stderrCallback !== null) {
                    stderrCallback(Buffer.from(out.stderr, 'utf-8'))
                }
                if (errLineCallback !== null) {
                    errLineCallback(out.stderr)
                }
            }
        } else {
            if (out.stdout !== undefined) {
                core.info(out.stdout)
                if (stdoutCallback !== null) {
                    stdoutCallback(Buffer.from(out.stdout, 'utf-8'))
                }
                if (stdLineCallback !== null) {
                    stdLineCallback(out.stdout)
                }
            }
        }
        return Promise.resolve(out.exitCode)
    } catch (e) {
        core.info(`cmd: ${cmdToLog} finished with ${e.stack}`)
    }
    return Promise.resolve(237)
}

export async function readEventData(): Promise<string> {
    const readFile = promisify(fs.readFile)
    async function getEvent(): Promise<Buffer | void> {
        const eventFile: string | undefined = process.env.GITHUB_EVENT_PATH
        if (eventFile !== undefined) {
            return readFile(eventFile)
        }
        return Promise.resolve(undefined)
    }
    const data = await getEvent()
    if (data !== undefined) {
        return Promise.resolve(data.toString().trim())
    }
    return Promise.resolve('')
}
