/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import {CONNECTION_CONSTS} from './services/netCrunchAPI/module';

const
  CONNECTION_ERROR_MESSAGES = CONNECTION_CONSTS.ERROR_MESSAGES;

class NetCrunchDatasource {

  /** @ngInject */
  constructor(instanceSettings, netCrunchAPIService, alertSrv) {
    let self = this;

    function initDatasource() {
      let netCrunchSession;

      return new Promise((resolve, reject) => {
        if (self.url != null) {
          netCrunchSession = self.netCrunchAPI.getConnection(self);
          netCrunchSession
            .then((connection) => {
              let fromCache = connection.fromCache;
              self.netCrunchConnection = connection;
              initUpdateNodes(connection.networkAtlas, fromCache);
              initUpdateAtlas(connection.networkAtlas, fromCache);
              resolve();
            })
            .catch((error) => {
              self.alertSrv.set(self.name, CONNECTION_ERROR_MESSAGES[error], 'error');
              console.log('');
              console.log('NetCrunch datasource');
              console.log(self.name + ': ' + CONNECTION_ERROR_MESSAGES[error]);
              reject();
            });
        } else {
          reject();
        }
      });
    }

    function initUpdateNodes(networkAtlas, fromCache) {
    }

    function initUpdateAtlas(networkAtlas, fromCache) {
    }

    this.name = instanceSettings.name;
    this.url = instanceSettings.url;
    this.serverUrl = instanceSettings.jsonData.simpleUrl;
    this.username = instanceSettings.jsonData.user;
    this.password = instanceSettings.jsonData.password;

    this.netCrunchAPI = netCrunchAPIService;
    this.alertSrv = alertSrv;

  }

  query(options) {
    return [];
  }

  testDatasource() {
    return new Promise((resolve) => {
      this.netCrunchAPI.testConnection(this)
        .then(() => {
          resolve({
            status: "success",
            message: "Datasource is working",
            title: "Success" });
        })
        .catch((error) => {
          resolve({
            status: "error",
            message: CONNECTION_ERROR_MESSAGES[error],
            title: "Error" });
        });
    });
  }

}

export {
  NetCrunchDatasource
};
