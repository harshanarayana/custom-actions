import * as core from '@actions/core'
import {LinterInfra} from '../types/types'
import {argToMap, commandRunner} from '../utils/generic'

class BlackInfra implements LinterInfra {
    additionalArgs: string
    force: boolean
    name: string
    version: string
    argMap: Map<string, string> = new Map<string, string>()

    constructor(version: string, force: boolean, additionalArg: string) {
        this.name = 'black'
        this.version = version
        this.force = force
        this.additionalArgs = additionalArg
        this.argMap = argToMap(additionalArg)
    }

    async installRequired(): Promise<boolean> {
        return true
    }

    async runLinter(): Promise<number> {
        return await commandRunner('black', [], true, null, null)
    }

    async setVersion(): Promise<number> {
        return await commandRunner(
            'black',
            ['--version'],
            true,
            (data: Buffer) => {
                core.setOutput('linter-infra-version', data.toString().trim())
            },
            null
        )
    }
}

export function getBlackInfra(version: string, force: boolean, additionalArgs: string): LinterInfra {
    return new BlackInfra(version, force, additionalArgs)
}
