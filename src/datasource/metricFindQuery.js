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

  process() {
    const queryElements = NetCrunchMetricFindQuery.parseQuery(this.query);
    if (queryElements.completeParsed) {
      return Promise.all([this.datasource.nodes(), this.datasource.atlas()])
        .then((result) => {
          const
            atlas = result[1],
            allNodes = result[0].all,
            processingResult = NetCrunchMetricFindQuery.processQueryElements(queryElements, atlas, allNodes);

          return NetCrunchMetricFindQuery.createQueryResult((processingResult.success) ? processingResult.nodes : []);
        });
    }

    return Promise.resolve(NetCrunchMetricFindQuery.createQueryResult([]));
  }

  static parseQuery(query) {
    const
      namePattern = '\\s*[\\w]+(?:[\\s][\\w]+)*\\s*';

    function getParseResult(result) {
      if (result != null) {
        return {
          parameter: result[1],
          queryRest: result[2]
        };
      }
      return null;
    }

    function parseNodes(nodesQuery) {
      return getParseResult((nodesQuery || '').match(/^(nodes)(.*)$/i));
    }

    function parseDeviceType(deviceTypeItemQuery) {
      const
        deviceTypes = 'windows\\.server|windows\\.workstation|windows|linux|bsd|macos|solaris|esx|xenserver' +
                      '|unix|novell|ibm',
        result = (deviceTypeItemQuery || '').match(new RegExp(`^\\.(${deviceTypes})(.*)$`, 'i'));
      return getParseResult(result);
    }

    function parseMap(mapItemQuery) {
      const
        mapPattern = `\\.(?:map)\\("(${namePattern})"\\)`,
        result = (mapItemQuery || '').match(new RegExp(`^${mapPattern}(.*)$`, 'i'));

      return getParseResult(result);
    }

    function parseMonitoringPack(monitoringPackItemQuery) {
      const
        monitoringPackPattern = `\\.(?:monitoringPack)\\("(${namePattern})"\\)`,
        result = (monitoringPackItemQuery || '').match(new RegExp(`^${monitoringPackPattern}(.*)$`, 'i'));

      return getParseResult(result);
    }

    function getQueryTask(taskName, taskParameter) {
      return {
        name: taskName,
        parameter: taskParameter
      };
    }

    function parseNodesFilterQuery(nodesFilterQuery) {
      const
        parsingExpressions = [
          { parseExpression: parseDeviceType, taskName: 'deviceType' },
          { parseExpression: parseMap, taskName: 'atlasMap' },
          { parseExpression: parseMonitoringPack, taskName: 'monitoringPackFilter' }
        ],
        tasks = [];
      let
        queryToParse,
        parsingSuccessful;

      queryToParse = nodesFilterQuery;
      parsingSuccessful = true;
      while ((queryToParse !== '') && (parsingSuccessful)) {
        parsingSuccessful = parsingExpressions.some((parsingExpression) => {    // eslint-disable-line no-loop-func
          const parseResult = parsingExpression.parseExpression(queryToParse);
          if (parseResult != null) {
            tasks.push(getQueryTask(parsingExpression.taskName, parseResult.parameter));
            queryToParse = parseResult.queryRest;
            return true;
          }
          return false;
        });
      }

      tasks.completeParsed = parsingSuccessful;
      tasks.unparsedQuery = queryToParse;
      return tasks;
    }

    let parseResult = parseNodes(query);

    if (parseResult != null) {
      return parseNodesFilterQuery(parseResult.queryRest);
    }
    parseResult = [];
    parseResult.completeParsed = false;
    parseResult.unparsedQuery = query;

    return parseResult;
  }

  static processQueryElements(queryElements, atlas, nodes) {

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

    function processDeviceTypeElement(deviceType, nodeList) {
      return getProcessingResult(
        true,
        nodeList.filter(node => node.checkDeviceType(deviceType))
      );
    }

    function processAtlasMapElement(subMapNamesSequence, nodeList) {
      return filterNodesBySubMap(nodeList, atlas.atlasRoot, subMapNamesSequence);
    }

    const
      elementProcessingMethods = {
        deviceType: processDeviceTypeElement,
        atlasMap: processAtlasMapElement
      };
    let
      currentElement,
      processingSuccessful = true,
      processingResult,
      nodesForProcessing = nodes;

    while (processingSuccessful && (queryElements.length > 0)) {
      currentElement = queryElements.shift();
      processingResult = elementProcessingMethods[currentElement.name](currentElement.parameter, nodesForProcessing);
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
