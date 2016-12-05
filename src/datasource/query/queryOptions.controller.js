/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import { QueryCtrl } from 'app/plugins/sdk';  // eslint-disable-line
import { datasourceURL } from '../common';

class NetCrunchQueryOptionsController extends QueryCtrl {

  constructor() {
    super();
    this.MAX_SAMPLE_COUNT = this.panelCtrl.datasource.MAX_SAMPLE_COUNT;
    this.checkMaxDataPoints();
  }

  checkMaxDataPoints() {
    if (!((this.panel.scopedVars.maxDataPoints >= this.MAX_SAMPLE_COUNT.MIN) &&
          (this.panel.scopedVars.maxDataPoints <= this.MAX_SAMPLE_COUNT.MAX))) {
      this.panel.scopedVars.maxDataPoints = this.MAX_SAMPLE_COUNT.DEFAULT;
    }
  }

  metricOptionsChange() {
    this.panelCtrl.refresh();
  }

  static get templateUrl() {
    return `${datasourceURL}query/query.options.html`;
  }

}

export {
  NetCrunchQueryOptionsController
};
