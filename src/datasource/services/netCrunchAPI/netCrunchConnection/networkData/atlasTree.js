/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import { NetCrunchNetworkNode } from './networkNode';
import { NetCrunchNetworkMap } from './networkMap';

const
  PRIVATE_PROPERTIES = {
    connection: Symbol('connection'),
    nodes: Symbol('nodes'),
    atlas: Symbol('atlas'),
    orphans: Symbol('orphans')
  };

class NetCrunchAtlasTree {

  constructor(netCrunchServerConnection) {
    this[PRIVATE_PROPERTIES.connection] = netCrunchServerConnection;
    this[PRIVATE_PROPERTIES.nodes] = {};
    this[PRIVATE_PROPERTIES.atlas] = new Map();
    this[PRIVATE_PROPERTIES.atlas].set('', new NetCrunchNetworkMap());
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
    this[PRIVATE_PROPERTIES.nodes][newNode.id] = newNode;
  }

  get nodes() {
    return this[PRIVATE_PROPERTIES.nodes];
  }

  get atlas() {
    return this[PRIVATE_PROPERTIES.atlas];
  }

}

export {
  NetCrunchAtlasTree
};
