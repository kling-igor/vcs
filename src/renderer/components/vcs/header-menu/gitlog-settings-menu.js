import { action } from 'mobx'
export default ({ vcs, workspace }) => () => {
  const { showSHA, showDate, showAuthor, showAuthorType } = vcs

  console.log('showSHA:', showSHA)
  console.log('showDate:', showDate)
  console.log('showAuthor:', showAuthor)
  console.log('showAuthorType:', showAuthorType)

  const abbreviated = showAuthorType === 'ABBREVIATED'
  const fullName = showAuthorType === 'FULL_NAME'
  const fullNameWithEmail = showAuthorType === 'FULL_NAME_WITH_EMAIL'

  workspace.showContextMenu({
    items: [
      {
        label: 'Columns',
        submenu: [
          {
            label: 'SHA',
            click: action(() => {
              vcs.showSHA = !showSHA
            }),
            type: 'checkbox',
            checked: !!showSHA
          },
          {
            label: 'Date',
            click: action(() => {
              vcs.showDate = !showDate
            }),
            type: 'checkbox',
            checked: !!showDate
          },
          {
            label: 'Author',
            click: action(() => {
              vcs.showAuthor = !showAuthor
            }),
            type: 'checkbox',
            checked: !!showAuthor
          }
        ]
      },
      {
        type: 'separator'
      },
      {
        label: 'Author Abbreviated',
        enabled: !!showAuthor,
        submenu: [
          {
            label: 'Author Abbreviated',
            click: action(() => {
              vcs.showAuthorType = 'ABBREVIATED'
            }),
            type: 'radio',
            checked: !!abbreviated,
            enabled: !!showAuthor
          },
          {
            label: 'Author with Full Name',
            click: action(() => {
              vcs.showAuthorType = 'FULL_NAME'
            }),
            type: 'radio',
            checked: !!fullName,
            enabled: !!showAuthor
          },
          {
            label: 'Author with Full Name and Email',
            click: action(() => {
              vcs.showAuthorType = 'FULL_NAME_WITH_EMAIL'
            }),
            type: 'radio',
            checked: !!fullNameWithEmail,
            enabled: !!showAuthor
          }
        ]
      }
    ]
  })
}
