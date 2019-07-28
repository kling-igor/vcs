"use strict";

var _electron = require("electron");

var _path = require("path");

var URL = _interopRequireWildcard(require("url"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

_electron.app.on('ready', function () {
  var window = new _electron.BrowserWindow({
    x: 0,
    y: 0,
    width: 1024,
    height: 768,
    backgroundColor: '#fff',
    show: false,
    // icon: process.platform === 'linux' && join(__dirname, 'icons', 'icons', '64x64.png'),
    webPreferences: {
      nodeIntegration: true
    }
  });
  window.loadURL(URL.format({
    pathname: (0, _path.join)(__dirname, 'index.html'),
    protocol: 'file',
    slashes: true // hash

  }));
  window.once('ready-to-show', function () {
    window.webContents.openDevTools();
    window.show();
  });
  window.on('closed', function () {
    window.removeAllListeners();
  });
});

_electron.app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    _electron.app.quit();
  }
});