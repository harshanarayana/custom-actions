import * as core from '@actions/core'
import * as github from '@actions/github'
import {CommentManagerInfra} from '../types/types'
import {readEventData, getIssueNumber} from '../utils/generic'

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
        const checkInfo = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}/check-runs', {
            owner: 'harshanarayana',
            repo: 'custom-actions',
            ref: process.env.GITHUB_REF || 'ref'
        })
        await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
            owner: 'harshanarayana',
            repo: 'custom-actions',
            issue_number: await getIssueNumber(),
            body: 'Howdy Stranger!'
        })
        core.info(JSON.stringify(checkInfo))
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
