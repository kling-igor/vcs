import nodegit from 'nodegit'

// TODO: нужно предоставлять выбор ветки которую нужно тянуть
// делать это через контекстное меню веток

export async function pull(repo, remoteName, username, password) {
  console.log('FETCHING...')
  try {
    await repo.fetch(remoteName, {
      downloadTags: 1,
      prune: 1,
      updateFetchhead: 1,
      fetchOpts: {
        callbacks: {
          // github will fail cert check on some OSX machines, this overrides that check
          certificateCheck: () => 0,
          // credentials: username && password ? () => nodegit.Cred.userpassPlaintextNew(username, password) : null
          credentials: (url, userName) => {
            console.log('REMOTE URL:', url)
            return nodegit.Cred.sshKeyFromAgent(userName)
          },
          transferProgress: progress => console.log('pull progress:', progress)
        }
      }
    })

    try {
      console.log('MERGING BRANCHES...')
      // это может быть и самый последний коммит если все ОК
      const oidOrIndexWithConflicts = await repo.mergeBranches('master', 'origin/master')
      console.log('MERGED COMMIT:', oidOrIndexWithConflicts.toString())
    } catch (e) {
      console.log('MERGE ERROR:', e)
    }
  } catch (e) {
    console.log('FETCH ERROR:', 3)
  }
}
