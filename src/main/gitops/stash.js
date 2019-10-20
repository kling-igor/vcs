import nodegit from 'nodegit'

export async function getStashes(repo) {
  const stashes = []

  await nodegit.Stash.foreach(repo, (index, message, oid) => {
    stashes.push({ index, message, oid })
  })

  return stashes
}

export async function saveStash(repo, message, keepStaged) {
  console.log('saveStash', message, keepStaged)
  try {
    const flags = keepStaged ? nodegit.Stash.FLAGS.KEEP_INDEX : nodegit.Stash.FLAGS.DEFAULT
    const signature = await repo.defaultSignature()
    const oid = await nodegit.Stash.save(repo, signature, message, flags)
    console.log('STASH RESULT', oid.toString())
  } catch (e) {
    console.log('STASH ERROR:', e)
  }
}

export async function applyStash(repo, index) {
  let result = -1
  try {
    result = await nodegit.Stash.apply(repo, +index)
    // 0 - success
    // GIT_ENOTFOUND
    // GIT_EMERGECONFLICT
    console.log('APPLY RESULT:', result)
  } catch (e) {
    console.log(e)
  }
  return result
}

export async function dropStash(repo, index) {
  try {
    await nodegit.Stash.drop(repo, +index)
  } catch (e) {
    console.log(e)
  }
}
