// https://github.com/nodegit/nodegit/blob/f2fea6a61d89169acfb1040bcc72c1e410a393b0/test/tests/rebase.js

const assert = require('assert')
const chai = require('chai')
const expect = chai.expect
const should = chai.should()
const deepEql = require('deep-eql')
const path = require('path')
const { mkdirp, remove, writeFile } = require('fs-extra')

// npm rebuild nodegit --update-binary
const nodegit = require('nodegit')

const REPO_DIR = '/tmp/repo'

const FILENAME = 'file.txt'

const signature = nodegit.Signature.now('John Dow', 'js@example.org')

const INITIAL_FILE_CONTENT = 'initial content\n'

const OURS_FILE_CONTENT = `${INITIAL_FILE_CONTENT}\n
AAAA\n
`

const THEIRS_FILE_CONTENT = `${INITIAL_FILE_CONTENT}\n
BBBB\n
`

describe('nodegit spec', () => {
  it.only('should make rebase', async () => {
    await remove(REPO_DIR)
    await mkdirp(REPO_DIR)

    const repo = await nodegit.Repository.init(REPO_DIR, 0)

    const index = await repo.refreshIndex()

    const filePath = path.join(repo.workdir(), FILENAME)

    // создаем первый коммит
    await writeFile(filePath, INITIAL_FILE_CONTENT)
    await index.addByPath(FILENAME)
    await index.write()
    const treeOid = await index.writeTree()

    const initialCommitOid = await repo.createCommit('HEAD', signature, signature, 'initial', treeOid, [])

    console.log('initial commit SHA:', initialCommitOid.toString())

    const ourBranchName = (await repo.head()).name()
    console.log('OUR BRANCH NAME:', ourBranchName)

    // создаем следующий
    await writeFile(filePath, OURS_FILE_CONTENT)
    await index.addByPath(FILENAME)
    await index.write()
    const treeOid1 = await index.writeTree()
    const ourBranchRef = await repo.head()
    const oursCommitOid = await repo.createCommit(ourBranchRef.name(), signature, signature, 'ours', treeOid1, [
      initialCommitOid
    ])

    console.log('OURS commit SHA:', oursCommitOid.toString())

    // checkout to initial commit
    const initialCommit = await repo.getCommit(initialCommitOid)
    await nodegit.Checkout.tree(repo, initialCommit, {
      checkoutStrategy: nodegit.Checkout.STRATEGY.FORCE
    })
    repo.setHeadDetached(initialCommit)

    // create new branch
    const branchRef = await repo.createBranch('other', initialCommit, 0 /* do not overwrite if exists */)

    const theirBranchName = (await repo.head()).name()
    console.log('THEIR BRANCH NAME:', ourBranchName)

    await writeFile(filePath, THEIRS_FILE_CONTENT)
    await index.addByPath(FILENAME)
    await index.write()
    const treeOid2 = await index.writeTree()
    const theirsCommitOid = await repo.createCommit(branchRef.name(), signature, signature, 'theirs', treeOid2, [
      initialCommitOid
    ])

    console.log('THEIRS commit SHA:', theirsCommitOid.toString())

    const oursBranchRef = await repo.getReference(ourBranchName)
    const theirBranchRef = await repo.getReference(theirBranchName)

    const ourAnnotatedCommit = nodegit.AnnotatedCommit.fromRef(repo, oursBranchRef)
    const theirAnnotatedCommit = nodegit.AnnotatedCommit.fromRef(repo, theirBranchRef)

    await repo.checkoutBranch(oursBranchRef, {
      checkoutStrategy: nodegit.Checkout.STRATEGY.FORCE
    })

    console.log('REBASING...')

    try {
      const commitOidOrIndex = await repo.rebaseBranches(ourBranchName, theirBranchName, null, signature, null)
      console.log('commitOidOrIndex:', commitOidOrIndex.toString())
      if (commitOidOrIndex.hasConflicts && commitOidOrIndex.hasConflicts()) {
        console.log('HAS CONFLICTS')
      }
    } catch (e) {
      console.log('E:', e)
    }

    // // rebasing
    // const rebase = await nodegit.Rebase.init(repo, ourAnnotatedCommit, theirAnnotatedCommit, null)

    // console.log('rebase operations:', rebase.operationEntrycount())

    // const rebaseOperation = await rebase.next()

    // expect(rebaseOperation.type()).to.be.equal(nodegit.RebaseOperation.REBASE_OPERATION.PICK)

    // const index1 = await repo.refreshIndex()

    // expect(index1.hasConflicts()).to.be.true

    // // resolve using ours
    // await writeFile(filePath, OURS_FILE_CONTENT)
    // await index1.addByPath(FILENAME)
    // await index1.write()
    // await index1.writeTree()

    // const index2 = await repo.refreshIndex()
    // expect(index2.hasConflicts()).to.be.false

    // await rebase.commit(null, signature)

    // console.log('rebase operations:', rebase.operationEntrycount())

    // await rebase.finish(ourSignature, {})

    expect(true).to.be.true
  })

  it('can rebase 2 branches with conflicts on a single file', async () => {
    const ourBranchName = 'ours'
    const theirBranchName = 'theirs'

    const fileName = 'everyonesFile.txt'

    const baseFileContent = 'How do you feel about Toll Roads?\n'
    const ourFileContent = 'I like Toll Roads. I have an EZ-Pass!\n'
    const theirFileContent = "I'm skeptical about Toll Roads\n"

    const expectedConflictedFileContent =
      'How do you feel about Toll Roads?\n' +
      '<<<<<<< theirs\n' +
      "I'm skeptical about Toll Roads\n" +
      '=======\n' +
      'I like Toll Roads. I have an EZ-Pass!\n' +
      '>>>>>>> we made a commit\n'

    const conflictSolvedFileContent =
      'How do you feel about Toll Roads?\n' +
      "He's skeptical about Toll Roads,\n" +
      'but I like Toll Roads. I have an EZ-Pass!\n'

    const ourSignature = nodegit.Signature.create('Ron Paul', 'RonPaul@TollRoadsRBest.info', 123456789, 60)
    const theirSignature = nodegit.Signature.create('Greg Abbott', 'Gregggg@IllTollYourFace.us', 123456789, 60)

    await remove(REPO_DIR)
    await mkdirp(REPO_DIR)

    const repo = await nodegit.Repository.init(REPO_DIR, 0)

    let index = await repo.refreshIndex()

    await writeFile(path.join(repo.workdir(), fileName), baseFileContent)
    await index.addByPath(fileName)
    await index.write()
    let treeOid = await index.writeTree()
    let commitOid = await repo.createCommit('HEAD', ourSignature, ourSignature, 'initial commit', treeOid, [])
    const ourCommit = await repo.getCommit(commitOid)

    const ourBranch = await repo.createBranch(ourBranchName, commitOid)

    const theirBranch = await repo.createBranch(theirBranchName, commitOid)

    await writeFile(path.join(repo.workdir(), fileName), baseFileContent + theirFileContent)
    await index.addByPath(fileName)
    await index.write()
    treeOid = await index.writeTree()
    commitOid = await repo.createCommit(
      theirBranch.name(),
      theirSignature,
      theirSignature,
      'they made a commit',
      treeOid,
      [ourCommit]
    )

    await writeFile(path.join(repo.workdir(), fileName), baseFileContent + ourFileContent)
    await index.addByPath(fileName)
    await index.write()
    treeOid = await index.writeTree()

    commitOid = await repo.createCommit(ourBranch.name(), ourSignature, ourSignature, 'we made a commit', treeOid, [
      ourCommit
    ])

    await nodegit.Checkout.head(repo, {
      checkoutStrategy: nodegit.Checkout.STRATEGY.FORCE
    })

    const ourRef = await repo.getReference(ourBranchName)
    const theirRef = await repo.getReference(theirBranchName)

    const ourAnnotatedCommit = nodegit.AnnotatedCommit.fromRef(repo, ourRef)
    const theirAnnotatedCommit = nodegit.AnnotatedCommit.fromRef(repo, theirRef)

    console.log('BEFORE REBASE', ourRef.shorthand(), theirRef.shorthand())

    // const rebaseOptions = new nodegit.RebaseOptions()
    // rebaseOptions.checkoutOptions = {}
    // const rebase = await nodegit.Rebase.init(repo, ourAnnotatedCommit, theirAnnotatedCommit, rebaseOptions)

    // index = await repo.refreshIndex()
    // await index.removeByPath(fileName)
    // await index.write()
    // treeOid = await index.writeTree()

    try {
      const commitOidOrIndex = await repo.rebaseBranches(ourBranchName, theirBranchName, null, ourSignature)
    } catch (e) {
      console.log('E:', e)
    }

    console.log('BINGO')

    // // there should only be 1 rebase operation to perform
    // assert.equal(rebase.operationEntrycount(), 1)

    // const rebaseOperation = await rebase.next()

    // assert.equal(rebaseOperation.type(), nodegit.RebaseOperation.REBASE_OPERATION.PICK)

    // index = await repo.refreshIndex()

    // assert.ok(index.hasConflicts())

    // await writeFile(path.join(repo.workdir(), fileName), conflictSolvedFileContent)

    // await index.addByPath(fileName)
    // await index.write()
    // treeOid = await index.writeTree()

    // index = await repo.refreshIndex()
    // assert.ok(!index.hasConflicts())

    // commitOid = await rebase.commit(null, ourSignature)

    // // // тут можно прервать
    // // await rebase.abort();
    // // const existingRebase = await nodegit.Rebase.open(repo)
    // // existingRebase === undefined

    // const result = await rebase.finish(ourSignature)

    // assert.equal(result, 0)
  })

  after('it should completley remove repo', async () => {
    // index.clear();
    // await remove(REPO_DIR)
  })
})
