import * as core from '@actions/core'
import {ImageInfra} from '../types/types'
import {setToolVersionWithCustomCommand} from '../core/comon'
import * as g from 'git-repo-info'
import gitRepoInfo from 'git-repo-info'
import {commandRunner} from '../utils/generic'

class DockerInfra implements ImageInfra {
    additionalArgs: string
    force: boolean
    name: string
    tagAsLatest: boolean
    version: string
    gitTag: string
    imagePrefix: string
    registryUser: string
    registryPassword: string
    registryUrl: string
    imageBaseName: string
    dockerFilePath: string
    push: boolean
    buildArgs: string
    imageTag: string
    fileSuffix: string

    constructor() {
        this.additionalArgs = ''
        this.force = false
        this.name = 'docker'
        this.version = ''
        this.imagePrefix = core.getInput('docker-image-prefix')
        this.fileSuffix = core.getInput('docker-file-suffix')
        this.tagAsLatest = core.getInput('tag-image-as-latest') === 'true'
        this.registryUser = core.getInput('registry-auth-user')
        this.registryPassword = core.getInput('registry-auth-password')
        this.registryUrl = core.getInput('registry-url')
        this.imageBaseName = core.getInput('docker-image-base-name')
        this.dockerFilePath = core.getInput('dockerfile-base-dir')
        this.push = core.getInput('push-images') === 'true'
        this.buildArgs = core.getInput('docker-build-args')
        this.imageTag = core.getInput('docker-image-tag')
        const repoInfo: g.GitRepoInfo = gitRepoInfo()
        this.gitTag = repoInfo.tag || 'latest'
    }

    getTags(): string[] {
        let tags = [`${this.gitTag}`, `${this.gitTag}-latest`]
        if (this.imagePrefix !== undefined && this.imagePrefix.length > 0) {
            tags = [`${this.imagePrefix}-${this.gitTag}`, `${this.imagePrefix}-latest`]
        }
        if (this.imageTag !== undefined && this.imageTag.length > 0) {
            tags = [this.imageTag]
        }
        return tags
    }

    async buildImage(): Promise<void> {
        const tags = this.getTags()
        let imageFile = `${this.dockerFilePath}/Dockerfile`
        if (this.fileSuffix !== undefined && this.fileSuffix.length > 0) {
            imageFile = `${this.dockerFilePath}/Dockerfile-${this.fileSuffix}`
        }
        for (const tag of tags) {
            if (tag.endsWith('latest') && !this.tagAsLatest) {
                core.info(
                    'Since tag-image-as-latest property is not set to true, the image will not be tagged as latest'
                )
                continue
            }
            core.info(`Building Docker image using file ${imageFile} to tag it as ${this.imageBaseName}:${tag}`)
            const args = [
                'build',
                '.',
                '--pull',
                '--no-cache',
                '-f',
                `${imageFile}`,
                '-t',
                `${this.imageBaseName}:${tag}`
            ]
            if (this.buildArgs !== undefined && this.buildArgs.length > 0) {
                const argParts = this.buildArgs.split(',')
                if (argParts.length > 0) {
                    for (const a of argParts) {
                        args.push(...['--build-arg', a])
                    }
                }
            }
            const buildState = await commandRunner('docker', args, false, null, null)
            if (buildState !== 0) {
                throw new Error(`Failed to build docker image for ${this.imageBaseName}:${tag}`)
            }
        }
        await this.setImageInfoOutput()
    }

    async installRequired(): Promise<boolean> {
        return Promise.resolve(false)
    }

    async login(): Promise<void> {
        const loginDone = await commandRunner(
            'docker',
            ['login', this.registryUrl, '-u', this.registryUser, '-p', this.registryPassword],
            true,
            null,
            null
        )
        if (loginDone !== 0) {
            throw new Error('Failed to Authenticate against docker registry.')
        }
    }

    async pushImage(): Promise<void> {
        if (!this.push) {
            core.info('Ignoring the Docker push as it was explicitly ignored by the user config')
            return Promise.resolve(undefined)
        }
        await this.login()
        for (const tag of this.getTags()) {
            if (tag.endsWith('latest') && !this.tagAsLatest) {
                core.info(
                    'Since tag-image-as-latest property is not set to true, the image will not be published as latest'
                )
                continue
            }
            core.info(`Publishing Docker image using tag ${this.imageBaseName}:${tag}`)
            const pushState = await commandRunner('docker', ['push', `${this.imageBaseName}:${tag}`], true, null, null)
            if (pushState !== 0) {
                throw new Error(`Failed to push Docker Image ${this.imageBaseName}:${tag} to Registry`)
            }
        }
    }

    async setImageInfoOutput(): Promise<number> {
        let totalInfo = ''
        const callback = (data: Buffer): void => {
            totalInfo += data.toString().trim()
        }
        await commandRunner('docker', ['images'], false, callback, callback)
        core.setOutput('image-infra-generated-list', totalInfo)
        return 0
    }

    async setVersion(): Promise<number> {
        return setToolVersionWithCustomCommand('image-infra-version', 'version', this)
    }

    async setup(): Promise<void> {
        return Promise.resolve(undefined)
    }
}

export function getDockerInfra(): DockerInfra {
    return new DockerInfra()
}
