import * as core from '@actions/core'
import {CommentManagerInfra} from '../types/types'
import {readEventData} from '../utils/generic'

class RebaseInfra implements CommentManagerInfra {
    commentPatternToConsider: string

    constructor(commentPatternToConsider: string) {
        this.commentPatternToConsider = commentPatternToConsider
    }

    async handleComment(): Promise<boolean> {
        const data = await readEventData()
        core.info(`Event Data ${data}`)
        return Promise.resolve(false)
    }

    async isValidCommentHandler(): Promise<boolean> {
        return Promise.resolve(true)
    }
}

export function getBranchRebaseInfra(): RebaseInfra {
    const pattern = core.getInput('comment-rebase-pattern') || '.*\\@bot\\s+\\/rebase.*'
    return new RebaseInfra(pattern)
}
