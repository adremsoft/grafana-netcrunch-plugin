/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import { NetCrunchNetworkNode } from './networkNode';
import { NetCrunchNetworkMap } from './networkMap';
import { NetCrunchNodes } from './networkNodes';

const
  ATLAS_ROOT_ID = '',
  PRIVATE_PROPERTIES = {
    connection: Symbol('connection'),
    nodes: Symbol('nodes'),
    atlas: Symbol('atlas'),
    orphans: Symbol('orphans')
  },
  ROOT_MAP_REC = {
    local: {},
    getValues: () => {                  // eslint-disable-line
      return {
        DisplayName: 'Network Atlas',
        MapClassTag: 'dynfolder',
        NetIntId: ATLAS_ROOT_ID
      };
    }
  };

class NetCrunchNetworkAtlas {

  constructor(netCrunchServerConnection) {
    this[PRIVATE_PROPERTIES.connection] = netCrunchServerConnection;
    this[PRIVATE_PROPERTIES.nodes] = new NetCrunchNodes();
    this[PRIVATE_PROPERTIES.atlas] = new Map();
    this[PRIVATE_PROPERTIES.atlas].set(ATLAS_ROOT_ID, new NetCrunchNetworkMap(ROOT_MAP_REC));
    this[PRIVATE_PROPERTIES.orphans] = [];
  }

  addMap(mapRec) {
    const
      networkMap = new NetCrunchNetworkMap(mapRec);

    this[PRIVATE_PROPERTIES.atlas].set(networkMap.netId, networkMap);

    this[PRIVATE_PROPERTIES.orphans] = this[PRIVATE_PROPERTIES.orphans]
      .filter((orphan) => {
        if (orphan.parentId === networkMap.netId) {
          this[PRIVATE_PROPERTIES.atlas]
            .get(networkMap.netId)
            .addChild(orphan);
          return false;
        }
        return true;
      });

    if (this[PRIVATE_PROPERTIES.atlas].has(networkMap.parentId)) {
      this[PRIVATE_PROPERTIES.atlas]
        .get(networkMap.parentId)
        .addChild(networkMap);
    } else {
      this[PRIVATE_PROPERTIES.orphans].push(networkMap);
    }
  }

  addNode(nodeRec) {
    const newNode = new NetCrunchNetworkNode(nodeRec, this[PRIVATE_PROPERTIES.connection]);
    this[PRIVATE_PROPERTIES.nodes].add(newNode);
  }

  get nodes() {
    return this[PRIVATE_PROPERTIES.nodes];
  }

  get atlas() {
    return this[PRIVATE_PROPERTIES.atlas];
  }

  get atlasRoot() {
    return this.atlas.get(ATLAS_ROOT_ID);
  }

}

export {
  NetCrunchNetworkAtlas
};
