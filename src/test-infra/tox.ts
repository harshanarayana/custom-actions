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

    constructor(version: string, force: boolean, additionalArg: string) {
        this.name = 'tox'
        this.version = version
        this.force = force
        this.additionalArgs = additionalArg
        this.argMap = argToMap(additionalArg)
    }

    async isToxEnv(): Promise<boolean> {
        const g = await glob.create(
            ['./tox.ini', './pyproject.toml', './setup.cfg', '**/tox.ini', '**/pyproject.toml', '**/setup.cfg'].join(
                '\n'
            ),
            {
                followSymbolicLinks: false
            }
        )
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
        const output: string[] = []
        await commandRunner(
            'tox',
            ['-l'],
            true,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            (function (out: string[]): (data: Buffer) => void {
                return (data: Buffer) => {
                    const bData = data.toString().trim()
                    core.info(bData)
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
            if (valid === InvalidToxEnv) {
                throw new Error(`Invalid Test Environment for tox specified as ${this.argMap.get('-e')}`)
            }
            additionalArg.push(...['-e', this.envName()])
        }
        const state = await commandRunner(
            'tox',
            additionalArg,
            true,
            (data: Buffer) => {
                core.info(data.toString().trim())
            },
            (data: Buffer) => {
                core.error(data.toString().trim())
            }
        )

        if (state !== 0) {
            throw new Error(`Tox Environment ${this.envName()} run completed with an exit code ${state}`)
        }
        return state
    }

    async setVersion(): Promise<number> {
        if (!(await this.installRequired())) {
            core.setOutput('test-infra-version', 'na')
            return 0
        }
        return await commandRunner(
            'tox',
            ['--version'],
            true,
            (data: Buffer) => {
                core.setOutput('test-infra-version', data.toString().trim())
            },
            (data: Buffer) => {
                core.error(data.toString().trim())
            }
        )
    }
}

export function getToxInfra(version: string, force: boolean, additionalArgs: string): TestInfra {
    return new ToxInfra(version, force, additionalArgs)
}
