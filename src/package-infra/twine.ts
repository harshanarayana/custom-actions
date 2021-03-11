import * as glob from '@actions/glob'
import * as core from '@actions/core'
import {BaseInfra, PackagePublishInfra} from '../types/types'
import {argToMap, commandRunner, commandRunnerWithEnv} from '../utils/generic'
import {buildWheelFiles, installPythonPackage, setToolVersion} from '../core/comon'

class TwineInfra implements PackagePublishInfra {
    additionalArgs: string
    force: boolean
    name: string
    version: string
    argMap: Map<string, string> = new Map<string, string>()
    packageDir: string
    pypiPassword: string
    pypiUser: string
    pypiAccessToken: string
    skipExisting: boolean
    verifyMetadata: boolean

    constructor(
        version: string,
        force: boolean,
        additionalArg: string,
        pypiUser: string,
        pypiPassword: string,
        pypiAccessToken: string,
        packageDir: string,
        verifyMetadata: boolean,
        skipExisting: boolean
    ) {
        this.name = 'twine'
        this.version = version
        this.force = force
        this.additionalArgs = additionalArg
        this.argMap = argToMap(additionalArg)
        this.packageDir = packageDir
        this.pypiUser = pypiUser
        this.pypiPassword = pypiPassword
        this.pypiAccessToken = pypiAccessToken
        this.verifyMetadata = verifyMetadata
        this.skipExisting = skipExisting
    }

    async installRequired(): Promise<boolean> {
        return true
    }

    async checkPackageBuildState(): Promise<boolean> {
        const g = await glob.create([`${this.packageDir}/*.tar.gz`, `${this.packageDir}/*.whl`].join('\n'), {
            followSymbolicLinks: false
        })
        const files = await g.glob()
        return files.length >= 2
    }

    async runPackagePublish(): Promise<number> {
        await buildWheelFiles()
        const distBuilt = await this.checkPackageBuildState()
        if (!distBuilt) {
            throw new Error(`PyPi publish will not continue as we did not find any wheel or tar.gz artifact to publish`)
        }
        await this.validate()
        const additionalArgs: string[] = ['upload', '--verbose']
        if (this.skipExisting || this.argMap.get('--skip-existing') === 'true') {
            additionalArgs.push('--skip-existing')
        }
        if (this.verifyMetadata) {
            const state = await commandRunner('twine', ['check', `${this.packageDir}/*`], true, null, null)
            if (state !== 0) {
                throw new Error('Failed to Perform metadata Check using Twine. Publishing will be terminated')
            }
        }
        const env: Map<string, string> = new Map<string, string>()
        env.set('TWINE_USERNAME', this.pypiUser)
        env.set('TWINE_PASSWORD', this.pypiPassword)
        // additionalArgs.push(`${this.packageDir}/*`)
        // additionalArgs.push(...['-u', this.pypiUser, '-p', this.pypiPassword])
        const state = await commandRunnerWithEnv('twine', additionalArgs, true, env, null, null)
        if (state !== 0) {
            throw new Error('Failed to publish Python package to PyPi')
        }
        return Promise.resolve(state)
    }

    async setVersion(): Promise<number> {
        return setToolVersion('package-infra-version', this)
    }

    async setupPreRequisites(infra: BaseInfra): Promise<number> {
        return installPythonPackage(infra)
    }

    async validate(): Promise<boolean> {
        let useToken = false
        if (this.pypiAccessToken.length > 0 && this.pypiAccessToken !== '##DEFAULT##') {
            core.info('Using PyPi Access Token to publish the packages to the Registry')
            useToken = true
        }
        if (useToken && !this.pypiAccessToken.startsWith('pypi-')) {
            core.error(
                "You have Provided a PyPi Access token but it doesn't start with 'pypi-' like it should. " +
                    'Will attempt to use the Username and Password if available'
            )
            useToken = false
        } else {
            this.pypiUser = '__token__'
            this.pypiPassword = this.pypiAccessToken
        }

        if (
            ((this.pypiUser.length > 0 && this.pypiUser === '##DEFAULT##') ||
                (this.pypiPassword.length > 0 && this.pypiPassword === '##DEFAULT##')) &&
            !useToken
        ) {
            throw new Error('Either PyPi Username and Password or PyPi access token needs to be provided')
        }
        return Promise.resolve(true)
    }
}

export function getTwineInfra(
    version: string,
    force: boolean,
    additionalArg: string,
    pypiUser: string,
    pypiPassword: string,
    pypiAccessToken: string,
    packageDir: string,
    verifyMetadata: boolean,
    skipExisting: boolean
): TwineInfra {
    return new TwineInfra(
        version,
        force,
        additionalArg,
        pypiUser,
        pypiPassword,
        pypiAccessToken,
        packageDir,
        verifyMetadata,
        skipExisting
    )
}
