import * as core from '@actions/core'
import {ImageInfra} from '../types/types'
import {setToolVersion} from '../core/comon'
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
    imageSuffix: string
    registryUser: string
    registryPassword: string
    registryUrl: string
    imageBaseName: string
    dockerFilePath: string
    push: boolean

    constructor() {
        this.additionalArgs = ''
        this.force = false
        this.name = 'docker'
        this.version = ''
        this.imageSuffix = core.getInput('docker-image-suffix')
        this.tagAsLatest = core.getInput('tag-image-as-latest') === 'true'
        this.registryUser = core.getInput('registry-auth-user')
        this.registryPassword = core.getInput('registry-auth-password')
        this.registryUrl = core.getInput('registry-url')
        this.imageBaseName = core.getInput('docker-image-base-name')
        this.dockerFilePath = core.getInput('dockerfile-base-dir')
        this.push = core.getInput('push-images') === 'true'
        const repoInfo: g.GitRepoInfo = gitRepoInfo()
        this.gitTag = repoInfo.tag || 'latest'
    }

    async buildImage(): Promise<void> {
        for (const tag of [`${this.imageSuffix}-${this.gitTag}`, `${this.imageSuffix}-latest`]) {
            if (tag.endsWith('-latest') && !this.tagAsLatest) {
                core.info(
                    'Since tag-image-as-latest property is not set to true, the image will not be tagged as latest'
                )
                continue
            }
            core.info(
                `Building Docker image using file ${this.dockerFilePath}/Dockerfile-${this.imageSuffix} to tag it as ${this.imageBaseName}:${tag}`
            )
            const buildState = await commandRunner(
                'docker',
                [
                    'build',
                    '.',
                    '-f',
                    `${this.dockerFilePath}/Dockerfile-${this.imageSuffix}`,
                    '-t',
                    `${this.imageBaseName}:${tag}`
                ],
                true,
                null,
                null
            )
            if (buildState !== 0) {
                throw new Error(`Failed to build docker image for ${this.imageBaseName}:${tag}`)
            }
        }
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
        for (const tag of [`${this.imageSuffix}-${this.gitTag}`, `${this.imageSuffix}-latest`]) {
            if (tag.endsWith('-latest') && !this.tagAsLatest) {
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

    async setVersion(): Promise<number> {
        return setToolVersion('image-infra-version', this)
    }

    async setup(): Promise<void> {
        return Promise.resolve(undefined)
    }
}

export function getDockerInfra(): DockerInfra {
    return new DockerInfra()
}
