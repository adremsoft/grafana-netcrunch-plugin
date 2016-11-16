/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import {systemJSDatasourceURL} from '../../../common';

const adremModuleUrl = systemJSDatasourceURL + 'services/connectionProvider/adrem/',
      adremClient = adremModuleUrl + 'client.min.js',
      objectMapper = adremModuleUrl + 'ObjMapper.min.js',
      remoteDataLists = adremModuleUrl + 'RemoteDataLists.min.js',
      netCrunchObjects = adremModuleUrl + 'NCObjects.min';

function importAdremClient() {
  return SystemJS.import(adremClient).then((adrem) => {
    return SystemJS.import(remoteDataLists).then(() => {
      return SystemJS.import(objectMapper).then(() => {
        return SystemJS.import(netCrunchObjects).then(() => {
          return adrem;
        });
      });
    });
  });
}

const adrem = importAdremClient();

export {
  adrem as adrem
}
