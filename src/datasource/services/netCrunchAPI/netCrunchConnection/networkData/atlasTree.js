/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import { NetCrunchNode } from './node';

function NetCrunchAtlasTree(netCrunchServerConnection) {

  const
    mapTree = {
      '': {
        children: []
      }
    },
    nodes = {};

  let orphans = [];

  function pushUniqueChildToMap(map, child) {
    const isUnique = map.children.every(mapChild => (mapChild.data.values.NetIntId !== child.data.values.NetIntId));

    if (isUnique === true) {
      map.children.push(child);
    }
  }

  return {
    tree: mapTree,
    nodes,

    addMapToIndex: (mapRec) => {
      const
        parentId = mapRec.local.parentId,
        netId = mapRec.values.NetIntId;

      mapTree[netId] = {
        data: mapRec,
        children: []
      };

      orphans = orphans.filter((orphan) => {
        if (orphan.data.local.parentId === netId) {
          pushUniqueChildToMap(mapTree[netId], orphan);
          return false;
        }
        return true;
      });

      if (mapTree[parentId] != null) {
        pushUniqueChildToMap(mapTree[parentId], mapTree[netId]);
      } else {
        orphans.push(mapTree[netId]);
      }
    },

    addNode: (nodeRec) => {
      const newNode = new NetCrunchNode(nodeRec, netCrunchServerConnection);
      nodes[newNode.id] = newNode;
    },

    generateMapList: () => {

      const mapList = [];

      function sortMaps(first, second) {
        if (first.data.values.DisplayName !== second.data.values.DisplayName) {
          if (first.data.values.DisplayName < second.data.values.DisplayName) {
            return -1;
          }
          return 1;
        }
        return 0;
      }

      function performMapList(maps, innerLevel, parentIndex) {
        maps.sort(sortMaps);
        maps.forEach((map) => {
          map.data.local.innerLevel = innerLevel;           // eslint-disable-line
          map.data.local.parentLinearIndex = parentIndex;   // eslint-disable-line
          if (map.data.local.isFolder === true) {
            mapList.push(map);
            performMapList(map.children, innerLevel + 1, mapList.length - 1);
          } else {
            mapList.push(map);
          }
        });
      }

      performMapList(mapTree[''].children, 1, 'root');
      return mapList;
    }
  };
}

export {
  NetCrunchAtlasTree
};
