'use strict';System.register(['./nodesOperations'],function(_export,_context){'use strict';var NetCrunchNodesOperations,_createClass,PRIVATE_PROPERTIES,NetCrunchNodes;function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor))throw new TypeError('Cannot call a class as a function')}return{setters:[function(_nodesOperations){NetCrunchNodesOperations=_nodesOperations.NetCrunchNodesOperations}],execute:function(){_createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||!1,descriptor.configurable=!0,'value'in descriptor&&(descriptor.writable=!0),Object.defineProperty(target,descriptor.key,descriptor)}}return function(Constructor,protoProps,staticProps){return protoProps&&defineProperties(Constructor.prototype,protoProps),staticProps&&defineProperties(Constructor,staticProps),Constructor}}();PRIVATE_PROPERTIES={map:Symbol('map'),array:Symbol('array')};_export('NetCrunchNodes',NetCrunchNodes=function(){function NetCrunchNodes(){_classCallCheck(this,NetCrunchNodes),this[PRIVATE_PROPERTIES.map]=new Map,this[PRIVATE_PROPERTIES.array]=[]}return _createClass(NetCrunchNodes,[{key:'add',value:function add(a){this[PRIVATE_PROPERTIES.map].set(a.id,a),this[PRIVATE_PROPERTIES.array].push(a)}},{key:'mapNodes',value:function mapNodes(){var _this=this,a=0<arguments.length&&void 0!==arguments[0]?arguments[0]:null;if(null!=a){var b=[];return a.allNodesId.forEach(function(c){_this[PRIVATE_PROPERTIES.map].has(c)&&b.push(_this[PRIVATE_PROPERTIES.map].get(c))}),b}return this[PRIVATE_PROPERTIES.array]}},{key:'getAllNodes',value:function getAllNodes(){return this[PRIVATE_PROPERTIES.array]}},{key:'getNodeById',value:function getNodeById(a){return this[PRIVATE_PROPERTIES.map].get(a)}},{key:'operations',get:function get(){// eslint-disable-line
return NetCrunchNodesOperations}}]),NetCrunchNodes}());_export('NetCrunchNodes',NetCrunchNodes)}}});
//# sourceMappingURL=networkNodes.js.map
