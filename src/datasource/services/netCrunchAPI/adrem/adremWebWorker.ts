/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

class AdremWebWorker {

  constructor(workerUrl) {
    let tasks = new Map(),
        webWorker;

    function getTaskId() {
      let taskId = (new Date()).getTime();
      while (tasks.has(taskId)) {
        taskId += 1;
      }
      return taskId;
    }

    webWorker = new Worker(workerUrl);
    webWorker.onmessage = function(event) {
      let taskId = event.data.taskId;
      if (tasks.has(taskId)) {
        let resolve = tasks.get(taskId);
        tasks.delete(taskId);
        resolve(event.data.result);
      }
    };

    this.executeTask = function(taskData) {
      let taskId = getTaskId();
      taskData.taskId = taskId;
      return new Promise((resolve) => {
        tasks.set(taskId, resolve);
        webWorker.postMessage(taskData);
      });
    };

  }

  addTask(taskSpec) {
    this[taskSpec.name] = function(...args) {
      let task = {
        funcName: taskSpec.name,
        args: args,
        async: taskSpec.async
      };

      if (taskSpec.async === true) {
        let self = this;
        return new Promise((resolve, reject) => {
          self.executeTask(task)
            .then((result) => {
              if (result.type === 'resolve') {
                resolve(result.result);
              }
              if (result.type === 'reject') {
                reject(result.error);
              }
            });
        });
      }

      return this.executeTask(task);
    };
  }

  static webWorkerBuilder() {
    let workerCode = [],
        taskInterfaces = [];

    function getCodeBlob() {

      function getTaskDispatchingSetup() {
        return `this.onmessage = ${getAdremTaskDispatcher.name}().bind(this);\n\n`;
      }

      function getAdremTaskDispatcher() {
        let globalScope = this;

        function postResult(taskId, result) {
          globalScope.postMessage({
            taskId: taskId,
            result: result
          });
        }

        function executeSyncFunc(taskId, funcName, args) {
          postResult(taskId, globalScope[funcName].apply(globalScope, args));
        }

        function executeAsyncFunc(taskId, funcName, args) {
          globalScope[funcName].apply(globalScope, args)
            .then((result) => postResult(taskId, {
              type: 'resolve',
              result: result
            }))
            .catch((error) => postResult(taskId, {
              type: 'reject',
              error: error
            }));
        }

        function taskDispatcher(event) {
          event = event.data;
          if (event.async !== true) {
            executeSyncFunc(event.taskId, event.funcName, event.args);
          } else {
            executeAsyncFunc(event.taskId, event.funcName, event.args);
          }
        }

        return taskDispatcher;
      }

      let bundledCode;
      bundledCode = getTaskDispatchingSetup();
      bundledCode += getAdremTaskDispatcher.toString() + '\n';
      bundledCode += workerCode.reduce((prev, curr) => prev + '\n' + curr, '');
      return new Blob([bundledCode], {type: 'application/javascript'});
    }

    function getBlobURL() {
      return URL.createObjectURL(getCodeBlob());
    }

    function addFunctionCode(code, createInterface = false, async = false) {
      if (typeof code === 'function') {
        workerCode.push(code.toString());
        if ((createInterface === true) && (code.name != null) && (code.name !== '')) {
          taskInterfaces.push({
            name: code.name,
            async: async
          });
        }
        return true;
      }
      return false;
    }

    function getWebWorker() {
      let webWorker = new AdremWebWorker(getBlobURL());
      taskInterfaces.forEach((taskSpec) => {
        webWorker.addTask(taskSpec);
      });
      return webWorker;
    }

    return {
      addFunctionCode: addFunctionCode,
      getWebWorker: getWebWorker
    };
  }

}

export {
  AdremWebWorker as AdremWebWorker
}
