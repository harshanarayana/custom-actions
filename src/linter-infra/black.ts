import {LinterInfra} from '../types/types'
import {argToMap, commandRunner} from '../utils/generic'
import {setToolVersion} from '../core/comon'

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
        const args: string[] = []
        if (this.argMap !== undefined && this.argMap.size > 0) {
            // eslint-disable-next-line github/array-foreach,@typescript-eslint/no-unused-vars
            this.argMap.forEach((value, key, map) => {
                args.push(key)
                args.push(value)
            })
        }
        return commandRunner('black', args, true, null, null)
    }

    async setVersion(): Promise<number> {
        return setToolVersion('linter-infra-version', this)
    }
}

export function getBlackInfra(version: string, force: boolean, additionalArgs: string): LinterInfra {
    return new BlackInfra(version, force, additionalArgs)
}
