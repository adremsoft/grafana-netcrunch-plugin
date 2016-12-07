/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

const
  PRIVATE_PROPERTIES = {
    local: Symbol('local'),
    values: Symbol('values')
  };

class NetCrunchNetworkMap {

  constructor(mapRec) {

    /* eslint-disable no-param-reassign */

    function addNodesToNetworkMap(local, values) {

      local.nodesId = [];

      for (let i = 1, len = values.HostMapData[0]; i <= len; i += 1) {
        const nodeData = values.HostMapData[i];
        if ((nodeData[0] === 0) || (nodeData[0] === 5)) {
          local.nodesId.push(parseInt(nodeData[1], 10));
        }
      }
    }

    function decodeNetworkMapData(local, values) {

      local.parentId = parseInt(values.NetworkData[0], 10);
      if (isNaN(local.parentId)) {
        local.parentId = '';
      }

      local.isFolder = ((values.MapClassTag === 'dynfolder') || Array.isArray(values.NetworkData[1]));

      if (local.isFolder) {
        const mapsData = values.NetworkData[1];

        if (Array.isArray(mapsData)) {                        // otherwise it can be empty object instead of empty array
          local.maps = mapsData.map(id => parseInt(id, 10));
        }

        if (values.MapClassTag === 'fnet') {                  // Add nodes into physical segments map
          addNodesToNetworkMap(local, values);
        }
      } else {
        addNodesToNetworkMap(local, values);
      }
    }

    /* eslint-enable no-param-reassign */

    this[PRIVATE_PROPERTIES.local] = mapRec.local;
    this[PRIVATE_PROPERTIES.values] = mapRec.getValues();
    decodeNetworkMapData(this[PRIVATE_PROPERTIES.local], this[PRIVATE_PROPERTIES.values]);
  }

  get netId() {
    return this[PRIVATE_PROPERTIES.values].NetIntId;
  }

  get parentId() {
    return this[PRIVATE_PROPERTIES.local].parentId;
  }

  get nodesId() {
    return this[PRIVATE_PROPERTIES.local].nodesId;
  }

  get isFolder() {
    return this[PRIVATE_PROPERTIES.local].isFolder;
  }

}

export {
  NetCrunchNetworkMap
};
