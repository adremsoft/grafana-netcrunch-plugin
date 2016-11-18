/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

class NetCrunchConnectionCache {

  constructor () {
    this.connectionCache = new Map();
  }

  getConnectionKey(datasource) {
    return datasource.serverURL + ':' + datasource.username;
  }

  addConnection(datasource, connection) {
    this.connectionCache.set(this.getConnectionKey(datasource), connection);
  }

  removeConnection(datasource) {
    this.connectionCache.set(this.getConnectionKey(datasource), null);
  }

  getConnection(datasource) {
    this.connectionCache.get(this.getConnectionKey(datasource));
  }

  connectionExist(datasource) {
    return (this.getConnection(datasource) !== null);
  }
}

export {
  NetCrunchConnectionCache as NetCrunchConnectionCache
}
