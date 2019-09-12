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
  it('should make rebase', async () => {
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
    // rebasing
    const rebase = await nodegit.Rebase.init(repo, ourAnnotatedCommit, theirAnnotatedCommit, null)

    console.log('rebase operations:', rebase.operationEntrycount())

    const rebaseOperation = await rebase.next()

    expect(rebaseOperation.type()).to.be.equal(nodegit.RebaseOperation.REBASE_OPERATION.PICK)

    const index1 = await repo.refreshIndex()

    expect(index1.hasConflicts()).to.be.true

    // resolve using ours
    await writeFile(filePath, OURS_FILE_CONTENT)
    await index1.addByPath(FILENAME)
    await index1.write()
    await index1.writeTree()

    const index2 = await repo.refreshIndex()
    expect(index2.hasConflicts()).to.be.false

    await rebase.commit(null, signature)

    console.log('rebase operations:', rebase.operationEntrycount())

    await rebase.finish(ourSignature, {})

    expect(true).to.be.true
  })

  after('it should completley remove repo', async () => {
    // index.clear();
    // await remove(REPO_DIR)
  })
})
