import uuidv4 from 'uuid/v4'
import { Disposable } from 'event-kit'

export default ipc => ({
  /**
   * @param {String} channel
   * @param {Any} args
   * @returns {Promise} - resolved by {Any}
   */
  callMain: (channel, ...args) => {
    const uuid = uuidv4()
    return new Promise((resolve, reject) => {
      const errorChannel = `error-${uuid}`
      ipc.once(uuid, (event, ...resultArgs) => {
        ipc.removeAllListeners(errorChannel)
        resolve(...resultArgs)
      })

      ipc.once(errorChannel, (event, error) => {
        ipc.removeAllListeners(uuid)
        reject(error)
      })

      ipc.send(channel, uuid, ...args)
    })
  },

  /**
   * @param {String} channel
   * @param {Function} callback
   * @returns {Disposable}
   */
  answerMain: (channel, callback) => {
    const handler = async (event, uuid, ...args) => {
      try {
        ipc.send(uuid, await callback(...args))
      } catch (error) {
        ipc.send(`error-${uuid}`, error)
      }
    }

    ipc.on(channel, handler)

    return new Disposable(() => ipc.removeListener(channel, handler))
  }
})
