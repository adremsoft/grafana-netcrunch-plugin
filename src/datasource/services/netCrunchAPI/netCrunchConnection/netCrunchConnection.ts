/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import NetCrunchNetworkData from './netCrunchNetworkData';
import NetCrunchCountersData from './netCrunchCountersData';
import NetCrunchTrendData from './netCrunchTrendData';

export const CONNECTION_CONSTS = {
  API_NAME: '/ncapi/',

  NC_SERVER_VER_MAJOR : 9,
  NC_SERVER_VER_MINOR : 2,

  STATUS_OK : 0,
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

export default class NetCrunchConnection {

  constructor(adrem, serverURL, connectionName) {
    this.adrem = adrem;
    this.apiName = CONNECTION_CONSTS.API_NAME;
    this.apiURL = serverURL + this.apiName;
    this.connectionName =connectionName;
    this.serverConnection = null;
    this.serverConnectionReady = null;
    this.netCrunchClient = null;
    this.trendQuery = null;
    this.loginInProgress = false;
    this.loginInProgressPromise = null;
    this.networkAtlas = new Map();
    this.networkAtlasReady = new Promise((resolve) => { this.networkAtlasReadyResolve = resolve; });
    this.counters = new Map();
    this.trends = null;
  }

  checkApiVersion(serverApi) {

    function parseVersion(version) {
      let versionPattern = /^(\d+).(\d+).(\d+)(.(\d+))*$/,
          versionElements = versionPattern.exec(version);

      if (versionElements != null) {
        return {
          major : versionElements[1],
          minor : versionElements[2],
          bugfix : versionElements[3],
          text : version
        };
      } else {
        return null;
      }
    }

    function versionGreaterEqualThan(version, major, minor) {
      let result = false;

      if (parseInt(version.major, 10) >= parseInt(major, 10)) {
        if (parseInt(version.major, 10) > parseInt(major, 10)) {
          result = true;
        } else {
          if (parseInt(version.minor, 10) >= parseInt(minor, 10)) {
            result = true;
          }
        }
      }

      return result;
    }

    function createResult(status, version = null) {
      return {
        status: status,
        version: version
      };
    }

    if ((serverApi.api != null) && (serverApi.api[0] != null) && (serverApi.api[0].ver != null)) {
      let version,
          minMajor = CONNECTION_CONSTS.NC_SERVER_VER_MAJOR,
          minMinor = CONNECTION_CONSTS.NC_SERVER_VER_MINOR;

      version = parseVersion(serverApi.api[0].ver);
      if (version != null) {
        if (versionGreaterEqualThan(version, minMajor, minMinor)) {
          return createResult(CONNECTION_CONSTS.STATUS_OK, version);
        } else {
          return createResult(CONNECTION_CONSTS.ERROR_SERVER_VER, version);
        }
      } else {
        return createResult(CONNECTION_CONSTS.ERROR_SERVER_VER);
      }
    } else {
      return createResult(CONNECTION_CONSTS.ERROR_SERVER_VER);
    }
  }

  login(userName, password, ignoreDownloadNetworkAtlas = false) {

    function nodesChanged() {
      if (typeof this.onNodesChanged === 'function') {
        this.onNodesChanged();
      }
    }

    function networksChanged() {
      if (typeof this.onNetworksChanged === 'function') {
        this.onNetworksChanged();
      }
    }

    if (this.serverConnection == null) {
      this.serverConnectionReady = this.establishConnection();
    }
    return this.serverConnectionReady.then(() => {
      return this.authenticateUser(userName, password).then(() => {
        this.networkAtlas = new NetCrunchNetworkData(this.adremClient, this.serverConnection);
        this.networkAtlas.onNodesChanged = nodesChanged.bind(this);
        this.networkAtlas.onNetworksChanged = networksChanged.bind(this);
        this.counters = new NetCrunchCountersData(this.adremClient, this.serverConnection);
        this.trends =  new NetCrunchTrendData(this);

        if (ignoreDownloadNetworkAtlas !== true) {
          this.networkAtlas.init().then(() => {
            //noinspection TypeScriptUnresolvedFunction
            this.networkAtlasReadyResolve(this.networkAtlas);
          });
        }
        return true;
      });
    });
  }

  logout() {
    let self = this;
    return new Promise((resolve) => {
      if (self.serverConnectionReady != null) {
        self.serverConnectionReady.then(
          function() {
            self.netCrunchClient.logout(() => {
              resolve();
            });
          },
          function() {
            resolve();
          }
        );
      } else {
        resolve();
      }
    });
  }

  establishConnection () {
    return new Promise((resolve, reject) => {
      this.adrem.then((adrem) => {
        let apiName = this.apiName,
            apiURL = this.apiURL;

        this.adremClient = adrem;

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

  queryTrendData() {
    if (this.trendQuery == null) {
      this.trendQuery = new this.serverConnection.ncSrv.ITrendQuery();
    }
    return this.callApi(this.trendQuery.AnalyzeGetData, arguments);
  }

  callApi (apiCall, args, acceptEmpty = true) {
    let self = this;
    return new Promise((resolve, reject) => {
      args = Array.prototype.slice.call(args, 0);   // convert arguments to Array
      apiCall.apply(self, args.concat([function (data) {
        if ((data !== undefined) || acceptEmpty) {
          resolve(data);
        } else {
          reject();
        }
      }]));
    });
  }

}
