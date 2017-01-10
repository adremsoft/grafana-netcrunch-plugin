'use strict';System.register(['moment'],function(_export,_context){'use strict';var moment,NETCRUNCH_TREND_DATA_CONST;function _defineProperty(obj,key,value){return key in obj?Object.defineProperty(obj,key,{value:value,enumerable:!0,configurable:!0,writable:!0}):obj[key]=value,obj}function NetCrunchTrendData(a){var _o;function b(t){return o[t]}function c(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:null,u=r.DEFAULT;if(null!=t){var v=parseInt(t,10);!isNaN(t)&&t>=r.MIN&&t<=r.MAX&&(u=v)}return u}function d(t,u){var v=void 0,w=void 0;// period: minutes, hours, days, months
return u=u.toUpperCase(),'MINUTES'===u?(v=t.minute()%5,w=t.subtract(v,'minutes')):('HOURS'===u?u='hour':'DAYS'===u?u='day':'MONTHS'==u&&(u='month'),w=t.startOf(u)),w.startOf('minute')}function e(t,u,v){return t=moment(t).subtract(v.periodInterval,v.periodName),u=moment(u).add(v.periodInterval,v.periodName),u>moment()&&(u=moment()),{from:d(t,v.periodName),to:u,periodInterval:v.periodInterval,periodType:v.periodType,periodName:v.periodName}}function f(t,u){var v={periodType:n.tpMinutes,periodName:b(n.tpMinutes),periodInterval:1};return e(t,u,v)}function g(t,u,v){var w=60000,x=60*w,y=24*x,z=30*y,A=+(u-t),B=[{length:w,type:n.tpMinutes,interval:1},{length:5*w,type:n.tpMinutes,interval:5},{length:10*w,type:n.tpMinutes,interval:10},{length:15*w,type:n.tpMinutes,interval:15},{length:20*w,type:n.tpMinutes,interval:20},{length:30*w,type:n.tpMinutes,interval:30},{length:x,type:n.tpHours,interval:1},{length:2*x,type:n.tpHours,interval:2},{length:3*x,type:n.tpHours,interval:3},{length:4*x,type:n.tpHours,interval:4},{length:6*x,type:n.tpHours,interval:6},{length:8*x,type:n.tpHours,interval:8},{length:y,type:n.tpDays,interval:1},{length:7*y,type:n.tpDays,interval:7},{length:z,type:n.tpMonths,interval:1},{length:3*z,type:n.tpMonths,interval:3},{length:6*z,type:n.tpMonths,interval:6},{length:9*z,type:n.tpMonths,interval:9},{length:12*z,type:n.tpMonths,interval:12},{length:15*z,type:n.tpMonths,interval:15},{length:18*z,type:n.tpMonths,interval:18},{length:21*z,type:n.tpMonths,interval:21},{length:24*z,type:n.tpMonths,interval:24}],C=0;return B.some(function(D,E){return!!(D.length*v>A)&&(C=E,!0)}),{periodType:B[C].type,periodName:b(B[C].type),periodInterval:B[C].interval}}function h(t,u,v){var w=g(t,u,v);return e(t,u,w)}function j(t){var u=Object.keys(t).filter(function(v){return!0===t[v]&&null!=p[v]});return u=u.map(function(v){return p[v]}),{ResultMask:[u]}}function k(t,u,v,w){var x=[],y=b(u),z=void 0,A=void 0;for(t=moment(t).startOf('minute'),A=0;A<w;A+=1)z=moment(t).add(A*v,y),x.push(z.toDate());return x}function l(t,u){var v=Object.create(null),w=void 0;return u=u.ResultMask[0],w=q.filter(function(x){return 0<=u.indexOf(p[x])}),w.forEach(function(x){v[x]=[]}),t.trend.forEach(function(x){!0===Array.isArray(x)?x.forEach(function(y,z){v[w[z]].push(y)}):v[w[0]].push(x)}),null!=t.distr&&(v.distr=t.distr),v}function m(t,u,v,w){var x=4<arguments.length&&void 0!==arguments[4]?arguments[4]:n.tpHours,y=5<arguments.length&&void 0!==arguments[5]?arguments[5]:1,z=arguments[6];return null==t||null==u?Promise.resolve(null):(z=null==z?j({avg:!0}):j(z),0===z.ResultMask[0].length&&(z=j({avg:!0})),a.queryTrendData(t.toString(),u,x,y,v,w,z,null,// day mask just no mask
null,// value for equal checking
null).then(function(A){// eslint-disable-line
return{domain:k(v,x,y,A.trend.length),values:l(A,z)}}))}var n=NETCRUNCH_TREND_DATA_CONST.PERIOD_TYPE,o=(_o={},_defineProperty(_o,n.tpMinutes,'minutes'),_defineProperty(_o,n.tpHours,'hours'),_defineProperty(_o,n.tpDays,'days'),_defineProperty(_o,n.tpMonths,'months'),_o),p=NETCRUNCH_TREND_DATA_CONST.QUERY_RESULT_MASKS,q=NETCRUNCH_TREND_DATA_CONST.QUERY_RESULT_ORDER,r=NETCRUNCH_TREND_DATA_CONST.MAX_SAMPLE_COUNT,s={periodInterval:2,periodName:o[n.tpDays]};return{MAX_SAMPLE_COUNT:r,prepareTimeRange:function prepareTimeRange(u,v,w){var x=3<arguments.length&&void 0!==arguments[3]?arguments[3]:null,y=null;return x=c(x),y=!0===w?moment(v).subtract(s.periodInterval,s.periodName)<=u?{result:f(u,v)}:{error:{periodInterval:s.periodInterval,periodName:s.periodName}}:{result:h(u,v,x)},y},getCounterTrendData:m,getCounterTrendRAWData:function getCounterTrendRAWData(u,v,w,x,y){return m(u,v,w,x,n.tpMinutes,1,y)},getCounterData:function getCounterData(u,v,w,x,y,z,A){var B=Object.create(null);return x=x||moment(),y=y||r.DEFAULT,A=A||g(w,x,y),B.period=A,B.data=m(u,v,w,x,A.periodType,A.periodInterval,z),B},grafanaDataConverter:function grafanaDataConverter(u){return u.domain.map(function(v,w){return[u.values[w],v.getTime()]})}}}return{setters:[function(_moment){moment=_moment.default}],execute:function(){_export('NETCRUNCH_TREND_DATA_CONST',NETCRUNCH_TREND_DATA_CONST={MAX_SAMPLE_COUNT:{MIN:10,DEFAULT:200,MAX:5e3},PERIOD_TYPE:{tpMinutes:0,tpHours:1,tpDays:2,tpMonths:3},QUERY_RESULT_MASKS:{min:'tqrMin',avg:'tqrAvg',max:'tqrMax',avail:'tqrAvail',delta:'tqrDelta',equal:'tqrEqual',distr:'tqrDistr'},QUERY_RESULT_ORDER:['avg','min','max','avail','delta','equal']});_export('NETCRUNCH_TREND_DATA_CONST',NETCRUNCH_TREND_DATA_CONST);_export('NetCrunchTrendData',NetCrunchTrendData)}}});
//# sourceMappingURL=trendData.js.map
