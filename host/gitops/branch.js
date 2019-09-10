import nodegit from 'nodegit'

import { resetToCommit } from './commit'

/**
 * Creates branch
 * @param {Repository} repo
 * @param {String} name
 * @param {String | Oid} commit
 * @returns {Reference}
 */
export async function createBranch(repo, name, commit) {
  return await repo.createBranch(name, commit, 0 /* do not overwrite if exists */)
}

export async function deleteBranch(repo, name) {
  const branchRef = await nodegit.Branch.lookup(repo, name, nodegit.Branch.BRANCH.LOCAL)
  nodegit.Branch.delete(branchRef)
}

export async function renameBranch(repo, name, newName) {
  const branchRef = await nodegit.Branch.lookup(repo, name, nodegit.Branch.BRANCH.LOCAL)
  nodegit.Branch.move(branchRef, newName, 0)
}

/**
 * Checkouts on specified branch head (optionally rejecting working directory changes)
 * @param {Repository} repo
 * @param {String} branch
 * @param {Boolean} discardLocalChanges
 * @see https://libgit2.org/docs/guides/101-samples/
 * @see https://github.com/libgit2/libgit2/blob/HEAD/include/git2/checkout.h#files
 */
export async function checkoutBranch(repo, branch, discardLocalChanges) {
  return repo.checkoutBranch(branch, {
    checkoutStrategy: discardLocalChanges ? nodegit.Checkout.STRATEGY.FORCE : nodegit.Checkout.STRATEGY.SAFE
  })
}

export async function checkoutRemoteBranch(repo, branchName, remoteName = 'origin') {
  await checkout(repo, branchName)
  const commit = await repo.getReferenceCommit(`refs/remotes/${remoteName}/${branchName}`)
  await resetToCommit(repo, commit)
}
