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

describe.only('discard changes spec', () => {
  it.only('', async () => {
    await remove(REPO_DIR)
    await mkdirp(REPO_DIR)
    const repo = await nodegit.Repository.init(REPO_DIR, 0)

    let index = await repo.refreshIndex()

    await writeFile(path.resolve(repo.workdir(), FILENAME), 'HELLO WORLD')
    await index.addByPath(FILENAME)
    await index.write()

    const [fileStatus1] = await repo.getStatusExt()

    console.log('AFTER ADD STATUS:', fileStatus1.path(), fileStatus1.status())

    expect(deepEql(fileStatus1.status(), ['INDEX_NEW'])).to.be.true

    await index.removeByPath(FILENAME)
    await index.write()

    const [fileStatus2] = await repo.getStatusExt()

    console.log('AFTER REMOVE STATUS:', fileStatus2.path(), fileStatus2.status())

    expect(true).to.be.true
  })
})
