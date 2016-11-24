/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

function nodeAddress(address) {
  let result = address;

  if ((address != null) && (address !== '')) {
    result = `(${address})`;
  }
  return result;
}

function mapNodes(nodes, map) {
  let mapNodes = [],
      nodesIndex = new Map();

  function pushUniqueValueToArray(destination, value) {
    if (destination.indexOf(value) < 0) {
      destination.push(value);
    }
  }

  function getMapNodes (map) {
    let nodes;

    if (map.data.local.isFolder === false) {
      nodes = map.data.local.nodes;
    } else {
      nodes = [];

      if (map.data.values.MapClassTag === 'fnet') {             //Add nodes into physical segment map
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
  } else {
    return nodes;
  }
}

function orderNodes(nodes = []) {

  function compareAddressIP(addressOne, addressTwo) {
    let addressOneItems = addressOne.split('.'),
        addressTwoItems = addressTwo.split('.');

    for (let i = 0, n = Math.max(addressOneItems.length, addressTwoItems.length); i < n; i += 1) {
      if (addressOneItems[i] !== addressTwoItems[i]) {
        return (addressOneItems[i] - addressTwoItems[i]);
      }
    }
  }

  function getNodeProperty(node, propertyName) {
    return ((node.values != null) && (node.values[propertyName] != null)) ? node.values[propertyName] : '';
  }

  function compareNodeData(nodeA, nodeB) {
    let result = 0,
        nodeAName = getNodeProperty(nodeA, 'Name').toLowerCase(),
        nodeBName = getNodeProperty(nodeB, 'Name').toLowerCase(),
        nodeAAddress = getNodeProperty(nodeA, 'Address'),
        nodeBAddress = getNodeProperty(nodeB, 'Address');

    if ((nodeAName !== '') && (nodeBName !== '')) {
      if (nodeAName === nodeBName) {
        result = 0;
      } else {
        result = (nodeAName < nodeBName) ? -1 : 1;
      }
    } else {
      if ((nodeAName === '') && (nodeBName === '')) {
        result = compareAddressIP(nodeAAddress, nodeBAddress);
      } else {
        if (nodeAName !== '') { result = -1; }
        if (nodeBName !== '') { result = 1; }
      }
    }
    return result;
  }

  nodes = nodes.filter((node) => {
    return (node.values != null);
  });
  return nodes.sort(compareNodeData);
}

export {
  nodeAddress as nodeAddress,
  mapNodes as mapNodes,
  orderNodes as orderNodes
}
