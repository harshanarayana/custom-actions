import {TestInfra} from '../core/test-infra'
import * as glob from '@actions/glob'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import {ExecOptions} from '@actions/exec/lib/interfaces'
import {
  InvalidToxEnv,
  NonToxRepo,
  ToxValidateState,
  ValidToxEnv
} from './common'

class ToxInfra implements TestInfra {
  force: boolean
  name: string
  version: string
  additionalArgs: string
  argMap: Map<string, string> = new Map<string, string>()

  constructor(version: string, force: boolean, additionalArg: string) {
    this.name = 'tox'
    this.version = version
    this.force = force
    this.additionalArgs = additionalArg
    this.argToMap()
  }

  async isToxEnv(): Promise<boolean> {
    const g = await glob.create(
      ['**/tox.ini', '**/pyproject.toml', '**/setup.cfg'].join('\n'),
      {followSymbolicLinks: false}
    )
    const files = await g.glob()
    return files.length >= 1
  }

  async installRequired(): Promise<boolean> {
    if (this.force) {
      return true
    }
    return await this.isToxEnv()
  }

  argToMap(): void {
    const argArray = this.additionalArgs
      .split(/\s*,\s*/)
      .map(part => part.split('='))
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.argMap = new Map<string, string>(argArray)
  }

  envName(): string {
    const e = this.argMap.get('-e')
    if (e === undefined) {
      return ''
    }
    return e
  }

  async testIfValidToxEnv(): Promise<ToxValidateState> {
    const toxRequired = this.isToxEnv()
    if (!toxRequired) {
      return NonToxRepo
    }
    const output: string[] = []
    const opts: ExecOptions = {
      silent: true,
      listeners: {
        stdout: (data: Buffer) => {
          const bData = data.toString().trim()
          core.info(bData)
          output.push(...bData.split('\n'))
        },
        stderr: (data: Buffer) => {
          core.error(data.toString().trim())
        }
      }
    }
    await exec.exec('tox', ['-l'], opts)
    const filteredData = output.filter(line => {
      return line === this.envName()
    })
    if (filteredData.length > 0) {
      return ValidToxEnv
    } else {
      return InvalidToxEnv
    }
  }

  async runTests(): Promise<number> {
    if (!(await this.installRequired())) {
      core.info(
        `No Tooling for running tox was installed. Test will be skipped`
      )
      return 0
    }
    const additionalArg: string[] = []
    if (this.envName().length > 0) {
      const valid = await this.testIfValidToxEnv()
      if (valid === NonToxRepo) {
        core.info('You are on a non tox repository. No action to be performed')
        return 0
      }
      if (valid === InvalidToxEnv) {
        throw new Error(
          `Invalid Test Environment for tox specified as ${this.argMap.get(
            '-e'
          )}`
        )
      }
      additionalArg.push(...['-e', this.envName()])
    }
    const options: ExecOptions = {
      silent: true,
      listeners: {
        stdout: (data: Buffer) => {
          core.info(data.toString().trim())
        },
        stderr: (data: Buffer) => {
          core.error(data.toString().trim())
        }
      }
    }
    const state = await exec.exec('tox', additionalArg, options)
    if (state !== 0) {
      throw new Error(
        `Tox Environment ${this.envName()} run completed with an exit code ${state}`
      )
    }
    return state
  }

  async setVersion(): Promise<number> {
    if (!(await this.installRequired())) {
      core.setOutput('test-infra-version', 'na')
      return 0
    }
    const options: ExecOptions = {
      silent: true,
      listeners: {
        stdout: (data: Buffer) => {
          core.setOutput('test-infra-version', data.toString().trim())
        },
        stderr: (data: Buffer) => {
          core.error(data.toString().trim())
        }
      }
    }
    return await exec.exec('tox', ['--version'], options)
  }
}

export function getToxInfra(
  version: string,
  force: boolean,
  additionalArgs: string
): TestInfra {
  return new ToxInfra(version, force, additionalArgs)
}
