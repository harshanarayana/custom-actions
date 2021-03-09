interface pluginConfig {
    name: string
    version: string
    force: boolean
    additionalArgs: string
}

interface installableResource {
    installRequired(): Promise<boolean>
    setVersion(): Promise<number>
}

export interface TestInfra extends pluginConfig, installableResource {
    runTests(): Promise<number>
}

export interface LinterInfra extends pluginConfig, installableResource {
    runLinter(): Promise<number>
}
