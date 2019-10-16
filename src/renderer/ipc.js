const { ipcRenderer } = window.require('electron')
import uuidv4 from 'uuid/v4'
import { Disposable } from 'event-kit'

/**
 * @param {String} channel
 * @param {Any} args
 * @returns {Promise} - resolved by {Any}
 */
export const callMain = (channel, ...args) => {
  const uuid = uuidv4()

  // console.log('CALL:', channel)

  return new Promise((resolve, reject) => {
    const errorChannel = `${channel}-error-${uuid}`

    ipcRenderer.once(uuid, (event, ...resultArgs) => {
      ipcRenderer.removeAllListeners(errorChannel)
      resolve(...resultArgs)
    })

    ipcRenderer.once(errorChannel, (event, errorMessage) => {
      ipcRenderer.removeAllListeners(uuid)
      console.log('ERROR:', errorChannel, errorMessage)
      reject(new Error(errorMessage))
    })

    ipcRenderer.send(channel, uuid, ...args)
  })
}

/**
 * @param {String} channel
 * @param {Function} callback
 * @returns {Disposable}
 */
export const answerMain = (channel, callback) => {
  const handler = async (event, uuid, ...args) => {
    try {
      ipcRenderer.send(uuid, await callback(...args))
    } catch (error) {
      ipcRenderer.send(`${channel}-error-${uuid}`, error)
    }
  }

  ipcRenderer.on(channel, handler)

  return new Disposable(() => ipcRenderer.removeListener(channel, handler))
}

// export default ipc => ({
//   callMain: (channel, ...args) => {
//     const uuid = uuidv4()
//     return new Promise((resolve, reject) => {
//       const errorChannel = `${channel}-error-${uuid}`
//       ipc.once(uuid, (event, ...resultArgs) => {
//         ipc.removeAllListeners(errorChannel)
//         resolve(...resultArgs)
//       })

//       ipc.once(errorChannel, (event, error) => {
//         ipc.removeAllListeners(uuid)
//         reject(error)
//       })

//       ipc.send(channel, uuid, ...args)
//     })
//   },

//   answerMain: (channel, callback) => {
//     const handler = async (event, uuid, ...args) => {
//       try {
//         ipc.send(uuid, await callback(...args))
//       } catch (error) {
//         ipc.send(`${channel}-error-${uuid}`, error)
//       }
//     }

//     ipc.on(channel, handler)

//     return new Disposable(() => ipc.removeListener(channel, handler))
//   }
// })
