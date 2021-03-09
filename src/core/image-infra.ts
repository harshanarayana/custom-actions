import * as core from '@actions/core'
import {getDockerInfra} from '../image-infra/docker'

export async function runImageBuilder(): Promise<void> {
    const name = core.getInput('image-infra-tool')
    switch (name.toLowerCase()) {
        case 'docker': {
            const infra = getDockerInfra()
            await infra.setVersion()
            await infra.buildImage()
            await infra.pushImage()
            return Promise.resolve(undefined)
        }
        default: {
            throw new Error(`Image build infra with name ${name} is not supported`)
        }
    }
}
