/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import angular from 'angular';
import {servicesModule} from '../../common';

const connectionCache = new Map();

function getConnectionKey(datasource) {
  return datasource.serverURL + ':' + datasource.username;
}

class NetCrunchConnectionCache {

  /** @ngInject */
  constructor () {
  }

  static addConnection(datasource, connection) {
    connectionCache.set(getConnectionKey(datasource), connection);
  }

  static removeConnection(datasource) {
    connectionCache.set(getConnectionKey(datasource), null);
  }

  static getConnection(datasource) {
    connectionCache.get(getConnectionKey(datasource));
  }

  static connectionExist(datasource) {
    return (this.getConnection(datasource) !== null);
  }
}

angular
  .module(servicesModule)
  .service('netCrunchConnectionCache', NetCrunchConnectionCache);
