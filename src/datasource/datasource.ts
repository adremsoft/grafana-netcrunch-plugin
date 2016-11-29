/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import {CONNECTION_ERROR_MESSAGES} from './services/netCrunchAPI/module';

class NetCrunchDatasource {

  /** @ngInject */
  constructor(instanceSettings, netCrunchAPIService, alertSrv, $rootScope) {
    let
      self = this,
      nodesReady,
      atlasReady,
      datasourceInitialization = null;

    function initDatasource() {
      let netCrunchSession;

      return new Promise((resolve, reject) => {
        if (self.url != null) {
          netCrunchSession = self.netCrunchAPI.getConnection(self);
          netCrunchSession
            .then((connection) => {
              let fromCache = connection.fromCache;
              self.netCrunchConnection = connection;
              initNodesUpdating(connection.networkAtlas, fromCache);
              initAtlasUpdating(connection.networkAtlas, fromCache);
              resolve();
            })
            .catch((error) => {
              self.alertSrv.set(self.name, CONNECTION_ERROR_MESSAGES[error], 'error');
              console.log('');
              console.log('NetCrunch datasource');
              console.log(self.name + ': ' + CONNECTION_ERROR_MESSAGES[error]);
              reject();
            });
        } else {
          reject();
        }
      });
    }

    function initNodesUpdating( networkAtlas, fromCache) {

      function prepareNodeList(networkAtlas) {
        return networkAtlas.getOrderedNodes()
          .then(nodes => networkAtlas.addNodesMap(nodes));
      }

      function updateNodes() {
        prepareNodeList(networkAtlas)
          .then((preparedNodes) => {
            nodesReady(preparedNodes);
          });
      }

      if ((fromCache === true) && (networkAtlas.nodesReceived === true)) {
        updateNodes();
      }

      $rootScope.$on('netcrunch-nodes-data-changed(' + self.name + ')', updateNodes);
    }

    function initAtlasUpdating( networkAtlas, fromCache) {

      if ((fromCache === true) && (networkAtlas.networksReceived === true)) {
        atlasReady(networkAtlas);
      }

      $rootScope.$on('netcrunch-networks-data-changed(' + self.name + ')', function() {
        atlasReady(networkAtlas);
      });
    }

    this.name = instanceSettings.name;
    this.url = instanceSettings.url;
    this.serverUrl = instanceSettings.jsonData.simpleUrl;
    this.username = instanceSettings.jsonData.user;
    this.password = instanceSettings.jsonData.password;

    this.netCrunchAPI = netCrunchAPIService;
    this.alertSrv = alertSrv;
    this.nodes = new Promise((resolve) => {
      nodesReady = resolve;
    });
    this.networkAtlas = new Promise((resolve) => {
      atlasReady = resolve;
    });

    this.datasourceReady = function() {
      if (datasourceInitialization == null) {
        datasourceInitialization = initDatasource();
      }
      return datasourceInitialization;
    };

  }

  datasourceReady() {};

  testDatasource() {
    return new Promise((resolve) => {
      this.netCrunchAPI.testConnection(this)
        .then(() => {
          resolve({
            status: "success",
            message: "Datasource is working",
            title: "Success" });
        })
        .catch((error) => {
          resolve({
            status: "error",
            message: CONNECTION_ERROR_MESSAGES[error],
            title: "Error" });
        });
    });
  }

  query(options) {
    let self = this;

    function performQuery(options) {

      const RAW_TIME_RANGE_EXCEEDED_WARNING_TITLE = 'Time range is too long.',
            RAW_TIME_RANGE_EXCEEDED_WARNING_TEXT = 'Maximum allowed length of time range for RAW data is ';

      let trends = self.netCrunchConnection.trends,
          targets = options.targets || [],
          globalOptions = options.scopedVars || {},
          rawData = (globalOptions.rawData == null) ? false : globalOptions.rawData,
          setMaxDataPoints = (globalOptions.setMaxDataPoints == null) ? false : globalOptions.setMaxDataPoints,
          maxDataPoints = globalOptions.maxDataPoints,
          rangeFrom = options.range.from.startOf('minute'),
          rangeTo = options.range.to.startOf('minute'),
          range,
          dataQueries = [];

      range = trends.prepareTimeRange(rangeFrom, rangeTo, rawData, setMaxDataPoints ? maxDataPoints : null);

      if (range.error == null) {
        range = range.result;
//***
//***
      } else {
        const ERROR_MESSAGE = RAW_TIME_RANGE_EXCEEDED_WARNING_TEXT + ' ' + range.error.periodInterval + ' ' +
                              range.error.periodName + '.';
        self.alertSrv.set(RAW_TIME_RANGE_EXCEEDED_WARNING_TITLE, ERROR_MESSAGE, 'warning');
      }

      return Promise.all(dataQueries);
    }

    try {
      return this.datasourceReady()
        .then(() => performQuery(options));
    }

    catch(error) {
      return Promise.reject(error);
    }
  }

  getNodeById(nodeID) {
    return this.datasourceReady()
      .then(() => {
        return this.nodes.then(nodes => nodes.nodesMap.get(nodeID));
      });
  };

  getCounters(nodeId, fromCache = true) {
    return this.datasourceReady()
      .then(() => this.netCrunchConnection.counters.getCountersForMonitors(nodeId, fromCache));
  };

}

export {
  NetCrunchDatasource
};
