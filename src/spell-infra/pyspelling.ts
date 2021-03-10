import {SpellCheckInfra} from '../types/types'
import {argToMap, commandRunner} from '../utils/generic'
import * as core from '@actions/core'
import * as glob from '@actions/glob'
import {setToolVersion} from '../core/comon'

class PyspellingInfra implements SpellCheckInfra {
    additionalArgs: string
    force: boolean
    name: string
    version: string
    argMap: Map<string, string> = new Map<string, string>()
    ignoreError: boolean

    constructor(version: string, force: boolean, additionalArg: string) {
        this.name = 'pyspelling'
        this.version = version
        this.force = force
        this.additionalArgs = additionalArg
        this.argMap = argToMap(additionalArg)
        this.ignoreError = core.getInput('spellcheck-ignore-errors') === 'true'
    }

    async findItAll(): Promise<number> {
        if (!(await this.requiredToRun())) {
            core.info('Skipping the Spell check as there is no configuration files provided to run')
            return Promise.resolve(0)
        }
        const cfgFile = this.argMap.get('-c') || this.argMap.get('--config')
        const args: string[] = []
        if (cfgFile !== undefined && cfgFile.length > 0) {
            args.push(...['--config', cfgFile])
        }
        const state = await commandRunner('pyspelling', args, true, null, null)
        if (state !== 0 && !this.ignoreError) {
            throw new Error('Spell Check failed. Please check the logs to find out the error details')
        }
        return Promise.resolve(0)
    }

    async installRequired(): Promise<boolean> {
        return await this.isSpellCheckEnv()
    }

    async setVersion(): Promise<number> {
        return await setToolVersion('spellcheck-infra-version', this)
    }

    async setupPreRequisites(): Promise<number> {
        for (const arg of [
            ['apt-get', 'update', '-y'],
            ['apt-get', 'install', 'aspell', 'aspell-en', '-y']
        ]) {
            const state = await commandRunner('sudo', arg, true, null, null)
            if (state !== 0) {
                throw new Error(`Failed to Run command ${arg}`)
            }
        }
        return Promise.resolve(0)
    }

    async isSpellCheckEnv(): Promise<boolean> {
        const pattern: string[] = ['**/.pyspelling.yml']

        const cfgFile = this.argMap.get('-c') || this.argMap.get('--config')
        if (cfgFile !== undefined && cfgFile.length > 0) {
            pattern.push(`**/${cfgFile}`)
        }
        const g = await glob.create(pattern.join('\n'), {
            followSymbolicLinks: false
        })
        const files = await g.glob()
        return files.length >= 1
    }

    async requiredToRun(): Promise<boolean> {
        return Promise.resolve(await this.isSpellCheckEnv())
    }
}

export function getPySpellingInfra(version: string, force: boolean, additionalArgs: string): PyspellingInfra {
    return new PyspellingInfra(version, force, additionalArgs)
}
