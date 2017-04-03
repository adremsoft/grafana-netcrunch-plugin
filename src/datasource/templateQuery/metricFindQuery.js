/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import { QueryParser } from './queryParser';

class NetCrunchMetricFindQuery {

  constructor(datasource, query) {
    this.datasource = datasource;
    this.query = query;
  }

  process() {
    const parsingResult = NetCrunchMetricFindQuery.parseQuery(this.query);

    if (parsingResult.completeParsed) {
      return Promise.all([this.datasource.nodes(), this.datasource.atlas()])
        .then((result) => {
          const
            atlas = result[1],
            allNodes = result[0].all,
            processingResult = NetCrunchMetricFindQuery.processQuery(parsingResult.tokens, atlas, allNodes);

          return NetCrunchMetricFindQuery.createQueryResult((processingResult.success) ? processingResult.nodes : []);
        });
    }

    return Promise.resolve(NetCrunchMetricFindQuery.createQueryResult([]));
  }

  static parseQuery(query) {
    const
      parsingResult = QueryParser.parse(query),
      result = {
        completeParsed: false,
        unparsedQuery: '',
        tokens: []
      };

    if (parsingResult != null) {
      result.completeParsed = (parsingResult.residuals === '');
      result.unparsedQuery = parsingResult.residuals;
      result.tokens = parsingResult.token.value;
    }

    return result;
  }

  static processQuery(tokens, atlas, nodes) {

    function getProcessingResult(success, nodeList) {
      return {
        success,
        nodes: nodeList
      };
    }

    function getNodeIdsForSubMap(map, subMapNamesSequence) {
      const result = [];
      let subMap;

      if (subMapNamesSequence.length === 0) {
        result.push(...map.allNodesId);
        result.success = true;
        return result;
      }

      /* eslint prefer-const: off */
      subMap = map.getChildMapByDisplayName(subMapNamesSequence.shift());
      if (subMap != null) {
        return getNodeIdsForSubMap(subMap, subMapNamesSequence);
      }
      /* eslint prefer-const: on */

      result.success = false;
      return result;
    }

    function filterNodesByIds(nodeList, nodeIds) {
      const
        nodesMap = new Map(),
        result = [];

      nodeList.forEach(node => nodesMap.set(node.id, node));
      nodeIds.forEach((nodeId) => {
        if (nodesMap.has(nodeId)) {
          result.push(nodesMap.get(nodeId));
        }
      });

      return result;
    }

    function filterNodesBySubMap(inputNodeList, map, subMapNamesSequence) {
      const nodeIds = getNodeIdsForSubMap(map, [].concat(subMapNamesSequence));
      let filteredNodes = [];

      if (nodeIds.success) {
        filteredNodes = filterNodesByIds(inputNodeList, nodeIds);
      }

      return getProcessingResult(
        nodeIds.success,
        filteredNodes
      );
    }

    function createNodesTokenProcessor(nodeList) {
      return () => getProcessingResult(true, nodeList);
    }

    function deviceTypeTokenProcessor(deviceType, nodeList) {
      return getProcessingResult(
        true,
        nodeList.filter(node => node.checkDeviceType(deviceType))
      );
    }

    function networkMapTokenProcessor(subMapNamesSequence, nodeList) {
      return filterNodesBySubMap(nodeList, atlas.atlasRoot, subMapNamesSequence);
    }

    const
      tokenProcessors = {
        nodes: createNodesTokenProcessor(nodes),
        deviceType: deviceTypeTokenProcessor,
        networkMap: networkMapTokenProcessor
      };
    let
      currentToken,
      processingSuccessful = true,
      processingResult,
      nodesForProcessing = [];

    while (processingSuccessful && (tokens.length > 0)) {
      currentToken = tokens.shift();
      processingResult = tokenProcessors[currentToken.type](currentToken.value, nodesForProcessing);
      processingSuccessful = processingResult.success;

      if (processingSuccessful) {
        nodesForProcessing = processingResult.nodes;
      }
    }

    return {
      success: processingSuccessful,
      nodes: nodesForProcessing
    };
  }

  static createQueryResult(nodes) {
    return (nodes || []).map((node) => {
      const ipAddress = (node.address != null) ? `(${node.address})` : '';
      return {
        text: `${node.name} ${ipAddress}`,
        value: node.id
      };
    });
  }

}

export {
  NetCrunchMetricFindQuery
};
