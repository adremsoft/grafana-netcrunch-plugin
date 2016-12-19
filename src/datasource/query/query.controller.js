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
    scope: Symbol('scope'),
    nodeMap: Symbol('nodeMap'),
    nodeSegment: Symbol('nodeSegment'),
    nodeSpinner: Symbol('nodeSpinner'),
    counterName: Symbol('counterName'),
    counterSpinner: Symbol('counterSpinner'),
    counters: Symbol('counters')
  },
  DEFAULT_NODE_NAME = 'Select node',
  DEFAULT_COUNTER_DISPLAY_NAME = 'Select counter';

class NetCrunchQueryController extends QueryCtrl {

  constructor(uiSegmentSrv, $scope) {
    super();

    this[PRIVATE_PROPERTIES.uiSegmentSrv] = uiSegmentSrv;
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
    });

    this.processingCounter = true;
    this.counterReady = false;

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

  targetChanged() {
    this.panelCtrl.refresh();
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
    return this.datasource
      .nodes().then((nodes) => {
        this[PRIVATE_PROPERTIES.nodeMap].clear();
        return nodes.all.map((node) => {
          const nodeSegment = this.createNodeSegment(node);
          this[PRIVATE_PROPERTIES.nodeMap].set(nodeSegment.value, node);
          return nodeSegment;
        });
      });
  }

  nodeChanged(nodeId = null) {
    const self = this;
    let selectedNode;

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
                const subMenu = countersByMonitors[monitorId]
                  .counters.map(counter => ({
                    text: counter.displayName,
                    value: counter.name
                  }));

                countersMenu.push({
                  text: countersByMonitors[monitorId].name,
                  submenu: subMenu
                });
              }
            });

            return {
              countersMenu,
              countersTable: countersByMonitors.table
            };
          });
    }

    if (nodeId != null) {
      selectedNode = this.datasource
        .nodes()
          .then(nodes => ((nodes.all.some(node => (nodeId === node.id))) ? nodeId : null));
    } else if (this[PRIVATE_PROPERTIES.nodeMap].has(this.nodeSegment.value)) {
      selectedNode = Promise.resolve(this[PRIVATE_PROPERTIES.nodeMap].get(this.nodeSegment.value).id);
    } else {
      selectedNode = Promise.resolve(null);
    }

    selectedNode.then((selectedNodeId) => {
      this.target.nodeID = selectedNodeId;

      if (selectedNodeId == null) {
        nodeNotReady();
        Object.assign(this[PRIVATE_PROPERTIES.nodeSegment], this.createDefaultNodeSegment(DEFAULT_NODE_NAME));
        this.targetChanged();
      } else {
        this.nodeReady = true;
        this.processingCounter = true;
        this.counterReady = false;
        this.updateView();

        getCounters(selectedNodeId)
          .then((counters) => {
            this.processingCounter = false;
            this[PRIVATE_PROPERTIES.counters] = counters.countersMenu;

            if (counters.countersTable.some(counter => (counter.name === this.target.counterName))) {
              this[PRIVATE_PROPERTIES.counterName] = this.target.counterName;
              this.counterReady = true;
              this.counterDataComplete = true;
              this.targetChanged();
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
