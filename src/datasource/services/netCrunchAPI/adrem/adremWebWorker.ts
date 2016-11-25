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

  static webWorkerBuilder() {
    let workerCode = [],
        interfaceFunctions = [];

    function getCodeBlob() {

      function getAdremWebWorkerRuntime() {

        function postResult(result) {
          postMessage({
            result: result
          });
        }

        function executeSyncFunc(funcName, args) {
          postMessage(global[funcName].apply(this, args));
        }

        function executeAsyncFunc(funcName, args) {
          global[funcName].apply(this, args)
            .then((result) => postResult({
              type: 'resolve',
              result: result
            }))
            .catch((error) => postResult({
              type: 'reject',
              error: error
            }));
        }

        return {
          executeSyncFunc: executeSyncFunc,
          executeAsyncFunc: executeAsyncFunc
        };
      }

      let bundledCode;
      bundledCode = 'let global = this, \n adremWebWorkerRuntime = getAdremWebWorkerRuntime(); \n';
      bundledCode += getAdremWebWorkerRuntime.toString() + '\n';
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
          interfaceFunctions.push({
            name: code.name,
            async: async
          });
        }
        return true;
      }
      return false;
    }

    function getWebWorker() {
      return new AdremWebWorker(getBlobURL());
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
