import { createGlobalStyle } from 'styled-components'

export default createGlobalStyle`
  @font-face {
    font-family: "Roboto";
    src: url("./assets/Roboto-Regular.ttf");
    font-display: block;
  }

  @font-face {
    font-family: "Roboto";
    src: url("./assets/Roboto-Bold.ttf");
    font-weight: bold;
    font-display: block;
  }

  html {
    height: 100%;
    margin: 0;
  }

  body {
    padding: 0;
    margin: 0;
    font-family: Roboto, sans-serif;
    overflow: hidden;
    height: 100%;
    overflow: hidden !important;
    background-color: ${({
      theme: {
        editor: { background }
      }
    }) => background};
  }

  #app {
    min-height: 100%;
    position: fixed;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
  }

  .List {
    width: 100%;
  }

  .ReactVirtualized__List:focus{
    outline: none;
  }

  .quickOpenInput {
    margin: 4px;
  }

  .menu-item {
    font-size: 13px;
    /* font-weight: 500; */
    line-height: 1em;
  }

  .bp3-control.vision {
    margin-bottom: 4px;
  }

  ul.bp3-menu::-webkit-scrollbar {
    width: 10px;
  }
  /* Track */
  ul.bp3-menu::-webkit-scrollbar-track {
    background: ${({ theme }) => 'darkgray'};
  }
  /* Handle */
  ul.bp3-menu::-webkit-scrollbar-thumb {
    background: ${({ theme }) => '#888'};
  }
  /* Handle on hover */
  ul.bp3-menu::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => '#555'};
  }

  .popover {
    background-color: transparent;/*#ebf1f5*/
  }

  .bp3-popover-content {
    position: relative;
    top: 4px;
  }

  .bp3-button-text {
    user-select: none;
  }

  .bp3-button-icon {
    user-select: none;
  }

  .bp3-dialog {
    border-radius: 2px;
    width: auto;
    height: auto;
    top: 0;
    margin: 0;
    padding: 0;
    /* margin-top: 24px; */
  }

  .bp3-dialog-body {
    margin: 0;
  }

  .dialog-input {
    width: 100%;
  }

  div > .bp3-menu {
    max-height: 300px;
    overflow-y: auto;
    min-width: 500px;
    max-width: 500px;
    margin-left: -4;
  }

  .bp3-dialog-container {
    align-items: flex-start;
    justify-content: center;
  }

  /*иначе погруженные в tooltip формы скукоживаются*/
  span.bp3-popover-target {
    display: block;
  }

  .bp3-input {
    width: calc(100% - 8px);
    padding-right: 0px;
  }

  .bp3-input-group {
    padding-right: 8px;
  }
`
