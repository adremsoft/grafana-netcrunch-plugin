/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

/* global window */

function NetCrunchAtlasTree(netCrunchServerConnection) {

  const
    mapTree = {
      '': {
        children: []
      }
    },
    nodes = {},
    iconSize = 25,

    MAP_ICON_ID_UNKNOWN = 100;

  let orphans = [];

  function parseXML(data) {
    let xml;

    if (!data || typeof data !== 'string') {
      return null;
    }

    try {
      xml = (new window.DOMParser()).parseFromString(data, 'text/xml');
    } catch (e) {
      xml = undefined;
    }

    return xml;
  }

  function getDeviceIcon(deviceTypeXML) {
    if (deviceTypeXML !== '' && deviceTypeXML != null) {
      const
        doc = parseXML(deviceTypeXML),
        devtype = doc.getElementsByTagName('devtype');
      let result = MAP_ICON_ID_UNKNOWN;

      if (devtype[0] != null) {
        result = devtype[0].getAttribute('iconid') || result;
      }
      return result;
    }
    return 0;
  }

  function getMapIconUrl(iconId, size) {
    const iconUrl = netCrunchServerConnection.ncSrv.IMapIcons.GetIcon.asURL(iconId, (size || 32));
    return netCrunchServerConnection.Client.urlFilter(iconUrl);
  }

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
      // eslint-disable-next-line
      nodeRec.local.iconUrl = getMapIconUrl(getDeviceIcon(nodeRec.values.DeviceType), iconSize);
      nodes[nodeRec.values.Id] = nodeRec;
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
