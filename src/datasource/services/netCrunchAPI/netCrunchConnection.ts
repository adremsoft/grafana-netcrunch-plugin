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
    this.serverConnectionReady = null;
    this.netCrunchClient = null;
    this.loginInProgress = false;
    this.loginInProgressPromise = null;
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

  authenticateUser(userName, password) {
    const MAX_LOGIN_ATTEMPTS = 3,
          BASE_LOGIN_TIMEOUT = 5000;
    let netCrunchClient = this.netCrunchClient,
        loginProcess;

    function loginTimeout(attempt) {
      return (MAX_LOGIN_ATTEMPTS - attempt + 1) * BASE_LOGIN_TIMEOUT;
    }

    function tryAuthenticate(userName, password, attempt) {
      return new Promise((resolve, reject) => {
        netCrunchClient.login(userName, password, (status) => {
          if (status === true) {
            resolve();
          } else {
            if (attempt > 1) {
              setTimeout(function() {
                tryAuthenticate(userName, password, attempt - 1).then(
                  function() { resolve(); },
                  function() { reject(); }
                );
              }, loginTimeout(attempt));
            } else {
              reject();
            }
          }
        });
      });
    }

    if (this.loggedIn() === false) {
      if (this.loginInProgress === false) {
        let self = this;
        this.loginInProgress = true;
        loginProcess = new Promise((resolve, reject) => {
          tryAuthenticate(userName, password, MAX_LOGIN_ATTEMPTS).then(
            function() {
              self.loginInProgress = false;
              self.loginInProgressPromise = null;
              resolve();
            },
            function() {
              self.loginInProgress = false;
              self.loginInProgressPromise = null;
              reject(CONNECTION_CONSTS.ERROR_AUTHENTICATION);
            }
          );
        });
        this.loginInProgressPromise = loginProcess;
      } else {
        loginProcess = this.loginInProgressPromise;
      }
    } else {
      loginProcess = Promise.resolve();
    }
    return loginProcess;
  }

  loggedIn() {
    return ((this.netCrunchClient != null) && ('Session' in this.netCrunchClient) &&
            (this.netCrunchClient.status.logged === true));
  }

}

export {
  NetCrunchConnection as NetCrunchConnection
}
