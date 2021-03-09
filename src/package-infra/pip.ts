import {BaseInfra} from '../types/types'
import {setToolVersion} from '../core/comon'

class PipInfra implements BaseInfra {
    additionalArgs: string
    force: boolean
    name: string
    version: string

    constructor(version: string, force: boolean, additionalArg: string) {
        this.name = 'pip'
        this.version = version
        this.force = force
        this.additionalArgs = additionalArg
    }

    async installRequired(): Promise<boolean> {
        return Promise.resolve(true)
    }

    async setVersion(): Promise<number> {
        return setToolVersion('pip-version', this)
    }
}

export function getPipInfra(version: string): PipInfra {
    return new PipInfra(version, true, '')
}
