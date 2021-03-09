import {BaseInfra} from '../types/types'

class BuildInfra implements BaseInfra {
    additionalArgs: string
    force: boolean
    name: string
    version: string

    constructor(version: string, force: boolean, additionalArg: string) {
        this.name = 'build'
        this.version = version
        this.force = force
        this.additionalArgs = additionalArg
    }

    async installRequired(): Promise<boolean> {
        return Promise.resolve(true)
    }

    async setVersion(): Promise<number> {
        return Promise.resolve(0)
    }
}

export function getBuildToolInfra(version: string): BuildInfra {
    return new BuildInfra(version, true, '')
}
