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
    this.setDefaults();
    this.checkMaxDataPoints();
  }

  setDefaults() {
    const
      DEFAULT_QUERY_OPTIONS = {
        maxDataPoints: this.MAX_SAMPLE_COUNT.DEFAULT,
        rawData: false,
        setMaxDataPoints: false
      },
      panel = this.panel;

    if (panel.scopedVars == null) {
      panel.scopedVars = DEFAULT_QUERY_OPTIONS;
    } else {
      Object.keys(DEFAULT_QUERY_OPTIONS)
        .forEach((option) => {
          if (panel.scopedVars[option] == null) {
            panel.scopedVars[option] = DEFAULT_QUERY_OPTIONS[option];
          }
        });
    }
  }

  checkMaxDataPoints() {
    const scopedVars = this.panel.scopedVars;
    if (!((scopedVars.maxDataPoints >= this.MAX_SAMPLE_COUNT.MIN) &&
          (scopedVars.maxDataPoints <= this.MAX_SAMPLE_COUNT.MAX))) {
      scopedVars.maxDataPoints = this.MAX_SAMPLE_COUNT.DEFAULT;
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
