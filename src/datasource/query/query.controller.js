/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import '../css/query.editor.css!';            // eslint-disable-line
import '../directives/nc-spinner.directive';
import { QueryCtrl } from 'app/plugins/sdk';  // eslint-disable-line
import { datasourceURL } from '../common';

const
  PRIVATE_PROPERTIES = {
    uiSegmentSrv: Symbol('uiSegmentSrv'),
    templateSrv: Symbol('templateSrv'),
    scope: Symbol('scope'),
    nodeMap: Symbol('nodeMap'),
    nodeSegment: Symbol('nodeSegment'),
    nodeSpinner: Symbol('nodeSpinner'),
    counterName: Symbol('counterName'),
    counterSpinner: Symbol('counterSpinner'),
    counters: Symbol('counters')
  },
  DEFAULT_NODE_NAME = 'Select node',
  DEFAULT_COUNTER_DISPLAY_NAME = 'Select counter',
  COUNTERS_SUBMENU_LENGTH = 25;

class NetCrunchQueryController extends QueryCtrl {

  constructor(uiSegmentSrv, templateSrv, $scope) {
    super();

    this[PRIVATE_PROPERTIES.uiSegmentSrv] = uiSegmentSrv;
    this[PRIVATE_PROPERTIES.templateSrv] = templateSrv;
    this[PRIVATE_PROPERTIES.scope] = $scope;
    this[PRIVATE_PROPERTIES.nodeMap] = new Map();
    this[PRIVATE_PROPERTIES.nodeSegment] = this.createDefaultNodeSegment(DEFAULT_NODE_NAME);
    this[PRIVATE_PROPERTIES.nodeSpinner] = false;
    this[PRIVATE_PROPERTIES.counterName] = null;
    this[PRIVATE_PROPERTIES.counterSpinner] = false;
    this[PRIVATE_PROPERTIES.counters] = [];

    this.localVars = Object.create(null);

    this.processingNode = true;
    this.nodeReady = false;
    this.datasource.nodes().then(() => {
      this.processingNode = false;
      this.updateView();
      if (this.target.nodeID != null) {
        this.nodeChanged(this.target.nodeID);
      }
    });

    this.processingCounter = true;
    this.counterReady = false;

    this.showOptions = (this.showOptions == null) ? false : this.showOptions;

    this.target.alias = this.target.alias || '';
    this.target.series = this.target.series || { min: false, avg: true, max: false };
  }

  get localVars() {
    return this.target.localVars;
  }

  set localVars(value) {
    this.target.localVars = value;
  }

  get processingNode() {
    return this.localVars.processingNode;
  }

  set processingNode(value) {
    this.localVars.processingNode = value;
  }

  get nodeSpinner() {
    return this[PRIVATE_PROPERTIES.nodeSpinner];
  }

  get nodeSegment() {
    return this[PRIVATE_PROPERTIES.nodeSegment];
  }

  get nodeReady() {
    return this.localVars.nodeReady;
  }

  set nodeReady(value) {
    this.localVars.nodeReady = value;
  }

  get processingCounter() {
    return this.localVars.processingCounter;
  }

  set processingCounter(value) {
    this.localVars.processingCounter = value;
  }

  get defaultCounterName() {              // eslint-disable-line
    return DEFAULT_COUNTER_DISPLAY_NAME;
  }

  get counterSpinner() {
    return this[PRIVATE_PROPERTIES.counterSpinner];
  }

  get counterReady() {
    return this.localVars.counterReady;
  }

  set counterReady(value) {
    this.localVars.counterReady = value;
  }

  get counterName() {
    return this[PRIVATE_PROPERTIES.counterName];
  }

  get counters() {
    return this[PRIVATE_PROPERTIES.counters];
  }

  get counterDataComplete() {
    return this.target.counterDataComplete;
  }

  set counterDataComplete(value) {
    this.target.counterDataComplete = value;
  }

  get alias() {
    return this.target.alias;
  }

  set alias(value) {
    this.target.alias = value;
  }

  get rawData() {
    return this.panel.scopedVars.rawData;
  }

