/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

const
  PRIVATE_PROPERTIES = {
    map: Symbol('map'),
    array: Symbol('array')
  };

// Babel doesn't support extends from native class like Array, Map, Set

function NodesArray() {}

NodesArray.prototype = Object.create(Array.prototype);

class NetCrunchNodes {

  constructor() {
    this[PRIVATE_PROPERTIES.map] = new Map();
    this[PRIVATE_PROPERTIES.array] = new NodesArray();
  }

  add(node) {
    this[PRIVATE_PROPERTIES.map].set(node.id, node);
    this[PRIVATE_PROPERTIES.array].push(node);
  }

  mapNodes(map = null) {

    if (map != null) {
      const result = new NodesArray();

      map.allNodesId.forEach((nodeId) => {
        if (this[PRIVATE_PROPERTIES.map].has(nodeId)) {
          result.push(this[PRIVATE_PROPERTIES.map].get(nodeId));
        }
      });
      return result;
    }

    return this[PRIVATE_PROPERTIES.array];
  }

}

export {
  NetCrunchNodes
};
