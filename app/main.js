"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _electron = require("electron");

var _path = require("path");

var URL = _interopRequireWildcard(require("url"));

var _nodegit = _interopRequireDefault(require("nodegit"));

var repo;
var revWalk;

_electron.app.on('ready',
/*#__PURE__*/
(0, _asyncToGenerator2["default"])(
/*#__PURE__*/
_regenerator["default"].mark(function _callee() {
  var window, commit;
  return _regenerator["default"].wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          window = new _electron.BrowserWindow({
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
          _context.prev = 4;
          _context.next = 7;
          return _nodegit["default"].Repository.open((0, _path.resolve)(__dirname, '..', '.git'));

        case 7:
          repo = _context.sent;
          _context.prev = 8;
          _context.next = 11;
          return repo.getHeadCommit();

        case 11:
          commit = _context.sent;
          revWalk = repo.createRevWalk();
          revWalk.sorting(_nodegit["default"].Revwalk.SORT.TOPOLOGICAL);
          revWalk.push(commit.sha());
          _context.next = 20;
          break;

        case 17:
          _context.prev = 17;
          _context.t0 = _context["catch"](8);
          console.log('unable to get head commit');

        case 20:
          _context.next = 25;
          break;

        case 22:
          _context.prev = 22;
          _context.t1 = _context["catch"](4);
          console.log('unable to open repo:', _context.t1);

        case 25:
        case "end":
          return _context.stop();
      }
    }
  }, _callee, null, [[4, 22], [8, 17]]);
})));

_electron.app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    _electron.app.quit();
  }
});

var walk =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee2(limit, result) {
    var oid, commit;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            _context2.next = 3;
            return revWalk.next();

          case 3:
            oid = _context2.sent;

            if (!oid) {
              _context2.next = 18;
              break;
            }

            _context2.next = 7;
            return repo.getCommit(oid);

          case 7:
            commit = _context2.sent;
            // console.log(`['${commit.toString()}',`, commit.parents().map(parent => parent.toString()), '],')
            // console.log('COMMIT:', commit)
            console.log('commit:', commit.toString());
            console.log('message:', commit.message());
            console.log('author:', commit.author().name());
            console.log('date:', commit.date());
            console.log('parents:', commit.parents().map(function (parent) {
              return parent.toString();
            }));
            console.log('-----------------------------------------\n');
            result.push(commit);

            if (!(commit.parents().length > 0 && limit > 0)) {
              _context2.next = 18;
              break;
            }

            _context2.next = 18;
            return walk(limit - 1, result);

          case 18:
            _context2.next = 23;
            break;

          case 20:
            _context2.prev = 20;
            _context2.t0 = _context2["catch"](0);
            console.log(_context2.t0);

          case 23:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[0, 20]]);
  }));

  return function walk(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

_electron.ipcMain.on('gitlog', function (event, limit) {
  console.log('gitlog:', limit);
  var result = [];
  walk(limit, result);
  console.log('RESULT:', result);
  event.reply('gitlog', result);
});