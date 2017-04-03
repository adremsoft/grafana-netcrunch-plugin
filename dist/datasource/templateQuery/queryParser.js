'use strict';System.register([],function(_export,_context){'use strict';var _createClass,PRIVATE_PROPERTIES,NULL_TOKEN_TYPE,Token,ReadResult,GenericTokenReaders,QueryTokenReaders,QueryParser;function _toConsumableArray(arr){if(Array.isArray(arr)){for(var i=0,arr2=Array(arr.length);i<arr.length;i++)arr2[i]=arr[i];return arr2}else{return Array.from(arr)}}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor))throw new TypeError('Cannot call a class as a function')}return{setters:[],execute:function(){_createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||!1,descriptor.configurable=!0,'value'in descriptor&&(descriptor.writable=!0),Object.defineProperty(target,descriptor.key,descriptor)}}return function(Constructor,protoProps,staticProps){return protoProps&&defineProperties(Constructor.prototype,protoProps),staticProps&&defineProperties(Constructor,staticProps),Constructor}}();PRIVATE_PROPERTIES={type:Symbol('type'),value:Symbol('value'),token:Symbol('token'),residuals:Symbol('residuals')};NULL_TOKEN_TYPE='NULL';Token=function(){function Token(a,b){_classCallCheck(this,Token),this[PRIVATE_PROPERTIES.type]=a,this[PRIVATE_PROPERTIES.value]=b}return _createClass(Token,[{key:'isNull',value:function isNull(){return this.type===NULL_TOKEN_TYPE}},{key:'removeNulls',value:function removeNulls(){this[PRIVATE_PROPERTIES.value]=[].concat(this.value).filter(function(a){return null!=a&&!a.isNull()})}},{key:'type',get:function get(){return this[PRIVATE_PROPERTIES.type]}},{key:'value',get:function get(){return this[PRIVATE_PROPERTIES.value]}}],[{key:'getToken',value:function getToken(a,b){return new Token(a,b)}},{key:'getNullToken',value:function getNullToken(){return Token.getToken(NULL_TOKEN_TYPE,null)}}]),Token}();ReadResult=function(){function ReadResult(a,b){_classCallCheck(this,ReadResult),this[PRIVATE_PROPERTIES.token]=a,this[PRIVATE_PROPERTIES.residuals]=b}return _createClass(ReadResult,[{key:'aggregateSubTokensValues',value:function aggregateSubTokensValues(){var a=0<arguments.length&&void 0!==arguments[0]&&arguments[0],b=void 0;null!=this.token&&(b=[].concat(this.token.value).reduce(function(c,d){return(a||!d.isNull())&&c.push.apply(c,_toConsumableArray([].concat(d.value))),c},[]),this[PRIVATE_PROPERTIES.token]=Token.getToken(this.token.type,b))}},{key:'mergeResult',value:function mergeResult(a,b){var c=void 0;null!=this.token&&null!=a&&null!=a.token&&(c=[].concat(this.token.value).concat(a.token.value),this[PRIVATE_PROPERTIES.token]=Token.getToken(this.token.type,c),this[PRIVATE_PROPERTIES.residuals]=null==b?a.residuals:b)}},{key:'token',get:function get(){return this[PRIVATE_PROPERTIES.token]}},{key:'residuals',get:function get(){return this[PRIVATE_PROPERTIES.residuals]}}],[{key:'getReadResultWithToken',value:function getReadResultWithToken(a,b){return new ReadResult(a,b)}},{key:'getNullReadResult',value:function getNullReadResult(a){return new ReadResult(Token.getNullToken(),a)}},{key:'getReadResult',value:function getReadResult(a,b,c){return new ReadResult(Token.getToken(a,b),c)}},{key:'getReadResultFromTokenRegExp',value:function getReadResultFromTokenRegExp(a,b){return null!=b&&3<=b.length?this.getReadResult(a,b[1],b[2]):null}}]),ReadResult}();GenericTokenReaders=function(){function GenericTokenReaders(){_classCallCheck(this,GenericTokenReaders)}return _createClass(GenericTokenReaders,null,[{key:'readToken',value:function readToken(a,b,c){var d=(c||'').match(new RegExp('^'+b+'(.*)$','i'));return ReadResult.getReadResultFromTokenRegExp(a,d)}},{key:'readSelectorToken',value:function readSelectorToken(a,b,c){var d='(?:'+b+')\\(((?:(?:\\\\\\(|\\\\\\))|[^()])+)\\)';return this.readToken(a,d,c)}},{key:'readRepetitiveToken',value:function readRepetitiveToken(a,b,c){for(var d=b(c),e=d;null!=d;)d=b(d.residuals),e.mergeResult(d);return null==e?null:ReadResult.getReadResult(a,e.token.value,e.residuals)}},{key:'readTokens',value:function readTokens(a,b,c){var d=[],e=void 0,f=c;return e=b(function(g){// eslint-disable-line prefer-const
var h=g(f);return null!=h&&(d.push(h.token),f=h.residuals,!0)}),e?ReadResult.getReadResult(a,d,f):null}},{key:'readTokenSequence',value:function readTokenSequence(a,b,c){return this.readTokens(a,function(e){return b.every(e)},c)}},{key:'readFirstOccurredToken',value:function readFirstOccurredToken(a,b,c){return this.readTokens(a,function(e){return b.some(e)},c)}},{key:'readTokensIfOccur',value:function readTokensIfOccur(a,b,c){return this.readTokens(a,function(e){var f=!1;return b.forEach(function(g,h,i){var j=e(g,h,i);j&&(f=!0)}),f},c)}},{key:'readNullToken',value:function readNullToken(a){return ReadResult.getNullReadResult(a)}}]),GenericTokenReaders}();QueryTokenReaders=function(){function QueryTokenReaders(){_classCallCheck(this,QueryTokenReaders)}return _createClass(QueryTokenReaders,null,[{key:'readNodes',value:function readNodes(a){return GenericTokenReaders.readToken('nodes','nodes()',a)}},{key:'readMonitoringPacks',value:function readMonitoringPacks(a){return GenericTokenReaders.readToken('monitoringPacks','\\.monitoringPacks()',a)}},{key:'readSelectorWithStringParameter',value:function readSelectorWithStringParameter(a,b,c){function d(j){var k=(j||'').replace(/\\\(/g,'(');return k=k.replace(/\\\)/g,')'),k=k.replace(/\\"/g,'"'),k}var e='(?:[\\w~`!@#$%^&*_+-=\\[\\]{};\':<>,\\.\\?\\/|]|\\\\"|\\\\\\(|\\\\\\)|\\\\)',f='"(\\s*'+e+'+(?:[\\s]'+e+'+)*\\s*)"',g=GenericTokenReaders.readSelectorToken('',b,c),h=void 0,i=void 0;return null!=g&&(h=GenericTokenReaders.readToken('',f,g.token.value),i=d(h.token.value)),null!=g&&null!=h?ReadResult.getReadResult(a,i,g.residuals):null}},{key:'readDot',value:function readDot(a){return GenericTokenReaders.readToken('dot','(\\.)',a)}},{key:'readDotSelectorWithStringParameter',value:function readDotSelectorWithStringParameter(a,b,c){var _this=this,d=GenericTokenReaders.readTokenSequence('',[this.readDot,function(e){return _this.readSelectorWithStringParameter('',b,e)}],c);return null==d?null:(d.aggregateSubTokensValues(),ReadResult.getReadResult(a,d.token.value[1],d.residuals))}},{key:'readNetworkAtlas',value:function readNetworkAtlas(a){return QueryTokenReaders.readDotSelectorWithStringParameter('networkAtlas','networkAtlas',a)}},{key:'readFolder',value:function readFolder(a){return QueryTokenReaders.readDotSelectorWithStringParameter('folder','folder',a)}},{key:'readRepetitiveFolder',value:function readRepetitiveFolder(a){var b=GenericTokenReaders.readRepetitiveToken('folders',QueryTokenReaders.readFolder,a);return b}},{key:'readView',value:function readView(a){return QueryTokenReaders.readDotSelectorWithStringParameter('view','view',a)}},{key:'readName',value:function readName(a){return QueryTokenReaders.readDotSelectorWithStringParameter('name','name',a)}},{key:'readDeviceType',value:function readDeviceType(a){return GenericTokenReaders.readToken('deviceType','\\.(windows\\.server|windows\\.workstation|windows|linux|bsd|macos|solaris|esx|xenserver|unix|novell|ibm)',a)}}]),QueryTokenReaders}();_export('QueryParser',QueryParser=function(){function QueryParser(){_classCallCheck(this,QueryParser)}return _createClass(QueryParser,null,[{key:'parse',value:function parse(a){var b={nodes:QueryTokenReaders.readNodes,// eslint-disable-line quote-props
'.monitoringPacks':QueryTokenReaders.readMonitoringPacks,'.networkAtlas':QueryTokenReaders.readNetworkAtlas,'.repetitiveFolder':QueryTokenReaders.readRepetitiveFolder,'.view':QueryTokenReaders.readView,'.name':QueryTokenReaders.readName,'.deviceType':QueryTokenReaders.readDeviceType,nothing:GenericTokenReaders.readNullToken// eslint-disable-line quote-props
},c={networkFoldersView:function networkFoldersView(d){var e=[b['.repetitiveFolder'],b['.view'],b.nothing],f=GenericTokenReaders.readTokensIfOccur('networkFoldersView',e,d);return null!=f&&f.aggregateSubTokensValues(),f},networkMap:function networkMap(d){var e=[b['.networkAtlas'],c.networkFoldersView],f=GenericTokenReaders.readTokenSequence('networkMap',e,d);return null!=f&&f.aggregateSubTokensValues(),f},monitoringPack:function monitoringPack(d){var e=[b['.monitoringPacks'],b['.repetitiveFolder'],b['.name']],f=GenericTokenReaders.readTokenSequence('monitoringPack',e,d);return null!=f&&f.aggregateSubTokensValues(),f},networkMapOrMonitoringPack:function networkMapOrMonitoringPack(d){var e=[c.networkMap,c.monitoringPack,b.nothing],f=GenericTokenReaders.readFirstOccurredToken('',e,d);return null==f?null:ReadResult.getReadResultWithToken(f.token.value[0],f.residuals)},query:function query(d){var e=[c.networkMapOrMonitoringPack,b['.deviceType'],b.nothing],f=b.nodes(d),g=void 0;return null!=f&&(f=ReadResult.getReadResult('query',[f.token],f.residuals),g=GenericTokenReaders.readTokensIfOccur('',e,f.residuals),f.mergeResult(g),f.token.removeNulls()),f}};return c.query(a)}}]),QueryParser}());_export('QueryParser',QueryParser)}}});
//# sourceMappingURL=queryParser.js.map
