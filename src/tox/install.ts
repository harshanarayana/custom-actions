import * as exec from '@actions/exec'
import {ExecOptions} from '@actions/exec/lib/interfaces'
import * as core from '@actions/core'

export async function installTox(version: string): Promise<number> {
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
  if (version.startsWith('latest')) {
    state = await exec.exec('pip', ['install', '--upgrade', 'tox'], options)
  } else {
    state = await exec.exec(
      'pip',
      ['install', '--upgrade', `tox==${version}`],
      options
    )
  }
  if (state !== 0) {
    throw new Error(`Error setting up tox installation for version ${version}`)
  }
  return state
}
