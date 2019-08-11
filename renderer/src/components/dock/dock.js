import React from 'react'
import { observable, action, computed } from 'mobx'
import { observer } from 'mobx-react'
import { Disposable } from 'event-kit'
import { DockView } from './dock-view'

export class Dock {
  @observable.ref _widget = null

  @observable.ref pages = {}

  @observable currentPage = null

  paneSizes = {}

  // для каждой страницы для каждого раздела страницы сохраняются размеры
  // paneSizes = {}

  constructor() {
    this._widget = observer(({ theme }) => (
      <DockView
        theme={theme}
        currentPage={this.currentPage}
        pages={this.pages}
        paneSizes={this.paneSizes}
        onPaneHeaderClick={this.onPaneHeaderClick}
        onResizeEnd={this.onResizeEnd}
      />
    ))
  }

  onResizeEnd = (pageId, sizes) => {
    this.paneSizes[pageId] = sizes
  }

  @action.bound
  onPaneHeaderClick(page, index) {
    const pages = { ...this.pages }
    pages[page].panes[index].elapsed = !pages[page].panes[index].elapsed
    this.pages = pages

    // удаляем ранее сохраненные размеры!!!
    this.paneSizes[page] = []
  }

  @action.bound
  showPage(pageId) {
    if (pageId in this.pages) {
      this.currentPage = pageId
    }
  }

  /**
   * adds page
   * @param {String} pageId
   * @param {Object} description
   * @returns {Disposable} - disposable to remove page
   */
  @action.bound
  addPage(pageId, description) {
    this.pages = { ...this.pages, [pageId]: description }
    return new Disposable(
      action(() => {
        delete this.pages[pageId]
        if (this.currentPage === pageId) {
          this.currentPage = null
        }
      })
    )
  }

  /**
   * removes page
   * @param {String} pageId
   * @deprecated
   */
  @action.bound
  removePage(pageId) {
    delete this.pages[pageId]
    if (this.currentPage === pageId) {
      this.currentPage = null
    }
  }

  /**
   * adds pane to page
   * @param {String} pageId
   * @param {Object} description
   * @returns {Disposable} - a disposable to remove pane
   */
  @action.bound
  addPane(pageId, description) {
    const page = this.pages[pageId]
    if (page) {
      this.paneSizes[pageId] = []
      page.panes = [...page.panes, description]
      this.pages = { ...this.pages }

      return new Disposable(
        action(() => {
          const page = this.pages[pageId]
          if (page) {
            page.panes = page.panes.filter(pane => pane !== description)
            this.pages = { ...this.pages }
          }
        })
      )
    }

    return new Disposable(() => {})
  }

  /**
   * inserts pane at specified place in panes list
   * @param {String} pageId
   * @param {Number} index
   * @param {Object} description
   * @returns {Disposable} - a disposable to remove pane
   */
  @action.bound
  insertPane(pageId, index, description) {
    const page = this.pages[pageId]
    if (page) {
      this.paneSizes[pageId] = []
      page.panes = [...page.panes.slice(0, index), description, ...page.panes.slice(index + 1)]
      this.pages = { ...this.pages }

      return new Disposable(
        action(() => {
          const page = this.pages[pageId]
          if (page) {
            page.panes = page.panes.filter(pane => pane !== description)
            this.pages = { ...this.pages }
          }
        })
      )
    }

    return new Disposable(() => {})
  }

  /**
   * replaces pane
   * @param {String} pageId
   * @param {Number} index
   * @param {Object} description
   * @returns {Disposable} - a disposable to remove pane
   */
  @action.bound
  replacePane(pageId, index, description) {
    const page = this.pages[pageId]
    if (page && page.panes[index]) {
      const { elapsed } = page.panes[index]
      page.panes = [...page.panes.slice(0, index), { ...description, elapsed }, ...page.panes.slice(index + 1)]
      this.pages = { ...this.pages }

      return new Disposable(
        action(() => {
          const page = this.pages[pageId]
          if (page) {
            page.panes = page.panes.filter(pane => pane !== description)
            this.pages = { ...this.pages }
          }
        })
      )
    }

    return new Disposable(() => {})
  }

  /**
   * removes panes at specified index
   * @param {String} pageId
   * @param {Number} index
   * @deprecated
   */
  @action.bound
  removePane(pageId, index) {
    const page = this.pages[pageId]
    if (page && page.panes.length > index) {
      this.paneSizes[pageId] = []
      page.panes = [...page.panes.slice(0, index), ...page.panes.slice(index + 1)]
      this.pages = { ...this.pages }
    }
  }

  pageButtons(pageId) {
    const page = this.pages[pageId]
    if (page) {
      return page.pageHeaderButtons
    }
  }

  setPageButtons(pageId, buttonDescriptions) {
    const page = this.pages[pageId]
    if (page) {
      page.pageHeaderButtons = buttonDescriptions
    }
  }

  paneButtons(pageId, index) {
    const page = this.pages[pageId]
    if (page && page.panes.length > index) {
      return page.panes[index].paneHeaderButtons
    }
  }

  setPaneButtons(pageId, index, buttonDescriptions) {
    const page = this.pages[pageId]
    if (page && page.panes.length > index) {
      page.panes[index].paneHeaderButtons = buttonDescriptions
    }
  }

  @computed get widget() {
    return this._widget
  }
}
