/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

/* eslint-disable func-names, object-shorthand, prefer-template */

import { NetCrunchNetworkAtlas } from './networkAtlas';

function NetCrunchNetworkData(adremClient, netCrunchServerConnection) {

  const
    networkAtlas = new NetCrunchNetworkAtlas(netCrunchServerConnection),
    nodesReady = {},
    networksReady = {};

  let remoteDataInitialized = null;

  nodesReady.promise = new Promise(resolve => (nodesReady.resolve = resolve));
  networksReady.promise = new Promise(resolve => (networksReady.resolve = resolve));

  function openRemoteData(table, query, processFunction, notifyFunction) {
    const
      dataList = new adremClient.RemoteDataListStore('ncSrv', 1000, netCrunchServerConnection),
      self = this;

    return new Promise((resolve) => {
      if (typeof processFunction === 'function') {
        dataList.on('record-changed', (data) => {
          if ((dataList.data != null) && (dataList.data.length > 0)) {
            data.forEach(processFunction, self);
          }
        });
      }

      if (typeof notifyFunction === 'function') {
        dataList.on('changed', () => {
          notifyFunction();
        });
      }

      dataList.open(table, query, () => {
        resolve();
      });
    });
  }

  function processHostsData(nodeRec) {
    networkAtlas.addNode(nodeRec);
  }

  function processMapData(mapRec) {
    networkAtlas.addMap(mapRec);
  }

  return {
    nodes: nodesReady.promise,
    networks: networksReady.promise,
    atlas: Promise
      .all([nodesReady.promise, networksReady.promise])
      .then(() => networkAtlas),

    init: function() {
      const
        PERFORMANCE_VIEWS_NET_INT_ID = 2,
        MONITORING_PACKS_NET_INT_ID = 3,
        HOSTS_QUERY = 'Select Id, Name, Address, DeviceType, GlobalDataNode ',
        NETWORKS_QUERY = 'Select NetIntId, DisplayName, HostMapData, IconId, ' +
                         'MapType, NetworkData, MapClassTag ' +
                         'where (MapClassTag != \'policynet\') && (MapClassTag != \'pnet\') && ' +
                         '(MapClassTag != \'dependencynet\') && ' +
                         '(MapClassTag != \'issuesnet\') && (MapClassTag != \'all\') && ' +
                         '(NetIntId != ' + PERFORMANCE_VIEWS_NET_INT_ID + ') && ' +
                         '(NetIntId != ' + MONITORING_PACKS_NET_INT_ID + ')',
        self = this;

      let
        hostsData,
        networkData;

      function hostsChanged() {
        nodesReady.resolve(networkAtlas.nodes);
        if (typeof self.onNodesChanged === 'function') {
          self.onNodesChanged();
        }
      }

      function networksChanged() {
        networksReady.resolve(networkAtlas.atlas);

        if (typeof self.onNetworksChanged === 'function') {
          self.onNetworksChanged();
        }
      }

      if (remoteDataInitialized != null) {
        return remoteDataInitialized;
      }

      // eslint-disable-next-line
      hostsData = openRemoteData('Hosts', HOSTS_QUERY, processHostsData, hostsChanged);

      // eslint-disable-next-line
      networkData = openRemoteData('Networks', NETWORKS_QUERY, processMapData, networksChanged);

      remoteDataInitialized = Promise.all([hostsData, networkData]);

      return remoteDataInitialized;
    }

  };

}

export {
  NetCrunchNetworkData
};
