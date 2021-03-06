import * as glob from '@actions/glob'
import * as core from '@actions/core'
import {InvalidToxEnv, NonToxRepo, ToxValidateState, ValidToxEnv} from './common'
import {TestInfra} from '../types/types'
import {argToMap, commandRunner} from '../utils/generic'

class ToxInfra implements TestInfra {
    force: boolean
    name: string
    version: string
    additionalArgs: string
    argMap: Map<string, string> = new Map<string, string>()
    retry: number

    constructor(version: string, force: boolean, additionalArg: string) {
        this.name = 'tox'
        this.version = version
        this.force = force
        this.retry = parseInt(core.getInput('test-failure-retry'))
        this.additionalArgs = additionalArg
        this.argMap = argToMap(additionalArg)
        for (const k of this.argMap.keys()) {
            core.info(`Tox Runtime Argument key: ${k} value: ${this.argMap.get(k)}`)
        }
    }

    async isToxEnv(): Promise<boolean> {
        const configFiles = [
            './tox.ini',
            './pyproject.toml',
            './setup.cfg',
            '**/tox.ini',
            '**/pyproject.toml',
            '**/setup.cfg'
        ]
        const conf = this.argMap.get('-c')
        if (conf !== undefined && conf.length > 0) {
            configFiles.push(conf)
        }
        const g = await glob.create(configFiles.join('\n'), {
            followSymbolicLinks: false
        })
        const files = await g.glob()
        core.info(`Found Matching files are ${files}`)
        return files.length >= 1
    }

    async installRequired(): Promise<boolean> {
        if (this.force) {
            return true
        }
        return await this.isToxEnv()
    }

    envName(): string {
        const e = this.argMap.get('-e')
        if (e === undefined) {
            return ''
        }
        return e
    }

    async testIfValidToxEnv(): Promise<ToxValidateState> {
        const toxRequired = this.isToxEnv()
        if (!toxRequired) {
            return NonToxRepo
        }
        const args = ['-l']
        const conf = this.argMap.get('-c')
        if (conf !== undefined && conf.length > 0) {
            args.push(...['-c', conf])
        }
        const output: string[] = []
        await commandRunner(
            'tox',
            args,
            true,
            (function (out: string[]): (data: Buffer) => void {
                return (data: Buffer) => {
                    const bData = data.toString().trim()
                    out.push(...bData.split('\n'))
                }
            })(output),
            (data: Buffer) => {
                core.error(data.toString().trim())
            }
        )
        const filteredData = output.filter(line => {
            return line === this.envName()
        })
        if (filteredData.length > 0) {
            return ValidToxEnv
        } else {
            return InvalidToxEnv
        }
    }

    async runTests(): Promise<number> {
        if (!(await this.installRequired())) {
            core.info(`No Tooling for running tox was installed. Test will be skipped`)
            return 0
        }
        const additionalArg: string[] = []
        if (this.envName().length > 0) {
            const valid = await this.testIfValidToxEnv()
            if (valid === NonToxRepo) {
                core.info('You are on a non tox repository. No action to be performed')
                return 0
            }
            if (valid === InvalidToxEnv && !process.platform.startsWith('win')) {
                throw new Error(`Invalid Test Environment for tox specified as ${this.argMap.get('-e')}`)
            }
            additionalArg.push(...['-e', this.envName()])
        }
        const conf = this.argMap.get('-c')
        if (conf !== undefined && conf.length > 0) {
            additionalArg.push(...['-c', conf])
        }
        for (const k of this.argMap.keys()) {
            if (k === '-c' || k === '-e') {
                continue
            }
            if (k.startsWith('-v')) {
                additionalArg.push(k)
                continue
            }
            const v = this.argMap.get(k)
            if (v !== undefined) {
                additionalArg.push(...[k, v])
            }
        }
        if (isNaN(this.retry) || this.retry < 1) {
            this.retry = 1
        }
        const retry = [...Array(this.retry).keys()]
        for (let attempt = 1; attempt <= retry.length; attempt++) {
            core.startGroup(`[Attempt ${attempt}] Run Unit Tests using Tox`)
            const state = await commandRunner('tox', additionalArg, true, null, null)
            core.endGroup()
            if (state === 0) {
                return Promise.resolve(state)
            } else if (attempt >= retry.length) {
                throw new Error(`Tox Environment ${this.envName()} run completed with an exit code ${state}`)
            }
        }
        return Promise.resolve(1)
    }

    async setVersion(): Promise<number> {
        if (!(await this.installRequired())) {
            core.setOutput('test-infra-version', 'na')
            return 0
        }
        return await commandRunner('tox', ['--version'], true, null, null)
    }
}

export function getToxInfra(version: string, force: boolean, additionalArgs: string): TestInfra {
    return new ToxInfra(version, force, additionalArgs)
}
