/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

const CONNECTION_CONSTS = {
        API_NAME: '/ncapi/',

        NC_SERVER_VER_MAJOR : 9,
        NC_SERVER_VER_MINOR : 2,

        ERROR_SERVER_API : 1,
        ERROR_SERVER_VER : 2,
        ERROR_CONNECTION_INIT : 3,
        ERROR_AUTHENTICATION : 4,
        ERROR_MESSAGES : [
          '',
          'Server connection failed',
          'NetCrunch server version should be 9.2 or greater',
          'Server connection initialization failed',
          'Authentication failed'
        ]
      };

class NetCrunchConnection {

  constructor(adrem, serverURL, connectionName) {
    this.adrem = adrem;
    this.apiName = CONNECTION_CONSTS.API_NAME;
    this.apiURL = serverURL + this.apiName;
    this.connectionName =connectionName;
    this.serverConnection = null;
    this.netCrunchClient = null;
  }

  establishConnection () {
    return new Promise((resolve, reject) => {
      this.adrem.then((adrem) => {
        let apiName = this.apiName,
            apiURL = this.apiURL;

        this.serverConnection = new adrem.Connection(apiURL);
        this.serverConnection.useWebSocket = false;
        this.serverConnection.reloadOnLogout = false;

        this.netCrunchClient = this.serverConnection.Client;

        this.netCrunchClient.urlFilter = function(url) {
          url = url.replace(apiName, '');
          url = apiURL + url;
          return url;
        };

        this.netCrunchClient.on('exception', (e) => {
          if (typeof this.onError === 'function') {
            //noinspection TypeScriptUnresolvedFunction
            this.onError({
              connectionName: this.connectionName,
              message: e.message
            });
          }
        });

        this.netCrunchClient.start('', (status) => {
          if (status.init === true) {
            resolve();
          } else {
            reject(CONNECTION_CONSTS.ERROR_CONNECTION_INIT);
          }
        });

      });
    });
  }
}

export {
  NetCrunchConnection as NetCrunchConnection
}
