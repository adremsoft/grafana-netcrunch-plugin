/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import { NetCrunchNodesArray } from './nodesArray';

const
  PRIVATE_PROPERTIES = {
    map: Symbol('map'),
    array: Symbol('array')
  };

class NetCrunchNodes {

  constructor() {
    this[PRIVATE_PROPERTIES.map] = new Map();
    this[PRIVATE_PROPERTIES.array] = new NetCrunchNodesArray();
  }

  add(node) {
    this[PRIVATE_PROPERTIES.map].set(node.id, node);
    this[PRIVATE_PROPERTIES.array].push(node);
  }

  mapNodes(map = null) {

    if (map != null) {
      const result = new NetCrunchNodesArray();

      map.allNodesId.forEach((nodeId) => {
        if (this[PRIVATE_PROPERTIES.map].has(nodeId)) {
          result.push(this[PRIVATE_PROPERTIES.map].get(nodeId));
        }
      });
      return result;
    }

    return this[PRIVATE_PROPERTIES.array];
  }

  getNodeById(nodeId) {
    return this[PRIVATE_PROPERTIES.map].get(nodeId);
  }

}

export {
  NetCrunchNodes
};
