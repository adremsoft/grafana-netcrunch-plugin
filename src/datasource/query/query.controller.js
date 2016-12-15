/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import '../css/query.editor.css!';            // eslint-disable-line
import { QueryCtrl } from 'app/plugins/sdk';  // eslint-disable-line
import { datasourceURL } from '../common';

const
  PRIVATE_PROPERTIES = {
    uiSegmentSrv: Symbol('uiSegmentSrv'),
    nodeMap: Symbol('nodeMap')
  },
  DEFAULT_NODE_NAME = 'Select node';

class NetCrunchQueryController extends QueryCtrl {

  constructor(uiSegmentSrv) {
    super();

    this[PRIVATE_PROPERTIES.uiSegmentSrv] = uiSegmentSrv;
    this[PRIVATE_PROPERTIES.nodeMap] = new Map();

    this.target.series = this.target.series || Object.create(null);
    this.target.showSeriesOptions = this.target.showSeriesOptions || true;
    this.localVars = this.target.localVars;

    this.nodeSegment = this.createDefaultSegment(DEFAULT_NODE_NAME);
  }

  targetChanged() {
    this.panelCtrl.refresh();
  }

  toggleSeries() {
    this.target.showSeriesOptions = !this.target.showSeriesOptions;
  }

  createDefaultSegment(segmentName) {
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

  nodeChanged() {
    const nodeUpdated = this[PRIVATE_PROPERTIES.nodeMap].has(this.nodeSegment.value);

    this.localVars.nodeUpdated = nodeUpdated;

    if (nodeUpdated) {
      this.nodeID = this[PRIVATE_PROPERTIES.nodeMap].get(this.nodeSegment.value).id;
      this.targetChanged();
    }
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
