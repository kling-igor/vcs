const A = { sha: 'A', parents: [] }
const B = { sha: 'B', parents: [A] }
const C = { sha: 'C', parents: [A] }
const D = { sha: 'D', parents: [B, C] }
const E = { sha: 'E', parents: [D] }

const COMMITS = [E, D, C, B, A]
let CURRENT_COMMIT = 0
const NEXT = () => {
  return COMMITS[CURRENT_COMMIT++]
}

const I = i => i

let branchIndex = 0
const reserve = []
const branches = {}

const getBranch = sha => {
  if (branches[sha] == null) {
    branches[sha] = branchIndex
    reserve.push(branchIndex)
    branchIndex += 1
  }

  return branches[sha]
}

const fillRoutes = (from, to, iterable) => iterable.map((branch, index) => [from(index), to(index), branch])

const commits = []

const workdirBranch = getBranch('B')
const workdirOffset = reserve.indexOf(workdirBranch)

commits.push({
  sha: null,
  branch: workdirBranch,
  offset: workdirOffset,
  routes: [...fillRoutes(I, I, reserve)]
})

const walk = () => {
  const commit = NEXT()

  const { sha, parents } = commit

  const [parent, otherParent] = parents.map(({ sha }) => sha)

  const branch = getBranch(sha)
  let offset = reserve.indexOf(branch)

  let routes = []

  if (parents.length === 1) {
    if (branches[parent] == null) {
      // straight
      routes = [...fillRoutes(I, I, reserve)]
      branches[parent] = branch
    } else {
      routes = [
        // все возможные ветки правее текущей загибаем влево
        ...fillRoutes(i => i + offset + 1, i => i + offset + 1 - 1, reserve.slice(offset + 1)),
        // все возможные ветки левее текущей продолжают идти параллельно
        ...fillRoutes(I, I, reserve.slice(0, offset))
      ]

      // удаляем текущую ветку из списка
      reserve.splice(offset, 1)

      // загибаем текущую ветку в сторону ее родителя
      routes = [...routes, [offset, reserve.indexOf(branches[parent]), branch]]
    }
  } else if (parents.length === 2) {
    if (branches[parent] == null) {
      branches[parent] = branch
    } else {
      const parentOffset = reserve.indexOf(branches[parent])
      if (parentOffset !== offset) {
        // загибаем
        routes = [...routes, [offset, parentOffset, branch]]
        reserve.splice(offset, 1)

        // значение offset далее невалидно, т.к. соответсвующее значение удалено из списка
        for (const i of Object.keys(branches)) {
          if (branches[i] >= offset) {
            branches[i] -= 1
          }
        }
      }
    }

    routes = [...routes, ...fillRoutes(I, I, reserve)]

    const otherBranch = getBranch(otherParent)
    routes = [...routes, [offset, reserve.indexOf(otherBranch), otherBranch]]
  }

  // удаляем ветку из кеша (на нее никто не ссылается больше)
  delete branches[sha]

  commits.push({
    sha,
    offset,
    branch,
    routes
  })

  if (parents.length === 0) {
    return commits
  }

  return walk()
}

const result = walk()
console.log(JSON.stringify(result, null, 2))
