import nodegit from 'nodegit'

export async function merge(repo, theirCommitSha) {
  const theirAnnotatedCommit = await nodegit.AnnotatedCommit.lookup(repo, theirCommitSha)
  nodegit.Merge.merge(repo, theirAnnotatedCommit)
}
