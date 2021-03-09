import * as core from '@actions/core'
import * as exec from '@actions/exec'
import {ExecOptions} from '@actions/exec/lib/interfaces'
import {getToxInfra} from '../tox/tox'

export interface TestInfra {
  name: string
  version: string
  force: boolean
  additionalArgs: string
  installRequired(): Promise<boolean>
  runTests(): Promise<number>
  setVersion(): Promise<number>
}

async function installTestInfra(infra: TestInfra): Promise<number> {
  if (!(await infra.installRequired())) {
    core.info(
      `Test infra install check returned a false. Ignoring the setup of the test infra`
    )
    return 0
  } else {
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
    let state: number
    if (infra.version.startsWith('latest')) {
      state = await exec.exec(
        'pip',
        ['install', '--upgrade', infra.name],
        options
      )
    } else {
      state = await exec.exec(
        'pip',
        ['install', '--upgrade', `${infra.name}==${infra.version}`],
        options
      )
    }
    if (state !== 0) {
      throw new Error(
        `Error setting up ${infra.name} installation for version ${infra.version}`
      )
    }
    await infra.setVersion()
    return state
  }
}

export async function runTests(
  testInfraName: string,
  testInfraVersion: string,
  force: boolean,
  additionalArgs: string
): Promise<number> {
  switch (testInfraName.toLowerCase()) {
    case 'tox': {
      const infra = getToxInfra(testInfraVersion, force, additionalArgs)
      await installTestInfra(infra)
      await infra.setVersion()
      return await infra.runTests()
    }
    default: {
      throw new Error(
        `Invalid Test Infra with Name ${testInfraName} and version ${testInfraVersion}`
      )
    }
  }
}
