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
import NetCrunchConnectionCache from './netCrunchConnectionCache';
import NetCrunchConnection from './netCrunchConnection/netCrunchConnection';

class NetCrunchAPIService {

  /** @ngInject */
  constructor (adrem, alertSrv, $rootScope) {
    this.adrem = adrem;
    this.alertSrv = alertSrv;
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
    return new Promise((resolve) => {
      if (this.cache.connectionExist(datasource)) {
        this.cache.getConnection(datasource).then((connection) => {
          connection.logout().then(() => {
            this.cache.deleteConnection(datasource);
            resolve();
          });
        });
      } else {
        resolve();
      }
    });
  }

  getConnection(datasource, withoutNetworkAtlas = false) {
    //TODO: CHECK SERVER VERSION
    return this.getNetCrunchConnection(datasource, withoutNetworkAtlas);
  }

  getNetCrunchConnection(datasource, withoutNetworkAtlas = false) {
    if (this.cache.connectionExist(datasource)) {
      return this.cache.getConnection(datasource).then((connection) => {
        connection.fromCache = true;
        return connection;
      });
    } else {
      let self = this,
          connection = new NetCrunchConnection(this.adrem, datasource.url, datasource.name);

      connection.onError = function(error) {
        self.alertSrv.set(error.connectionName, error.message, 'error');
      };

      connection.onNodesChanged = function() {
        self.$rootScope.$broadcast('netcrunch-nodes-data-changed(' + datasource.name + ')');
      };

      connection.onNetworksChanged = function() {
        self.$rootScope.$broadcast('netcrunch-networks-data-changed(' + datasource.name + ')');
      };

      this.cache.addConnection(datasource, new Promise((resolve, reject) => {
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
      }));

      return this.cache.getConnection(datasource);
    }
  }

}

angular
  .module(servicesModule)
  .service('netCrunchAPIService', NetCrunchAPIService);
