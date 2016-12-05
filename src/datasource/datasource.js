/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import { CONNECTION_ERROR_MESSAGES, MAX_SAMPLE_COUNT } from './services/netCrunchAPI/module';

const
  SERIES_TYPES_DISPLAY_NAMES = {
    min: 'Min',
    avg: 'Avg',
    max: 'Max',
    avail: 'Avail',
    delta: 'Delta',
    equal: 'Equal',
    distr: 'Distr'
  };

class NetCrunchDatasource {

  /** @ngInject */
  constructor(instanceSettings, netCrunchAPIService, alertSrv, $rootScope) {
    const
      self = this;
    let
      nodesReady,
      atlasReady,
      datasourceInitialization = null;

    function initNodesUpdating(networkAtlas, fromCache) {

      function prepareNodeList(netAtlas) {
        return netAtlas.getOrderedNodes()
          .then(nodes => netAtlas.addNodesMap(nodes));
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

      $rootScope.$on(`netcrunch-nodes-data-changed(${self.name})`, updateNodes);
    }

    function initAtlasUpdating(networkAtlas, fromCache) {

      if ((fromCache === true) && (networkAtlas.networksReceived === true)) {
        atlasReady(networkAtlas);
      }

      $rootScope.$on(`netcrunch-networks-data-changed(${self.name})`, () => atlasReady(networkAtlas));
    }

    function initDatasource() {
      let netCrunchSession;

      return new Promise((resolve, reject) => {
        if (self.url != null) {
          netCrunchSession = self.netCrunchAPI.getConnection(self);
          netCrunchSession
            .then((connection) => {
              const fromCache = connection.fromCache;
              self.netCrunchConnection = connection;
              initNodesUpdating(connection.networkAtlas, fromCache);
              initAtlasUpdating(connection.networkAtlas, fromCache);
              resolve();
            })
            .catch((error) => {
              self.alertSrv.set(self.name, CONNECTION_ERROR_MESSAGES[error], 'error');
              /* eslint-disable no-console */
              console.log('');
              console.log('NetCrunch datasource');
              console.log(`${self.name}: ${CONNECTION_ERROR_MESSAGES[error]}`);
              /* eslint-enable no-console */
              reject();
            });
        } else {
          reject();
        }
      });
    }

    this.name = instanceSettings.name;
    this.url = instanceSettings.url;
    this.serverUrl = instanceSettings.jsonData.simpleUrl;
    this.username = instanceSettings.jsonData.user;
    this.password = instanceSettings.jsonData.password;
    this.MAX_SAMPLE_COUNT = MAX_SAMPLE_COUNT;

    this.netCrunchAPI = netCrunchAPIService;
    this.alertSrv = alertSrv;
    this.nodes = new Promise((resolve) => {
      nodesReady = resolve;
    });
    this.networkAtlas = new Promise((resolve) => {
      atlasReady = resolve;
    });

    this.datasourceReady = () => {
      if (datasourceInitialization == null) {
        datasourceInitialization = initDatasource();
      }
      return datasourceInitialization;
    };
  }

  testDatasource() {
    return new Promise((resolve) => {
      this.netCrunchAPI.testConnection(this)
        .then(() => {
          resolve({
            status: 'success',
            message: 'Datasource is working',
            title: 'Success' });
        })
        .catch((error) => {
          resolve({
            status: 'error',
            message: CONNECTION_ERROR_MESSAGES[error],
            title: 'Error' });
        });
    });
  }

  query(options) {
    const self = this;

    function validateCounterData(target) {
      const
        countersAPI = self.netCrunchConnection.counters,
        nodeName = self.getNodeById(target.nodeID).then((nodeData) => {
          const result = (nodeData != null) ? nodeData.values.Name : null;
          return result;
        }),
        counterDisplayName = self.getCounters(target.nodeID).then((counterList) => {
          const counterData = countersAPI.findCounterByName(counterList, target.counterName);
          return (counterData != null) ? counterData.displayName : null;
        });

      return Promise.all([nodeName, counterDisplayName])
        .then((counterData) => {
          const
            nodeName = counterData[0],              // eslint-disable-line
            counterDisplayName = counterData[1];    // eslint-disable-line

          if ((nodeName != null) && (counterDisplayName != null)) {
            return {
              nodeName,
              counterDisplayName
            };
          }

          return null;
        });
    }

    function seriesTypesSelected(series) {
      return Object.keys(series).some(seriesKey => series[seriesKey] === true);
    }

    function prepareSeriesName(target, counterData) {
      let seriesName = `${counterData.nodeName} - ${counterData.counterDisplayName}`;

      if (target.datasource != null) {
        seriesName = `${self.name} - ${seriesName}`;
      }
      seriesName = target.alias || seriesName;

      return seriesName;
    }

    function extendSeriesName(baseSeriesName, seriesType) {
      return `${baseSeriesName}\\${SERIES_TYPES_DISPLAY_NAMES[seriesType]}`;
    }

    function prepareSeriesDataQuery(target, range, series) {
      const trendsAPI = self.netCrunchConnection.trends;

      if (seriesTypesSelected(series) === false) {
        return Promise.resolve([]);
      }

      return trendsAPI.getCounterTrendData(target.nodeID, target.counterName, range.from, range.to,
                                           range.periodType, range.periodInterval, series)
        .then((dataPoints) => {                                         // eslint-disable-line
          return Object.keys(dataPoints.values).map((seriesType) => {   // eslint-disable-line
            return {
              seriesType,
              dataPoints: {
                domain: dataPoints.domain,
                values: dataPoints.values[seriesType]
              }
            };
          });
        });
    }

    function prepareTargetQuery(target, range, series) {
      let targetDataQuery = null;

      if ((target.hide !== true) && (target.counterDataComplete === true)) {

        targetDataQuery = validateCounterData(target)
          .then((counterData) => {
            let
              query = null,
              seriesName,
              seriesDataQuery,
              seriesTypes;

            if (counterData != null) {
              seriesName = prepareSeriesName(target, counterData);
              query = [Promise.resolve(seriesName)];
              seriesTypes = (series == null) ? Object.create(null) : series;
              seriesTypes = NetCrunchDatasource.validateSeriesTypes(seriesTypes);
              seriesDataQuery = prepareSeriesDataQuery(target, range, seriesTypes);
              query.push(seriesDataQuery);
              query = Promise.all(query);
            }

            return query;
          });
      }

      return targetDataQuery;
    }

    function prepareQueries(targets, range, rawData) {
      const result = [];
      targets.forEach((target) => {
        const
          series = (rawData === true) ? { avg: true } : target.series,
          targetDataQuery = prepareTargetQuery(target, range, series);

        if (targetDataQuery != null) {
          result.push(targetDataQuery);
        }
      });
      return result;
    }

    function prepareChartData(targetsChartData, rawData) {
      const
        counterSeries = Object.create(null),
        trendsAPI = self.netCrunchConnection.trends;

      counterSeries.data = [];

      if ((targetsChartData != null) && (targetsChartData.length > 0)) {
        targetsChartData.forEach((target) => {
          const
            baseSeriesName = (target != null) ? target[0] : null,
            targetSeries = (target != null) ? target[1] : null,
            extendedSeriesNames = !rawData;
          let seriesName;

          if (target != null) {
            targetSeries.forEach((series) => {
              if (extendedSeriesNames === true) {
                seriesName = extendSeriesName(baseSeriesName, series.seriesType);
              } else {
                seriesName = baseSeriesName;
              }
              counterSeries.data.push({
                target: seriesName,
                datapoints: trendsAPI.grafanaDataConverter(series.dataPoints)
              });
            });
          }
        });
      }

      return counterSeries;
    }

    function performQuery(queryOptions) {

      const
        RAW_TIME_RANGE_EXCEEDED_WARNING_TITLE = 'Time range is too long.',
        RAW_TIME_RANGE_EXCEEDED_WARNING_TEXT = 'Maximum allowed length of time range for RAW data is ',
        trends = self.netCrunchConnection.trends,
        targets = queryOptions.targets || [],
        globalOptions = queryOptions.scopedVars || {},
        rawData = (globalOptions.rawData == null) ? false : globalOptions.rawData,
        setMaxDataPoints = (globalOptions.setMaxDataPoints == null) ? false : globalOptions.setMaxDataPoints,
        maxDataPoints = globalOptions.maxDataPoints,
        rangeFrom = queryOptions.range.from.startOf('minute'),
        rangeTo = queryOptions.range.to.startOf('minute');

      let
        range,
        dataQueries = [];

      range = trends.prepareTimeRange(rangeFrom, rangeTo, rawData, setMaxDataPoints ? maxDataPoints : null);

      if (range.error == null) {
        range = range.result;
        dataQueries = dataQueries.concat(prepareQueries(targets, range, rawData));
      } else {
        // eslint-disable-next-line
        const ERROR_MESSAGE = RAW_TIME_RANGE_EXCEEDED_WARNING_TEXT + ' ' + range.error.periodInterval + ' ' +
                              range.error.periodName + '.';
        self.alertSrv.set(RAW_TIME_RANGE_EXCEEDED_WARNING_TITLE, ERROR_MESSAGE, 'warning');
      }

      return Promise.all(dataQueries)
        .then(targetsChartData => prepareChartData(targetsChartData, rawData));
    }

    try {
      return this.datasourceReady()
        .then(() => performQuery(options));
    } catch (error) {
      return Promise.reject(error);
    }
  }

  getNodeById(nodeID) {
    return this.datasourceReady()
      .then(() => this.nodes.then(nodes => nodes.nodesMap.get(nodeID)));
  }

  getCounters(nodeId, fromCache = true) {
    return this.datasourceReady()
      .then(() => this.netCrunchConnection.counters.getCountersForMonitors(nodeId, fromCache));
  }

  static validateSeriesTypes(series) {
    const
      types = ['min', 'avg', 'max', 'avail', 'delta', 'equal', 'distr'],
      buffer = series;

    types.forEach((type) => {
      buffer[type] = (buffer[type] == null) ? false : buffer[type];
    });
    return buffer;
  }

}

export {
  NetCrunchDatasource
};
