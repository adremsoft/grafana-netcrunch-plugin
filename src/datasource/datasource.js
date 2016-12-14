/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import { CONNECTION_ERROR_MESSAGES, MAX_SAMPLE_COUNT } from './services/netCrunchAPI/module';
import { NetCrunchMetricFindQuery } from './metricFindQuery';

const
  PRIVATE_PROPERTIES = {
    netCrunchAPI: Symbol('netCrunchAPI'),
    netCrunchConnection: Symbol('netCrunchConnection'),
    atlas: Symbol('atlas'),
    nodes: Symbol('nodes'),
    processedNodes: Symbol('processedNodes'),
    alertSrv: Symbol('alertSrv')
  },
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
      self = this,
      nodesBuffer = {};
    let
      atlasReady,
      nodesReady,
      processedNodesReady,
      datasourceInitialization = null;

    function initNodesUpdating(networkAtlas, fromCache) {

      function updateNodes() {
        networkAtlas.atlas().then((atlas) => {
          nodesReady(atlas.nodes);
          nodesBuffer.operations = atlas.nodes.operations;
          nodesBuffer.operations
            .asyncSortByNameAndAddress(atlas.nodes.getAllNodes())
              .then((sorted) => {
                nodesBuffer.all = sorted;
                processedNodesReady(nodesBuffer);
              });
        });
      }

      if (fromCache) {
        updateNodes();
      }

      $rootScope.$on(`netcrunch-nodes-data-changed(${self.name})`, updateNodes);
    }

    function initAtlasUpdating(networkAtlas, fromCache) {

      function initAtlas() {
        networkAtlas.atlas()
          .then(atlas => atlasReady(atlas));
      }

      if (fromCache) {
        initAtlas();
      }

      $rootScope.$on(`netcrunch-networks-data-changed(${self.name})`, initAtlas);
    }

    function initDatasource() {
      return new Promise((resolve, reject) => {
        let netCrunchSession;

        if (self.url != null) {
          netCrunchSession = self[PRIVATE_PROPERTIES.netCrunchAPI].getConnection(self);
          netCrunchSession
            .then((connection) => {
              const fromCache = connection.fromCache;
              self[PRIVATE_PROPERTIES.netCrunchConnection] = connection;
              initNodesUpdating(connection.networkAtlas, fromCache);
              initAtlasUpdating(connection.networkAtlas, fromCache);
              resolve();
            })
            .catch((error) => {
              self[PRIVATE_PROPERTIES.alertSrv].set(self.name, CONNECTION_ERROR_MESSAGES[error], 'error');
              /* eslint-disable no-console */
              console.log('');
              console.log('NetCrunch datasource');
              console.log(`${self.name}: ${CONNECTION_ERROR_MESSAGES[error]}`);
              /* eslint-enable no-console */
              reject(CONNECTION_ERROR_MESSAGES[error]);
            });
        } else {
          reject('');
        }
      });
    }

    this[PRIVATE_PROPERTIES.netCrunchAPI] = netCrunchAPIService;
    this[PRIVATE_PROPERTIES.atlas] = new Promise(resolve => (atlasReady = resolve));
    this[PRIVATE_PROPERTIES.nodes] = new Promise(resolve => (nodesReady = resolve));
    this[PRIVATE_PROPERTIES.processedNodes] = new Promise(resolve => (processedNodesReady = resolve));
    this[PRIVATE_PROPERTIES.alertSrv] = alertSrv;

    this.name = instanceSettings.name;
    this.url = instanceSettings.url;
    this.serverUrl = instanceSettings.jsonData.simpleUrl;
    this.username = instanceSettings.jsonData.user;
    this.password = instanceSettings.jsonData.password;
    this.MAX_SAMPLE_COUNT = MAX_SAMPLE_COUNT;

    this.datasourceReady = () => {
      if (datasourceInitialization == null) {
        datasourceInitialization = initDatasource();
      }
      return datasourceInitialization;
    };

  }

  testDatasource() {
    return new Promise((resolve) => {
      this[PRIVATE_PROPERTIES.netCrunchAPI].testConnection(this)
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
        countersAPI = self[PRIVATE_PROPERTIES.netCrunchConnection].counters,
        nodeName = self.getNodeById(target.nodeID).then((nodeData) => {
          const result = (nodeData != null) ? nodeData.name : null;
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
      const trendsAPI = self[PRIVATE_PROPERTIES.netCrunchConnection].trends;

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
        trendsAPI = self[PRIVATE_PROPERTIES.netCrunchConnection].trends;

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
        trends = self[PRIVATE_PROPERTIES.netCrunchConnection].trends,
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
        self[PRIVATE_PROPERTIES.alertSrv].set(RAW_TIME_RANGE_EXCEEDED_WARNING_TITLE, ERROR_MESSAGE, 'warning');
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

  metricFindQuery(query) {
    return this.datasourceReady()
      .then(() => {

        if (query == null) {
          return Promise.resolve([]);
        }

        return new NetCrunchMetricFindQuery(this, query).process();

      });
  }

  atlas() {
    return this.datasourceReady()
      .then(() => this[PRIVATE_PROPERTIES.atlas]);
  }

  nodes() {
    return this.datasourceReady()
      .then(() => this[PRIVATE_PROPERTIES.processedNodes]);
  }

  getNodeById(nodeID) {
    return this.datasourceReady()
      .then(() => this[PRIVATE_PROPERTIES.nodes])
      .then(nodes => nodes.getNodeById(nodeID));
  }

  getCounters(nodeId, fromCache = true) {
    return this.datasourceReady()
      .then(() => this[PRIVATE_PROPERTIES.netCrunchConnection].counters.getCountersForMonitors(nodeId, fromCache));
  }

  static validateSeriesTypes(series) {
    const
      types = ['min', 'avg', 'max', 'avail', 'delta', 'equal', 'distr'],
      buffer = series || Object.create(null);

    types.forEach((type) => {
      buffer[type] = (buffer[type] == null) ? false : buffer[type];
    });
    return buffer;
  }

}

export {
  NetCrunchDatasource
};
