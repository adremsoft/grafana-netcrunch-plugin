/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import {datasourceURL} from '../common';

class NetCrunchDatasourceConfigCtrl {
  static get templateUrl() {
      return datasourceURL + 'config/config.html';
  };
}

export {
  NetCrunchDatasourceConfigCtrl
}
