/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

export default function NetCrunchAtlasTree(netCrunchConnection) {

  let mapTree = {
          '' : {
              children : []
          }
      },
      orphans = [],
      nodes = {},
      iconSize = 25,

      MAP_ICON_ID_UNKNOWN = 100;

  function parseXML(data) {
    let xml;

    if ( !data || typeof data !== "string" ) {
      return null;
    }

    try {
      //noinspection TypeScriptUnresolvedFunction
        xml = ( new window.DOMParser() ).parseFromString( data, "text/xml" );
    } catch ( e ) {
      xml = undefined;
    }

    return xml;
  }

  function getDeviceIcon(deviceTypeXML) {
    if (deviceTypeXML !== '' && deviceTypeXML != null) {
      let doc = parseXML(deviceTypeXML),
          devtype = doc.getElementsByTagName('devtype'),
          result = MAP_ICON_ID_UNKNOWN;
      if (devtype[0] != null) {
        result = devtype[0].getAttribute('iconid') || result;
      }
      return result;
    } else {
      return 0;
    }
  }

  function getMapIconUrl (iconId, size) {
    let iconUrl;
    size = size || 32;
    iconUrl = netCrunchConnection.ncSrv.IMapIcons.GetIcon.asURL(iconId, size);
    return netCrunchConnection.Client.urlFilter(iconUrl);
  }

  function pushUniqueChildToMap (map, child) {
    let isUnique;

    isUnique = map.children.every(function(mapChild) {
      return (mapChild.data.values.NetIntId !== child.data.values.NetIntId);
    });

    if (isUnique === true) {
      map.children.push(child);
    }
  }

  return {
    tree : mapTree,
    nodes : nodes,

    addMapToIndex : function (mapRec) {
      let parentId = mapRec.local.parentId,
          netId = mapRec.values.NetIntId;

      mapTree[netId] = {
        data : mapRec,
        children : []
      };

      orphans = orphans.filter(function (orphan) {
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

    addNode : function (nodeRec) {
      nodeRec.local.iconUrl = getMapIconUrl(getDeviceIcon(nodeRec.values.DeviceType), iconSize);
      nodes[nodeRec.values.Id] = nodeRec;
    },

    generateMapList : function() {

      let mapList = [];

      function sortMaps(first, second){
        if (first.data.values.DisplayName === second.data.values.DisplayName) {
          return 0;
        } else {
          if (first.data.values.DisplayName < second.data.values.DisplayName) {
            return -1;
          } else {
            return 1;
          }
        }
      }

      function performMapList(maps, innerLevel, parentIndex){
        maps.sort(sortMaps);
        maps.forEach(function(map) {
          map.data.local.innerLevel = innerLevel;
          map.data.local.parentLinearIndex = parentIndex;
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
