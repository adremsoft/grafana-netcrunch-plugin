/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import { QueryCtrl } from 'app/plugins/sdk';  // eslint-disable-line
import { datasourceURL } from '../common';

class NetCrunchQueryController extends QueryCtrl {

  constructor() {
    super();

    this.target.series = this.target.series || Object.create(null);
    this.target.showSeriesOptions = this.target.showSeriesOptions || true;

    this.nodes = [];

  }

  targetChanged() {
    this.panelCtrl.refresh();
  }

  toggleSeries() {
    this.target.showSeriesOptions = !this.target.showSeriesOptions;
  }

  static get templateUrl() {
    return `${datasourceURL}query/query.editor.html`;
  }

}

export {
  NetCrunchQueryController
};
