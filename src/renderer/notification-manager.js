import { Intent, Position, Toaster } from '@blueprintjs/core'

export class NotificationManager {
  // ключи показанных сообщений
  notifications = []

  constructor() {
    this.toaster = Toaster.create({
      position: Position.TOP_RIGHT
    })
  }

  addSuccess(message, options) {
    return this.addNotification({ intent: Intent.SUCCESS, message, options, icon: 'tick-circle' })
  }

  addInfo(message, options) {
    return this.addNotification({ intent: Intent.PRIMARY, message, options, icon: 'info-sign' })
  }

  addWarning(message, options) {
    return this.addNotification({ intent: Intent.WARNING, message, options, icon: 'warning-sign' })
  }

  addError(message, options = { timeout: 0 }) {
    return this.addNotification({ intent: Intent.DANGER, message, options, icon: 'error' })
  }

  addFatal(message, options = { timeout: 0 }) {
    return this.addNotification({ intent: Intent.DANGER, message, options, icon: 'hand' })
  }

  /**
   *
   * @param {Intent} intent
   * @param {String} message
   * @param {Object} options
   * @returns {String} unique key of the toast
   */
  addNotification({ intent = Intent.NONE, message, options = {}, icon }) {
    const { timeout = 3000 } = options

    let key

    const onDismiss = () => {
      this.notifications = this.notifications.filter(item => item !== key)
    }

    key = this.toaster.show({ message, intent, onDismiss, timeout, icon })
    this.notifications.push(key)
    return key
  }

  clear() {
    this.toaster.clear()
    this.notifications = []
  }

  dismiss(key) {
    this.toaster.dismiss(key)
    this.notifications = this.notifications.filter(item => item !== key)
  }
}
