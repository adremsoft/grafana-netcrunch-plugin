/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

class AdremWebWorker {

  constructor(workerUrl) {
    let taskQueue = [],
        currentTask,
        webWorker;

    function processTask() {
      if ((taskQueue.length > 0) && (currentTask == null)) {
        currentTask = taskQueue.shift();
        webWorker.postMessage(currentTask.data);
      }
    }

    webWorker = new Worker(workerUrl);
    webWorker.onmessage = function(event) {
      if (currentTask != null) {
        currentTask.resolve(event.data.result);
        currentTask = null;
        processTask();
      }
    };

    this.executeTask = function(taskData) {
      return new Promise((resolve) => {
        taskQueue.push({resolve: resolve, data: taskData});
        processTask();
      });
    };

  }

  addTask(taskSpec) {
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
