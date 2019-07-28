import uuidv4 from 'uuid/v4'
import { Disposable } from 'event-kit'
module.exports = (ipc, BrowserWindow) => ({
  /**
   * @param {BrowserWindow} window - BrowserWindow instance
   * @param {String} channel
   * @param {Any} args
   * @returns {Promise} - resolved by {Any}
   */
  callRenderer: (window, channel, ...args) => {
    if (!window.webContents) {
      return Promise.reject(new Error('no window webContents'))
    }

    return new Promise((resolve, reject) => {
      const uuid = uuidv4()
      ipc.once(uuid, (event, ...resultArgs) => {
        ipc.removeAllListeners(`error-${uuid}`)
        resolve(...resultArgs)
      })

      ipc.once(`error-${uuid}`, (event, error) => {
        ipc.removeAllListeners(uuid)
        reject(error)
      })

      window.webContents.send(channel, uuid, ...args)
    })
  },

  /**
   * @param {String} channel
   * @param {Function} callback
   * @returns {Disposable}
   */
  answerRenderer: (channel, callback) => {
    const handler = async (event, uuid, ...args) => {
      const window = BrowserWindow.fromWebContents(event.sender)

      if (!(window && window.isDestroyed())) {
        try {
          event.sender.send(uuid, await callback(window, ...args))
        } catch (error) {
          event.sender.send(`error-${uuid}`, error)
        }
      }
    }

    ipc.on(channel, handler)

    return new Disposable(() => ipc.removeListener(channel, handler))
  }
})
