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

const FILENAME = './file.txt'

describe('discard changes spec', () => {
  it.only('', async () => {
    await remove(REPO_DIR)
    await mkdirp(REPO_DIR)
    const repo = await nodegit.Repository.init(REPO_DIR, 0)

    let index = await repo.refreshIndex()

    await writeFile(path.resolve(repo.workdir(), FILENAME), 'HELLO WORLD')
    await index.addByPath(FILENAME)
    await index.write()
    // может в этом проблема ?
    // let treeOid = await index.writeTree()

    const [file] = await repo.getStatusExt()

    console.log('STATUS:', file.path(), file.status())

    await index.removeByPath(path)

    expect(true).eq(true)
  })
})