  get series() {
    return this.target.series;
  }

  get showOptions() {
    return this.localVars.showOptions;
  }

  set showOptions(value) {
    this.localVars.showOptions = value;
  }

  createDefaultNodeSegment(segmentName) {
    const segment = {
      cssClass: 'nc-reset-segment',
      fake: true,
      type: 'value',
      html: `<div class="nc-default-tile">${segmentName}</div>`,
      value: segmentName
    };
    return this[PRIVATE_PROPERTIES.uiSegmentSrv].newSegment(segment);
  }

  createNodeSegment(node) {

    const nodeSegmentTemplate = `
      <div class="nc-node-tile">
        <img class="nc-node-icon" src=${node.iconUrl}>
        <div class="nc-node-description">
          <span class="nc-node-name">${node.name}</span>
          <span class="nc-node-address">${node.address}</span>
        </div>
      </div>
    `;

    return this[PRIVATE_PROPERTIES.uiSegmentSrv].newSegment({
      cssClass: 'nc-reset-segment',
      fake: true,
      type: 'value',
      html: nodeSegmentTemplate,
      value: NetCrunchQueryController.nodeDisplayValue(node)
    });
  }

  createVariableSegment(variableName) {
    return this[PRIVATE_PROPERTIES.uiSegmentSrv].newSegment({
      cssClass: 'nc-reset-segment',
      expandable: true,
      fake: true,
      type: 'template',
      html: `<div class="nc-default-tile">$${variableName}</div>`,
      value: `$${variableName}`
    });
  }

  targetChanged() {
    this.refresh();
  }

  nodeSpinnerChanged(state) {
    this[PRIVATE_PROPERTIES.nodeSpinner] = state;
  }

  counterSpinnerChanged(state) {
    this[PRIVATE_PROPERTIES.counterSpinner] = state;
  }

  updateView() {
    this[PRIVATE_PROPERTIES.scope].$apply();
  }

  getNodes() {
    const self = this;

    function createVariableSegments() {
      const variableSegments = [];

      self[PRIVATE_PROPERTIES.templateSrv].variables
        .filter(variable => (variable.datasource === self.datasource.name))
        .filter(variable => (variable.query.match(/^[nN][oO][dD][eE][sS].*/)))
        .sort((variable1, variable2) => variable1.name.toLocaleString(variable2.name))
        .forEach(variable => variableSegments.push(self.createVariableSegment(variable.name)));

      return variableSegments;
    }

    function createNodeSegments(nodes) {
      self[PRIVATE_PROPERTIES.nodeMap].clear();
      return nodes.map((node) => {
        const nodeSegment = self.createNodeSegment(node);
        self[PRIVATE_PROPERTIES.nodeMap].set(nodeSegment.value, node);
        return nodeSegment;
      });
    }

    return this.datasource
      .nodes().then(nodes => []
        .concat(createVariableSegments())
        .concat(createNodeSegments(nodes.all)));
  }

