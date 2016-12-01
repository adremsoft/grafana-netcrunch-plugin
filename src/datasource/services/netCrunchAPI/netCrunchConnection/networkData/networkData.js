/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

/* eslint-disable func-names, object-shorthand, no-param-reassign, no-shadow, prefer-template */

import { NetCrunchAtlasTree } from './atlasTree';
import { AdremWebWorker } from '../../adrem/module';

const THREAD_WORKER_NODES_NUMBER = 1000;

let orderingWebWorkerSingleton = null;

function NetCrunchNetworkData(adremClient, netCrunchServerConnection) {

  const atlasTree = new NetCrunchAtlasTree(netCrunchServerConnection);
  let initialized = null;

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

  function processHostsData(data) {
    const host = Object.create(null);
    host.local = Object.create(null);
    host.values = data.getValues();
    atlasTree.addNode(host);
  }

  function decodeNetworkData(record) {
    let mapsData;

    function addNodesToNetwork(network) {
      const
        len = network.values.HostMapData[0];
      let
        nodeData,
        i;

      network.local.nodes = [];

      for (i = 1; i <= len; i += 1) {
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

    record.local.isFolder = ((record.values.MapClassTag === 'dynfolder') ||
                              Array.isArray(record.values.NetworkData[1]));

    if (record.local.isFolder) {
      mapsData = record.values.NetworkData[1];
      if (Array.isArray(mapsData)) {                          // otherwise it can be empty object instead of empty array
        record.local.maps = mapsData.map(id => parseInt(id, 10));
      }

      if (record.values.MapClassTag === 'fnet') {             // Add nodes into physical segments map
        addNodesToNetwork(record);
      }
    } else {
      addNodesToNetwork(record);
    }

    return record;
  }

  function processMapData(data) {
    const map = Object.create(null);
    map.local = data.local;
    map.values = data.getValues();
    atlasTree.addMapToIndex(decodeNetworkData(map));
  }

  function nodeAddress(address) {                   // eslint-disable-line
    let result = address;

    if ((address != null) && (address !== '')) {
      result = `(${address})`;
    }
    return result;
  }

  function mapNodes(nodes, map) {
    const
      mapNodes = [],
      nodesIndex = new Map();

    function pushUniqueValueToArray(destination, value) {
      if (destination.indexOf(value) < 0) {
        destination.push(value);
      }
    }

    function getMapNodes(map) {
      let nodes;

      if (map.data.local.isFolder === false) {
        nodes = map.data.local.nodes;
      } else {
        nodes = [];

        if (map.data.values.MapClassTag === 'fnet') {       // Add nodes into physical segment map
          map.data.local.nodes.forEach((node) => {
            pushUniqueValueToArray(nodes, node);
          });
        }

        map.children.forEach((subMap) => {
          getMapNodes(subMap).forEach((node) => {
            pushUniqueValueToArray(nodes, node);
          });
        });
      }
      return nodes;
    }

    if (map != null) {
      nodes.forEach((node) => {
        if ((node.values != null) && (node.values.Id != null)) {
          nodesIndex.set(node.values.Id, node);
        }
      });

      getMapNodes(map).forEach((nodeId) => {
        if (nodesIndex.has(nodeId)) {
          mapNodes.push(nodesIndex.get(nodeId));
        }
      });

      return mapNodes;
    }

    return nodes;
  }

  function orderNodes(nodes = []) {

    function compareAddressIP(addressOne, addressTwo) {
      const
        addressOneItems = addressOne.split('.'),
        addressTwoItems = addressTwo.split('.');

      for (let i = 0, n = Math.max(addressOneItems.length, addressTwoItems.length); i < n; i += 1) {
        if (addressOneItems[i] !== addressTwoItems[i]) {
          return (addressOneItems[i] - addressTwoItems[i]);
        }
      }
      return 0;
    }

    function getNodeProperty(node, propertyName) {
      return ((node.values != null) && (node.values[propertyName] != null)) ? node.values[propertyName] : '';
    }

    function compareNodeData(nodeA, nodeB) {
      const
        nodeAName = getNodeProperty(nodeA, 'Name').toLowerCase(),
        nodeBName = getNodeProperty(nodeB, 'Name').toLowerCase(),
        nodeAAddress = getNodeProperty(nodeA, 'Address'),
        nodeBAddress = getNodeProperty(nodeB, 'Address');
      let result = 0;

      if ((nodeAName !== '') && (nodeBName !== '')) {
        if (nodeAName === nodeBName) {
          result = 0;
        } else {
          result = (nodeAName < nodeBName) ? -1 : 1;
        }
      } else if ((nodeAName === '') && (nodeBName === '')) {
        result = compareAddressIP(nodeAAddress, nodeBAddress);
      } else {
        if (nodeAName !== '') { result = -1; }
        if (nodeBName !== '') { result = 1; }
      }
      return result;
    }

    nodes = nodes.filter(node => (node.values != null));
    return nodes.sort(compareNodeData);
  }

  function filterAndOrderMapNodes(nodes, map) {
    return orderNodes(mapNodes(nodes, map));
  }

  function getOrderingWebWorker() {
    if (orderingWebWorkerSingleton == null) {
      const workerBuilder = AdremWebWorker.webWorkerBuilder();
      workerBuilder.addFunctionCode(mapNodes);
      workerBuilder.addFunctionCode(orderNodes);
      workerBuilder.addFunctionCode(filterAndOrderMapNodes, true);
      orderingWebWorkerSingleton = workerBuilder.getWebWorker();
    }
    return orderingWebWorkerSingleton;
  }

  return {
    networkNodes: atlasTree.nodes,
    networkTree: atlasTree.tree,
    networksReceived: false,
    nodesReceived: false,

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

      // eslint-disable-next-line
      hostsData = openRemoteData('Hosts', HOSTS_QUERY, processHostsData, hostsChanged);

      // eslint-disable-next-line
      networkData = openRemoteData('Networks', NETWORKS_QUERY, processMapData, networksChanged);

      initialized = Promise.all([hostsData, networkData]);

      return initialized;
    },

    getNodesTable: function() {
      return Object.keys(this.networkNodes).map(nodeId => this.networkNodes[nodeId]);
    },

    getOrderedNodes: function(map = null) {
      let nodes = this.getNodesTable() || [];
      return new Promise((resolve) => {
        if (nodes.length < THREAD_WORKER_NODES_NUMBER) {
          nodes = filterAndOrderMapNodes(nodes, map);
          resolve(nodes);
        } else {
          getOrderingWebWorker().filterAndOrderMapNodes(nodes, map)
            .then(nodes => resolve(nodes));
        }
      });
    },

    addNodesMap(nodes) {
      nodes.nodesMap = new Map();
      nodes.forEach(node => nodes.nodesMap.set(node.values.Id, node));
      return nodes;
    }

  };

}

export {
  NetCrunchNetworkData
};
