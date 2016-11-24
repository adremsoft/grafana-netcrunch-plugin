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
        taskProcessed = null;
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

}

export {
  AdremWebWorker as AdremWebWorker
}