  nodeChanged(nodeId = null) {
    const self = this;

    function isNodeTemplate(nodeId) {            // eslint-disable-line
      return ((!Number.isInteger(nodeId)) && nodeId.match(/^\$\w*$/));
    }

    function nodeNotReady() {
      self.nodeReady = false;
      self.processingCounter = true;
      self.counterReady = false;
      self.counterDataComplete = false;
    }

    function getCounters(nodeId) {        // eslint-disable-line
      return self.datasource
        .getCounters(nodeId)
          .then((countersByMonitors) => {
            const countersMenu = [];

            Object.keys(countersByMonitors).forEach((monitorId) => {
              if (monitorId > 0) {
                const
                  subMenu = countersByMonitors[monitorId]
                    .counters.map(counter => ({
                      text: counter.displayName,
                      value: counter.name
                    })),
                  subMenuPartsCount = Math.ceil(subMenu.length / COUNTERS_SUBMENU_LENGTH);

                for (let i = 0; i < subMenuPartsCount; i += 1) {
                  const
                    startIndex = i * COUNTERS_SUBMENU_LENGTH,
                    stopIndex = Math.min((i + 1) * COUNTERS_SUBMENU_LENGTH, subMenu.length),
                    subMenuNameExtension = (subMenuPartsCount > 1) ? ` [${startIndex + 1}..${stopIndex}]` : '',
                    subMenuName = `${countersByMonitors[monitorId].name}${subMenuNameExtension}`;

                  countersMenu.push({
                    text: subMenuName,
                    submenu: subMenu.slice(startIndex, stopIndex)
                  });
                }
              }
            });

            return {
              countersMenu,
              countersTable: countersByMonitors.table
            };
          });
    }

    function setNodeSegment(nodeId) {            // eslint-disable-line

      if (isNodeTemplate(nodeId)) {
        return Promise.resolve(() => {
          Object.assign(self[PRIVATE_PROPERTIES.nodeSegment], self.createVariableSegment(nodeId));
          self.updateView();
        });
      }

      return self.datasource
        .nodes().then((nodes) => {
          const node = nodes.all.find(nodeItem => (nodeItem.id === nodeId));
          Object.assign(self[PRIVATE_PROPERTIES.nodeSegment], self.createNodeSegment(node));
          self.updateView();
        });
    }

    function setCountersMenu(countersMenu) {
      self.hideCounters = true;
      self.updateView();
      self[PRIVATE_PROPERTIES.counters] = countersMenu;
      self.processingCounter = false;
      self.hideCounters = false;
    }

    function updateSelectedCounter(counterName) {
      self[PRIVATE_PROPERTIES.counterName] = counterName;
      self.counterReady = true;
      self.counterDataComplete = true;
      self.targetChanged();
    }

    function getSelectedNode(nodeId) {           // eslint-disable-line

      if (nodeId != null) {
        if (isNodeTemplate(nodeId)) {
          return Promise.resolve(nodeId);
        }
        return self.datasource
          .nodes()
          .then(nodes => ((nodes.all.some(node => (nodeId === node.id))) ? nodeId : null));
      } else if (isNodeTemplate(self.nodeSegment.value)) {
        return Promise.resolve(self.nodeSegment.value);
      } else if (self[PRIVATE_PROPERTIES.nodeMap].has(self.nodeSegment.value)) {
        return Promise.resolve(self[PRIVATE_PROPERTIES.nodeMap].get(self.nodeSegment.value).id);
      }

      return Promise.resolve(null);
    }

    getSelectedNode(nodeId).then((selectedNodeId) => {
      this.target.nodeID = selectedNodeId;

      if (selectedNodeId == null) {
        nodeNotReady();
        Object.assign(this[PRIVATE_PROPERTIES.nodeSegment], this.createDefaultNodeSegment(DEFAULT_NODE_NAME));
        this.targetChanged();
      } else {
        const nodeSegmentReady = (nodeId != null) ? setNodeSegment(nodeId) : Promise.resolve();

        this.nodeReady = true;
        this.processingCounter = true;
        this.counterReady = false;
        this.updateView();

        nodeSegmentReady
          .then(() => getCounters(selectedNodeId))
          .then((counters) => {
            setCountersMenu(counters.countersMenu);
            if (counters.countersTable.some(counter => (counter.name === this.target.counterName))) {
              updateSelectedCounter(this.target.counterName);
            } else {
              this.updateView();
            }
          });
      }
    });
  }

  counterChanged(counter) {
    this[PRIVATE_PROPERTIES.counterName] = counter.value;
    this.target.counterName = counter.value;
    this.counterDataComplete = true;
    this.targetChanged();
  }

  toggleShowOptions() {
    this.showOptions = !this.showOptions;
  }

  static nodeDisplayValue(node) {
    if ((node.name != null) && (node.name !== '')) {
      return `${node.name}${(((node.address != null) && (node.address !== '')) ? ` (${node.address})` : '')}`;
    } else if ((node.address != null) && (node.address !== '')) {
      return node.address;
    }
    return '';
  }

  static get templateUrl() {
    return `${datasourceURL}query/query.editor.html`;
  }

}

export {
  NetCrunchQueryController
};
