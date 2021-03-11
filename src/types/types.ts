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

export interface ImageInfra extends BaseInfra {
    tagAsLatest: boolean
    imageSuffix: string
    gitTag: string
    registryUser: string
    registryPassword: string
    registryUrl: string
    imageBaseName: string
    dockerFilePath: string
    push: boolean

    setup(): Promise<void>
    buildImage(): Promise<void>
    login(): Promise<void>
    pushImage(): Promise<void>
}

export interface ConditionalRunnerInfra extends BaseInfra {
    requiredToRun(): Promise<boolean>
}

export interface SpellCheckInfra extends ConditionalRunnerInfra {
    setupPreRequisites(): Promise<number>
    findItAll(): Promise<number>
}

export interface CommentManagerInfra {
    commentPatternToConsider: string

    isValidCommentHandler(): Promise<boolean>
    handleComment(): Promise<boolean>
}
