import nodegit from 'nodegit'

/**
 * @returns {Config}
 */
export async function findConfig() {
  let configPath

  try {
    configPath = await nodegit.Config.findGlobal()
  } catch (e) {
    console.log(e)
  }

  try {
    configPath = await nodegit.Config.findProgramdata()
  } catch (e) {
    console.log(e)
  }

  try {
    configPath = await nodegit.Config.findSystem()
  } catch (e) {
    console.log(e)
  }

  try {
    configPath = await nodegit.Config.findXdg()
  } catch (e) {
    console.log(e)
  }

  if (configPath) {
    return await nodegit.Config.openOndisk(configPath)
  }

  return null
}

/**
 *
 * @param {Repository} repo
 * @returns {Config}
 */
export async function openRepoConfig(repo) {
  return await repo.config()
}

/**
 *
 * @param {Config} config
 * @returns {name:String, email:String}
 */
export async function getUserNameEmail(config) {
  const name = await config.getString('user.name')
  const email = await config.getString('user.email')

  return { name, email }
}
