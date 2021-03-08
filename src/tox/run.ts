import * as exec from '@actions/exec'
import {ExecOptions} from '@actions/exec/lib/interfaces'
import * as core from '@actions/core'
import * as glob from '@actions/glob'

type ToxValidateState = string

const NonToxRepo: ToxValidateState = 'NonToxRepo'
const InvalidToxEnv: ToxValidateState = 'InvalidToxEnv'
const ValidToxEnv: ToxValidateState = 'Valid'

async function setToxVerison(): Promise<number> {
  const options: ExecOptions = {
    silent: true,
    listeners: {
      stdout: (data: Buffer) => {
        core.setOutput('tox-version', data.toString().trim())
      },
      stderr: (data: Buffer) => {
        core.error(data.toString().trim())
      }
    }
  }
  return await exec.exec('tox', ['--version'], options)
}

async function validateToxEnv(toxEnv: string): Promise<ToxValidateState> {
  const g = await glob.create(
    ['**/tox.ini', '**/pyproject.toml', '**/setup.cfg'].join('\n'),
    {followSymbolicLinks: false}
  )
  const files = await g.glob()
  if (files.length < 1) {
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
    return line === toxEnv
  })
  if (filteredData.length > 0) {
    return ValidToxEnv
  } else {
    return InvalidToxEnv
  }
}

export async function runTox(toxEnv: string): Promise<number> {
  const valid = await validateToxEnv(toxEnv)
  if (valid === InvalidToxEnv) {
    throw new Error(`Invalid Tox Environment`)
  }
  if (valid === NonToxRepo) {
    core.info(
      'Running Tox Action on a Non tox infra is of no use. Skipping the Tox Run'
    )
    return 0
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

  const state = await exec.exec('tox', ['-e', toxEnv], options)
  if (state !== 0) {
    throw new Error(
      `Tox Environment ${toxEnv} run completed with an exit code ${state}`
    )
  }
  await setToxVerison()
  return state
}
