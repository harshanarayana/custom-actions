import * as core from '@actions/core'
import * as github from '@actions/github'
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
        const myToken = core.getInput('git-access-token')
        const octokit = github.getOctokit(myToken)
        await octokit.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
            owner: 'harshanarayana',
            repo: 'custom-actions',
            workflow_id: 'spellcheck.yml',
            ref: process.env.GITHUB_REF || 'ref'
        })
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
