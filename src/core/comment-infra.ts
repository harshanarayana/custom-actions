import {getBranchRebaseInfra} from '../comment-infra/rebase'

export async function runCommentInfra(): Promise<void> {
    const rebaseInfra = getBranchRebaseInfra()
    if (await rebaseInfra.isValidCommentHandler()) {
        await rebaseInfra.handleComment()
    }
}
