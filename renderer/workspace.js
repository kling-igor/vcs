const { remote } = window.require('electron')
import React from 'react'
import os from 'os'
import { Input, QuickPick, InputUnique } from './src/components/quickpick'
import { observable } from 'mobx'
// STUB
export class Workspace {
  @observable.ref customModalView = null

  constructor({ project, applicationDelegate }) {
    this.applicationDelegate = applicationDelegate
    this.project = project
  }

  showContextMenu({ title, items }) {
    const contextMenu = new remote.Menu()
    if (title) {
      contextMenu.append(new remote.MenuItem({ label: title, enabled: false }))
      contextMenu.append(new remote.MenuItem({ type: 'separator' }))
    }

    const menuItems = Array.isArray(items) ? items : items()

    // type = 'normal',
    menuItems.forEach(({ type, label, enabled, click, submenu }) => {
      contextMenu.append(
        new remote.MenuItem({
          type,
          label,
          click,
          submenu,
          enabled: enabled != null ? enabled : true
        })
      )
    })

    contextMenu.popup()
  }

  showModalView(view) {
    this.customModalView = view
  }

  hideModalView() {
    this.customModalView = null
  }

  /**
   * Shows input box
   * @param {Object} params
   * @param {String} [placeHolder]
   * @param {Function} [validateInput] - a validation function (String) => Boolean (true if valid)
   * @returns {Promise} promise resolved with input value or undefined if canceled
   */
  showInputBox({ placeHolder, defaultValue, validateInput, onInputChange, password }) {
    return new Promise(resolve => {
      const onSelect = value => {
        this.hideModalView()

        if (!value && defaultValue) {
          resolve(defaultValue)
        } else {
          resolve(value)
        }
      }

      this.showModalView(
        <Input
          placeHolder={placeHolder}
          validateInput={validateInput}
          onInputChange={onInputChange}
          onSelect={onSelect}
          password={password}
        />
      )
    })
  }

  /**
   * Shows input box with suggestion of existent values - user should input unique value to succeed
   * @param {Object} params
   * @param {Object[]} [items=[]] - array of {label:String, detail:String?, icon:String?}
   * @param {String} [placeHolder]
   * @param {Function} [validateInput] - a validation function (String) => Boolean (true if valid)
   * @returns {Promise} promise resolved with input value or undefined if canceled
   */
  showInputUnique({ items = [], placeHolder, validateInput }) {
    return new Promise(resolve => {
      const onSelect = value => {
        this.hideModalView()
        resolve(value)
      }
      this.showModalView(
        <InputUnique items={items} placeHolder={placeHolder} validateInput={validateInput} onSelect={onSelect} />
      )
    })
  }

  /**
   * Shows input box with list of existent values - user should select one of them
   * @param {Object} params
   * @param {Object[]} [items=[]] - array of {label:String, detail:String?, icon:String?}
   * @param {String} [placeHolder]
   * @param {String} noResultsText - a message to be shown then no items in list match quiery
   * @returns {Promise} promise resolved with input value or undefined if canceled
   */
  showQuickPick({ items = [], placeHolder, noResultsText = 'No results...' }) {
    return new Promise(resolve => {
      const onSelect = value => {
        this.hideModalView()
        resolve(value)
      }

      this.showModalView(
        <QuickPick items={items} placeHolder={placeHolder} noResultsText={noResultsText} onSelect={onSelect} />
      )
    })
  }

  openProject = async projectPath => {
    if (!projectPath) {
      projectPath = await this.showOpenFolderMenu()
    }

    if (!projectPath || projectPath === this.project.projectPath) return

    if (this.project.projectPath) {
      // закрываем существующий проект
      try {
        await this.closeProject()
      } catch (e) {
        console.log('WORKSPACE::OPENPROJECT CLOSE EXISTENT PROJECT ERROR', e)
      }
    }

    await this.project.open({ projectPath })
  }

  closeProject = async () => {
    await this.applicationDelegate.closeProject()
    await this.project.close()
  }

  async showOpenFolderMenu({ buttonLabel = 'Open Folder' }) {
    const openOptions = {
      properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
      defaultPath: os.homedir(),
      buttonLabel
    }

    this.closable = false
    const selectedPath = await new Promise(resolve => {
      remote.dialog.showOpenDialog(null, openOptions, resolve)
    })
    this.closable = true

    if (Array.isArray(selectedPath)) {
      return selectedPath[0]
    }
  }
}
