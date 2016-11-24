/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import angular from 'angular';
import {servicesModule} from '../../common';
import './adrem/module';
import {NetCrunchConnectionCache} from './netCrunchConnectionCache';
import {NetCrunchConnection, CONNECTION_CONSTS} from './netCrunchConnection/netCrunchConnection';

const CONNECTION_ERROR_MESSAGES = CONNECTION_CONSTS.ERROR_MESSAGES;

class NetCrunchAPIService {

  /** @ngInject */
  constructor (adrem, alertSrv, backendSrv, $rootScope) {
    this.adrem = adrem;
    this.alertSrv = alertSrv;
    this.backendSrv = backendSrv;
    this.$rootScope = $rootScope;
    this.cache = new NetCrunchConnectionCache();
  }

  testConnection(datasource) {
    return this.clearConnection(datasource)
      .then(() => {
        return this.getConnection(datasource, true); })
      .then(() => {
        return this.clearConnection(datasource); });
  }

  clearConnection(datasource) {
    let self = this;
    return new Promise((resolve) => {
      if (self.cache.connectionExist(datasource)) {
        self.cache.getConnection(datasource)
          .then((connection) => {
            connection.logout()
              .then(() => {
                self.cache.deleteConnection(datasource);
                resolve();
              });
          });
      } else {
        resolve();
      }
    });
  }

  getConnection(datasource, withoutNetworkAtlas = false) {
    let self = this;

    function getConnectionFromCache(datasource) {
      return self.cache.getConnection(datasource)
        .then((connection) => {
          connection.fromCache = true;
          return connection;
        });
    }

    function getServerApi(connection) {
      return new Promise((resolve, reject) => {
        self.backendSrv.get(connection.apiURL + 'api.json')
          .then((api) => {
            resolve(api);
          })
          .catch((error) => {
            error.isHandled = true;
            reject(CONNECTION_CONSTS.ERROR_SERVER_API);
          });
      });
    }

    function addConnectionHandlers(datasource, connection) {

      connection.onError = function(error) {
        self.alertSrv.set(error.connectionName, error.message, 'error');
      };

      connection.onNodesChanged = function() {
        self.$rootScope.$broadcast('netcrunch-nodes-data-changed(' + datasource.name + ')');
      };

      connection.onNetworksChanged = function() {
        self.$rootScope.$broadcast('netcrunch-networks-data-changed(' + datasource.name + ')');
      };

      return connection;
    }

    function createSession(datasource, connection) {
      return new Promise((resolve, reject) => {
        connection.login(datasource.username, datasource.password, withoutNetworkAtlas)
          .then(() => {
            connection.fromCache = false;
            resolve(connection);
          })
          .catch((error) => {
            self.cache.deleteConnection(datasource);
            connection.logout();
            reject(error);
          });
      });
    }

    if (this.cache.connectionExist(datasource)) {
      return getConnectionFromCache(datasource);
    } else {
      let connection = new NetCrunchConnection(this.adrem, datasource.url, datasource.name);

      return getServerApi(connection)
        .then((serverApi) => {
          return new Promise((resolve, reject) => {
            let checkStatus = connection.checkApiVersion(serverApi);
            if (checkStatus.status === 0) {
              resolve(checkStatus.version);
            } else {
              reject(checkStatus.status);
            }
          });
        })
        .then(() => {
          connection = addConnectionHandlers(datasource, connection);
          self.cache.addConnection(datasource, createSession(datasource, connection));
          return self.cache.getConnection(datasource);
        });
    }
  }

}

export {
  CONNECTION_ERROR_MESSAGES as CONNECTION_ERROR_MESSAGES
}

angular
  .module(servicesModule)
  .service('netCrunchAPIService', NetCrunchAPIService);
