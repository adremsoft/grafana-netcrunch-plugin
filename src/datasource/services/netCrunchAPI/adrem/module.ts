/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import {systemJSDatasourceURL, servicesModule} from '../../../common';
import {NetCrunchCounters, NETCRUNCH_COUNTER_CONST, NETCRUNCH_COUNTER_TYPES} from './NetCrunchCounters';
import {AdremWebWorker} from './adremWebWorker';

const adremModuleUrl = systemJSDatasourceURL + 'services/netCrunchAPI/adrem/',
      adremClient = adremModuleUrl + 'client.min.js',
      objectMapper = adremModuleUrl + 'ObjMapper.min.js',
      remoteDataLists = adremModuleUrl + 'RemoteDataLists.min.js',
      netCrunchObjects = adremModuleUrl + 'NCObjects.min';

function importAdremClient() {
  return SystemJS.import(adremClient)
    .then((adrem) => {
      return SystemJS.import(remoteDataLists)
        .then(() => {
          return SystemJS.import(objectMapper);
        })
        .then(() => {
          return SystemJS.import(netCrunchObjects);
        })
        .then(() => {
          return adrem;
        });
    });
}

const adrem = importAdremClient();

angular
  .module(servicesModule)
  .factory('adrem', function() { return adrem; });

export {
  adrem as adrem,
  NetCrunchCounters as NetCrunchCounters,
  NETCRUNCH_COUNTER_CONST as NETCRUNCH_COUNTER_CONST,
  NETCRUNCH_COUNTER_TYPES as NETCRUNCH_COUNTER_TYPES,
  AdremWebWorker as AdremWebWorker
}
