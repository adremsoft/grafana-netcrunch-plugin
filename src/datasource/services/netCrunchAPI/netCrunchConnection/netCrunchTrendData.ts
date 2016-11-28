/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import moment from 'moment';

const NETCRUNCH_TREND_DATA_CONST = {

  MAX_SAMPLE_COUNT : {
    MIN: 10,
    DEFAULT: 200,
    MAX: 5000
  },

  PERIOD_TYPE : {
    tpMinutes : 0,
    tpHours : 1,
    tpDays : 2,
    tpMonths : 3
  },

  QUERY_RESULT_MASKS : {
    min : 'tqrMin',
    avg : 'tqrAvg',
    max : 'tqrMax',
    avail : 'tqrAvail',
    delta : 'tqrDelta',
    equal : 'tqrEqual',
    distr : 'tqrDistr'
  },

  QUERY_RESULT_ORDER : ['avg', 'min', 'max', 'avail', 'delta', 'equal']
};

function NetCrunchTrendData(netCrunchConnection) {
  const
    PERIOD_TYPE = NETCRUNCH_TREND_DATA_CONST.PERIOD_TYPE,
    QUERY_RESULT_MASKS = NETCRUNCH_TREND_DATA_CONST.QUERY_RESULT_MASKS,
    QUERY_RESULT_ORDER = NETCRUNCH_TREND_DATA_CONST.QUERY_RESULT_ORDER,
    MAX_SAMPLE_COUNT = NETCRUNCH_TREND_DATA_CONST.MAX_SAMPLE_COUNT;

  function calculateChartDataInterval (dateStart, dateEnd, maxSampleCount) {
    let min = 60 * 1000,
        hour = 60 * min,
        day = 24 * hour,
        month = 30 * day,
        dateRange = Number(dateEnd - dateStart),
        periodIndex,

        periods = [
          { length: min, type: PERIOD_TYPE.tpMinutes, interval: 1 },
          { length: 5 * min, type: PERIOD_TYPE.tpMinutes, interval: 5 },
          { length: 10 * min, type: PERIOD_TYPE.tpMinutes, interval: 10 },
          { length: 15 * min, type: PERIOD_TYPE.tpMinutes, interval: 15 },
          { length: 20 * min, type: PERIOD_TYPE.tpMinutes, interval: 20 },
          { length: 30 * min, type: PERIOD_TYPE.tpMinutes, interval: 30 },
          { length: hour, type: PERIOD_TYPE.tpHours, interval: 1 },
          { length: 2 * hour, type: PERIOD_TYPE.tpHours, interval: 2 },
          { length: 3 * hour, type: PERIOD_TYPE.tpHours, interval: 3 },
          { length: 4 * hour, type: PERIOD_TYPE.tpHours, interval: 4 },
          { length: 6 * hour, type: PERIOD_TYPE.tpHours, interval: 6 },
          { length: 8 * hour, type: PERIOD_TYPE.tpHours, interval: 8 },
          { length: day, type: PERIOD_TYPE.tpDays, interval: 1 },
          { length: 7 * day, type: PERIOD_TYPE.tpDays, interval: 7 },
          { length: month, type: PERIOD_TYPE.tpMonths, interval: 1 },
          { length: 3 * month, type: PERIOD_TYPE.tpMonths, interval: 3 },
          { length: 6 * month, type: PERIOD_TYPE.tpMonths, interval: 6 },
          { length: 9 * month, type: PERIOD_TYPE.tpMonths, interval: 9 },
          { length: 12 * month, type: PERIOD_TYPE.tpMonths, interval: 12 },
          { length: 15 * month, type: PERIOD_TYPE.tpMonths, interval: 15 },
          { length: 18 * month, type: PERIOD_TYPE.tpMonths, interval: 18 },
          { length: 21 * month, type: PERIOD_TYPE.tpMonths, interval: 21 },
          { length: 24 * month, type: PERIOD_TYPE.tpMonths, interval: 24 }
        ];

    periodIndex=0;

    periods.some((period, index) => {
      if ((period.length * maxSampleCount) > dateRange) {
        periodIndex=index;
        return true;
      } else {
        return false;
      }
    });

    return {
      periodType: periods[periodIndex].type,
      periodInterval: periods[periodIndex].interval
    };
  }

  function calculateTimeDomain (dateFrom, periodType, periodInterval, intervalCount) {
    let timeDomain = [],
        timeCalculator = Object.create(null),
        timeDomainElement,
        i;

    timeCalculator[PERIOD_TYPE.tpMinutes] = 'minutes';
    timeCalculator[PERIOD_TYPE.tpHours] = 'hours';
    timeCalculator[PERIOD_TYPE.tpDays] = 'days';
    timeCalculator[PERIOD_TYPE.tpMonths] = 'months';

    dateFrom = moment(dateFrom).startOf('minute');
    for (i=0; i < intervalCount; i += 1) {
        timeDomainElement = moment(dateFrom).add(i * periodInterval, timeCalculator[periodType]);
        timeDomain.push(timeDomainElement.toDate());
    }

    return timeDomain;
  }

  function prepareResultMask (series) {
    let resultMask;

    resultMask = Object.keys(series).filter((seriesKey) => {
      return ((series[seriesKey] === true) && (QUERY_RESULT_MASKS[seriesKey] != null));
    });

    resultMask = resultMask.map((seriesKey) => {
      return QUERY_RESULT_MASKS[seriesKey];
    });

    return { ResultMask: [resultMask] };
  }

  function convertResultData(result, resultType) {
    let resultSeries,
        convertedData = Object.create(null);

    resultType = resultType.ResultMask[0];
    resultSeries = QUERY_RESULT_ORDER.filter((seriesType) => {
      return (resultType.indexOf(QUERY_RESULT_MASKS[seriesType]) >= 0);
    });
    resultSeries.forEach((seriesName) => {
      convertedData[seriesName] = [];
    });

    result.trend.forEach((data) => {
      if (Array.isArray(data) === true) {
        data.forEach((value, $index) => {
          convertedData[resultSeries[$index]].push(value);
        });
      } else {
        convertedData[resultSeries[0]].push(data);
      }
    });

    if (result.distr != null) {
      convertedData.distr = result.distr;
    }

    return convertedData;
  }

  function getCounterTrendData (nodeID, counter, dateFrom, dateTo, periodType = PERIOD_TYPE.tpHours,
                                periodInterval = 1, resultType) {

    //resultType possible values are :
    //    [ tqrAvg, tqrMin, tqrMax, tqrAvail, tqrDelta, tqrEqual, tqrDistr ]
    //Default tqrAvg is used : {ResultMask : [['tqrAvg']]}

    if ((nodeID == null) || (counter == null)) {
      return Promise.resolve(null);
    }

    resultType = (resultType == null) ? prepareResultMask({avg : true}) : prepareResultMask(resultType);
    if (resultType.ResultMask[0].length === 0) {
      resultType = prepareResultMask({avg : true});
    }

    return netCrunchConnection.queryTrendData(nodeID.toString(), counter, periodType, periodInterval,
                                              dateFrom, dateTo,
                                              resultType,
                                              null, // day mask just no mask
                                              null, // value for equal checking
                                              null)
      .then((data) => {
        return {
          domain : calculateTimeDomain(dateFrom, periodType, periodInterval, data.trend.length),
          values : convertResultData(data, resultType)};
      });
  }

  function getCounterTrendRAWData (nodeID, counter, dateFrom, dateTo, resultType){
    return getCounterTrendData(nodeID, counter, dateFrom, dateTo, PERIOD_TYPE.tpMinutes, 1, resultType);
  }

  function getCounterTrendMinutesData (nodeID, counter, dateFrom, dateTo, periodInterval, resultType){
    return getCounterTrendData(nodeID, counter, dateFrom, dateTo, PERIOD_TYPE.tpMinutes, periodInterval, resultType);
  }

  function getCounterTrendHoursData (nodeID, counter, dateFrom, dateTo, periodInterval, resultType){
    return getCounterTrendData(nodeID, counter, dateFrom, dateTo, PERIOD_TYPE.tpHours, periodInterval, resultType);
  }

  function getCounterTrendDaysData (nodeID, counter, dateFrom, dateTo, periodInterval, resultType){
    return getCounterTrendData(nodeID, counter, dateFrom, dateTo, PERIOD_TYPE.tpDays, periodInterval, resultType);
  }

  function getCounterTrendMonthsData (nodeID, counter, dateFrom, dateTo, periodInterval, resultType){
    return getCounterTrendData(nodeID, counter, dateFrom, dateTo, PERIOD_TYPE.tpMonths, periodInterval, resultType);
  }

  function getCounterData (nodeID, counterName, dateStart, dateEnd, maxSampleCount, resultType, period) {
    let counterTrends = Object.create(null),
        result = Object.create(null);

    dateEnd = dateEnd || moment();
    maxSampleCount = maxSampleCount || MAX_SAMPLE_COUNT.DEFAULT;
    period = period || calculateChartDataInterval(dateStart, dateEnd, maxSampleCount);

    counterTrends[PERIOD_TYPE.tpMinutes] = getCounterTrendMinutesData;
    counterTrends[PERIOD_TYPE.tpHours] = getCounterTrendHoursData;
    counterTrends[PERIOD_TYPE.tpDays] = getCounterTrendDaysData;
    counterTrends[PERIOD_TYPE.tpMonths] = getCounterTrendMonthsData;

    result.period = period;
    result.data = counterTrends[period.periodType](nodeID, counterName, dateStart, dateEnd,
                                                   period.periodInterval, resultType);
    return result;
  }

  function grafanaDataConverter (data) {
    return data.domain.map((time, $index) => {
      return [data.values[$index], time.getTime()];
    });
  }

  return {
    PERIOD_TYPE : PERIOD_TYPE,
    QUERY_RESULT_MASKS : QUERY_RESULT_MASKS,
    MAX_SAMPLE_COUNT : MAX_SAMPLE_COUNT,
    calculateChartDataInterval : calculateChartDataInterval,
    calculateTimeDomain : calculateTimeDomain,
    prepareResultMask : prepareResultMask,
    getCounterTrendData : getCounterTrendData,
    getCounterTrendRAWData : getCounterTrendRAWData,
    getCounterTrendMinutesData : getCounterTrendMinutesData,
    getCounterTrendHoursData : getCounterTrendHoursData,
    getCounterTrendDaysData : getCounterTrendDaysData,
    getCounterTrendMonthsData : getCounterTrendMonthsData,
    getCounterData: getCounterData,
    grafanaDataConverter: grafanaDataConverter
  };
}

export {
  NETCRUNCH_TREND_DATA_CONST as NETCRUNCH_TREND_DATA_CONST,
  NetCrunchTrendData as NetCrunchTrendData
}
