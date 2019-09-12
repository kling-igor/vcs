import nodegit from 'nodegit'

export async function merge(repo, theirCommitSha) {
  const theirAnnotatedCommit = await nodegit.AnnotatedCommit.lookup(repo, theirCommitSha)
  nodegit.Merge.merge(repo, theirAnnotatedCommit)
}

export async function mergeBranches(repo, ourBranchName, theirBranchName) {
  await repo.mergeBranches(ourBranchName, theirBranchName)
}
