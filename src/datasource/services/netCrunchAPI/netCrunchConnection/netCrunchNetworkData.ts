/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import NetCrunchAtlasTree from './netCrunchAtlasTree';

export default function NetCrunchNetworkData(adremClient, netCrunchServerConnection) {

  let atlasTree = new NetCrunchAtlasTree(netCrunchServerConnection),
      initialized = null;

  function openRemoteData(table, query, processFunction, notifyFunction) {
    let dataList = new adremClient.RemoteDataListStore('ncSrv', 1000, netCrunchServerConnection),
        self = this;

    return new Promise((resolve) => {
      if (typeof processFunction === 'function') {
        dataList.on('record-changed', function (data) {
          if ((dataList.data != null) && (dataList.data.length > 0)) {
            data.forEach(processFunction, self);
          }
        });
      }

      if (typeof notifyFunction === 'function') {
        dataList.on('changed', function () {
          notifyFunction();
        });
      }

      dataList.open(table, query, () => {
        resolve();
      });
    });
  }

  function processHostsData(data) {
    let host = Object.create(null);
    host.local = Object.create(null);
    host.values = data.getValues();
    atlasTree.addNode(host);
  }

  function processMapData(data) {
    let map = Object.create(null);
    map.local = data.local;
    map.values = data.getValues();
    atlasTree.addMapToIndex(decodeNetworkData(map));
  }

  function decodeNetworkData(record) {
    let mapsData;

    function addNodesToNetwork(network) {
      let nodeData,
          len, i;

      network.local.nodes = [];
      len = network.values.HostMapData[0];

      for (i = 1; i <= len; i++) {
        nodeData = network.values.HostMapData[i];
        if ((nodeData[0] === 0) || (nodeData[0] === 5)) {
          network.local.nodes.push(parseInt(nodeData[1], 10));
        }
      }
      return network;
    }

    record.local.parentId = parseInt(record.values.NetworkData[0], 10);
    if (isNaN(record.local.parentId) === true) {
      record.local.parentId = '';
    }

    record.local.isFolder = ((record.values.MapClassTag === 'dynfolder') || Array.isArray(record.values.NetworkData[1]));

    if (record.local.isFolder) {
      mapsData = record.values.NetworkData[1];
      if (Array.isArray(mapsData)) {                          // otherwise it can be empty object instead of empty array
        record.local.maps = mapsData.map(function (id) {
          return parseInt(id, 10);
        });
      }

      if (record.values.MapClassTag === 'fnet') {             //Add nodes into physical segments map
        addNodesToNetwork(record);
      }
    } else {
      addNodesToNetwork(record);
    }

    return record;
  }

  return {
    networkNodes: atlasTree.nodes,
    networkTree: atlasTree.tree,
    networksReceived: false,
    nodesReceived: false,

    init : function () {
      const PERFORMANCE_VIEWS_NET_INT_ID = 2,
            MONITORING_PACKS_NET_INT_ID = 3,
            HOSTS_QUERY = 'Select Id, Name, Address, DeviceType, GlobalDataNode ',
            NETWORKS_QUERY = 'Select NetIntId, DisplayName, HostMapData, IconId, ' +
                             'MapType, NetworkData, MapClassTag ' +
                             'where (MapClassTag != \'policynet\') && (MapClassTag != \'pnet\') && ' +
                             '(MapClassTag != \'dependencynet\') && ' +
                             '(MapClassTag != \'issuesnet\') && (MapClassTag != \'all\') && ' +
                             '(NetIntId != ' + PERFORMANCE_VIEWS_NET_INT_ID + ') && ' +
                             '(NetIntId != ' + MONITORING_PACKS_NET_INT_ID + ')';
      let self = this,
          hostsData,
          networkData;

      function hostsChanged() {
        self.nodesReceived = true;
        if (typeof self.onNodesChanged === 'function') {
          self.onNodesChanged();
        }
      }

      function networksChanged() {
        self.networksReceived = true;
        if (typeof self.onNetworksChanged === 'function') {
           self.onNetworksChanged();
        }
      }

      if (initialized != null) {
        return initialized;
      }

      hostsData = openRemoteData('Hosts', HOSTS_QUERY, processHostsData, hostsChanged);

      networkData = openRemoteData('Networks', NETWORKS_QUERY, processMapData, networksChanged);

      initialized = Promise.all([hostsData, networkData]);

      return initialized;
    },

    getNodesTable : function() {
      return Object.keys(this.networkNodes).map((nodeId) => {
        return this.networkNodes[nodeId];
      });
    }

  };

}
