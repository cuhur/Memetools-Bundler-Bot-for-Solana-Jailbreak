'use strict';

var electron = require('electron');

var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var require_preload = __commonJS({
  "electron/src/preload.ts"(exports) {
    electron.contextBridge.exposeInMainWorld("balanceChecker", {
      checkMultipleBalances: (wallets) => __async(exports, null, function* () {
        return yield electron.ipcRenderer.invoke("balance:checkMultiple", wallets);
      }),
      setupConnection: (config) => __async(exports, null, function* () {
        return yield electron.ipcRenderer.invoke("balance:setupConnection", config);
      })
    });
    electron.contextBridge.exposeInMainWorld("taskManager", {
      startTask: (type, data) => __async(exports, null, function* () {
        return yield electron.ipcRenderer.invoke("task:start", { type, data });
      }),
      stopTask: (tokenMint, platform, type) => __async(exports, null, function* () {
        return yield electron.ipcRenderer.invoke("task:stop", { tokenMint, platform, type });
      }),
      getTaskStatus: (tokenMint, platform, type) => __async(exports, null, function* () {
        return yield electron.ipcRenderer.invoke("task:status", { tokenMint, platform, type });
      }),
      getAllRunningTasks: () => __async(exports, null, function* () {
        return yield electron.ipcRenderer.invoke("task:getAllRunning");
      }),
      onTaskUpdate: (callback) => {
        const subscription = (_, task) => callback(task);
        electron.ipcRenderer.on("task:update", subscription);
        return () => {
          electron.ipcRenderer.removeListener("task:update", subscription);
        };
      }
    });
    electron.contextBridge.exposeInMainWorld("electron", {
      ipcRenderer: {
        send: (channel, data) => electron.ipcRenderer.send(channel, data),
        on: (channel, listener) => {
          electron.ipcRenderer.on(channel, listener);
        },
        selectFile: () => __async(exports, null, function* () {
          return electron.ipcRenderer.invoke("select-file");
        })
      }
    });
  }
});
var preload = require_preload();

module.exports = preload;

module.exports = exports.default;
