/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import {NetCrunchCounters, NETCRUNCH_COUNTER_CONST} from '../adrem/module';

function NetCrunchCountersData(adremClient, netCrunchServerConnection) {

  let ncCounters = new NetCrunchCounters(adremClient, netCrunchServerConnection),
      counterConsts = NETCRUNCH_COUNTER_CONST,
      trendDB = null,
      trendDBReadyResolve,
      trendDBReadyReject,
      trendDBReady = new Promise((resolve, reject) => {
        trendDBReadyResolve = resolve;
        trendDBReadyReject = reject;
      }),
      monitorMgrInf = null,
      monitorMgrInfReadyResolve,
      monitorMgrInfReadyReject,
      monitorMgrInfReady = new Promise((resolve, reject) => {
        monitorMgrInfReadyResolve = resolve;
        monitorMgrInfReadyReject = reject;
      });

  return {
    prepareCountersForMonitors: function (counters) {
      let monitors = Object.create(null),
          counterPromises = [],
          self = this;

      function createCounterObject (counter) {
        return self.convertCounterPathToDisplay(counter[1])
          .then((displayName) => {
            return {
              name: counter[1],
              displayName: displayName
            };
          });
      }

      function compareCounters (counterA, counterB) {
        if (counterA.displayName < counterB.displayName) { return -1; }
        if (counterA.displayName > counterB.displayName) { return 1; }
        if (counterA.displayName === counterB.displayName) { return 0; }
      }

      function sortCounters (monitors){
        Object.keys(monitors).forEach((monitorId) => {
          monitors[monitorId].counters.sort(compareCounters);
        });
        return monitors;
      }

      function updateMonitorNames (monitors) {
        return self.getMonitors()
          .then((monitorsMap) => {
            Object.keys(monitors).forEach((monitorId) => {
              if (monitorsMap[monitorId] != null){
                monitors[monitorId].name = monitorsMap[monitorId].counterGroup;
              }
            });
          return monitors;
        });
      }

      counters.forEach((counter) => {
        if (monitors[counter[0]] == null) {
          monitors[counter[0]] = Object.create(null);
          monitors[counter[0]].counters = [];
        }

        monitors[counter[0]].counters.push(createCounterObject(counter));
      });

      Object.keys(monitors).forEach((monitorId) => {
        counterPromises.push(
          Promise.all(monitors[monitorId].counters)
            .then((counters) => {
              monitors[monitorId].counters = counters;
            })
        );
      });

      return Promise.all(counterPromises)
        .then(() => {
          monitors = sortCounters(monitors);
          return updateMonitorNames(monitors);
        });
    },

    getCounters: function (nodeId) {

      if (trendDB == null) {
        trendDB = new adremClient.NetCrunch.TrendDB('ncSrv', '', (status) => {
          (status === true) ? trendDBReadyResolve() : trendDBReadyReject();
        }, netCrunchServerConnection);
      }

      return trendDBReady
        .then(() => {
          return new Promise((resolve) => {
            trendDB.getCounters({machineId: nodeId}, (counters) => {

              // counters are in form [ "<monitorId>=<counter>", ... ]

              counters = counters.map((counter) => {
                return counter.split('=');
              });
              resolve(counters);
            });
          });
      });
    },

    convertCounterPathToDisplay: function (counterPath) {
      let parsedCounterPath = ncCounters.parseCounterPath(counterPath),
          counterPathObject;

      if (ncCounters.isMIBCnt(parsedCounterPath.obj, parsedCounterPath.cnt) === true) {
        counterPathObject = ncCounters.counterPathObject(counterPath, counterConsts.CNT_TYPE.cstMIB);
        return ncCounters.counterPathToDisplayStr(counterPathObject, true, true);
      } else {
        return ncCounters.counterPathToDisplayStr(counterPath, true, true);
      }
    },

    getMonitors: function () {

      if (monitorMgrInf == null) {
        monitorMgrInf = new adremClient.NetCrunch.MonitorMgrIntf('ncSrv', (status) => {
          (status === true) ? monitorMgrInfReadyResolve() : monitorMgrInfReadyReject();
        }, netCrunchServerConnection);
      }

      return monitorMgrInfReady
        .then(() => {
          return new Promise((resolve) => {
            monitorMgrInf.getMonitorsInfo({}, (monitors) => {
              let monitorsMap = Object.create(null);

              monitors.forEach((monitor) => {
                monitorsMap[monitor.monitorId] = monitor;
              });
              resolve(monitorsMap);
            });
          });
        });
    }
  };
}

export {
  NetCrunchCountersData as NetCrunchCountersData
}
