/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

class NetCrunchMetricFindQuery {

  constructor(datasource, query) {
    this.datasource = datasource;
    this.query = query;
  }

  nodes(...selectors) {
    const nodeGroup = selectors.filter(selector => (selector != null));

    return Promise.resolve([
      { text: 'server1', value: 123 }
    ]);
  }

  process() {
    const nodes = this.query.match(/^nodes\(([^)]+?)(,\s?([^,]+?))?\)/);
    if (nodes) {
      return this.nodes(...nodes[1].split(','), nodes[3]);
    }
    return Promise.resolve([]);
  }

}

export {
  NetCrunchMetricFindQuery
};
