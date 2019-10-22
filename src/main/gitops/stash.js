import nodegit from 'nodegit'

export async function getStashes(repo) {
  const stashes = []

  await nodegit.Stash.foreach(repo, (index, message, oid) => {
    stashes.push({ index, message, oid })
  })

  return stashes
}

export async function saveStash(repo, message, keepStagedChanges) {
  console.log('saveStash', message, keepStagedChanges)
  try {
    const flags = keepStagedChanges ? nodegit.Stash.FLAGS.KEEP_INDEX : nodegit.Stash.FLAGS.DEFAULT
    const signature = await repo.defaultSignature()
    const oid = await nodegit.Stash.save(repo, signature, message, flags)
    console.log('STASH RESULT', oid.toString())
  } catch (e) {
    console.log('STASH ERROR:', e)
  }
}

export async function applyStash(repo, index, dropAfter) {
  try {
    if (dropAfter) {
      await nodegit.Stash.pop(repo, +index)
    } else {
      await nodegit.Stash.apply(repo, +index)
    }
    // 0 - success
    // GIT_ENOTFOUND
    // -24 = GIT_EMERGECONFLICT
  } catch (e) {
    if (/conflicts? prevents? checkout/.test(e.message)) {
      throw new Error('Merge conflict')
    }
  }
}

export async function dropStash(repo, index) {
  try {
    await nodegit.Stash.drop(repo, +index)
  } catch (e) {
    console.log(e)
  }
}
