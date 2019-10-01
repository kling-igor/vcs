import nodegit from 'nodegit'

export async function merge(repo, theirCommitSha) {
  const fullSHA = (await nodegit.Commit.lookupPrefix(repo, nodegit.Oid.fromString(theirCommitSha), 8)).sha()
  const theirAnnotatedCommit = await nodegit.AnnotatedCommit.lookup(repo, fullSHA)
  nodegit.Merge.merge(repo, theirAnnotatedCommit)
}

export async function mergeBranches(repo, ourBranchName, theirBranchName) {
  await repo.mergeBranches(ourBranchName, theirBranchName)
}
