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
    this[PRIVATE_PROPERTIES.local] = mapRec.local;
    this[PRIVATE_PROPERTIES.values] = mapRec.getValues();
  }

}

export {
  NetCrunchNetworkMap
};
