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

export interface BaseInfra extends pluginConfig, installableResource {}

export interface TestInfra extends BaseInfra {
    runTests(): Promise<number>
}

export interface LinterInfra extends BaseInfra {
    runLinter(): Promise<number>
}

export interface PackagePublishInfra extends BaseInfra {
    pypiUser: string
    pypiPassword: string
    pypiAccessToken: string
    packageDir: string
    verifyMetadata: boolean
    skipExisting: boolean

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setupPreRequisites(infra: BaseInfra): Promise<number>
    runPackagePublish(): Promise<number>
    validate(): Promise<boolean>
}
