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
    const tasks = NetCrunchMetricFindQuery.parseQuery(this.query);

    if (tasks.completeParsed) {
      return Promise.all([this.datasource.nodes(), this.datasource.atlas()])
        .then((result) => {
          const
            atlas = result[1],
            allNodes = result[0].all,
            tasksResult = NetCrunchMetricFindQuery.processQueryTasks(tasks, atlas, allNodes);

          return NetCrunchMetricFindQuery.createQueryResult((tasksResult.success) ? tasksResult.nodes : []);
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

    function getTask(taskName, taskParameter) {
      return {
        name: taskName,
        parameter: taskParameter
      };
    }

    function parseNodesFilterQuery(nodesFilterQuery) {
      const
        parsingExpressions = [
          { parseExpression: parseDeviceType, taskName: 'deviceTypeFilter' },
          { parseExpression: parseMap, taskName: 'mapFilter' },
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
            tasks.push(getTask(parsingExpression.taskName, parseResult.parameter));
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

  static processQueryTasks(tasks, atlas, nodes) {

    function getFilterResult(success, processedNodes, unprocessedTasks) {
      return {
        success,
        nodes: processedNodes,
        tasks: unprocessedTasks
      };
    }

    function deviceTypeFilter(tasksToProcess, nodesToFilter) {
      const currentTask = tasksToProcess.shift();
      return getFilterResult(
        true,
        nodesToFilter.filter(node => node.checkDeviceType(currentTask.parameter)),
        tasksToProcess
      );
    }

    function mapFilter(tasksToProcess, nodesToFilter) {
      const currentTask = tasksToProcess.shift();
      return getFilterResult(
        true,
        nodesToFilter,
        tasksToProcess
      );
    }

    function monitoringPackFilter(tasksToProcess, nodesToFilter) {
      const currentTask = tasksToProcess.shift();
      return getFilterResult(
        true,
        nodesToFilter,
        tasksToProcess
      );
    }

    const
      filters = { deviceTypeFilter, mapFilter, monitoringPackFilter };
    let
      processingSucceed = true,
      processedTasks = tasks,
      processedNodes = nodes,
      processingResult;

    while (processingSucceed && (processedTasks.length > 0)) {
      processingResult = filters[tasks[0].name](processedTasks, processedNodes, atlas);
      processingSucceed = processingResult.success;
      processedTasks = processingResult.tasks;

      if (processingSucceed) {
        processedNodes = processingResult.nodes;
      }
    }

    return {
      success: processingSucceed,
      nodes: processedNodes
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
