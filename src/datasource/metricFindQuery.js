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

  nodes(selectors) {

    function createQueryResult(nodes) {
      return nodes.map((node) => {
        const ipAddress = (node.address != null) ? `(${node.address})` : '';
        return {
          text: `${node.name} ${ipAddress}`,
          value: node.id
        };
      });
    }

    const parameters = selectors.split('.').filter(parameter => parameter !== '');

    return this.datasource
      .nodes()
        .then((nodes) => {
          let result = nodes.all;

          if (parameters.length === 1) {
            result = nodes.operations.deviceTypeFilter(result, parameters[0]);
          }

          return createQueryResult(result);
        });
  }

  process() {
    const nodes = this.query.match(/^[nN][oO][dD][eE][sS]((\.[\w]+)*)$/);

    if (nodes) {
      return this.nodes(nodes[1]);
    }
    return Promise.resolve([]);
  }

}

export {
  NetCrunchMetricFindQuery
};
