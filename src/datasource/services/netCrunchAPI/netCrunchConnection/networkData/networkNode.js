/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

/* global window */

const
  MAP_ICON_ID_UNKNOWN = 100,
  ICON_SIZE = 25,
  PRIVATE_PROPERTIES = {
    local: Symbol('local'),
    values: Symbol('values')
  };

class NetCrunchNetworkNode {

  constructor(nodeRec, netCrunchServerConnection) {
    const
      deviceType = NetCrunchNetworkNode.parseDeviceType(nodeRec.getValues().DeviceType);

    this[PRIVATE_PROPERTIES.values] = nodeRec.getValues();
    this[PRIVATE_PROPERTIES.local] = Object.assign({}, deviceType);
    this[PRIVATE_PROPERTIES.local].iconUrl = NetCrunchNetworkNode.getIconUrl(this.iconId, netCrunchServerConnection);
  }

  get id() {
    return this[PRIVATE_PROPERTIES.values].Id;
  }

  get name() {
    return this[PRIVATE_PROPERTIES.values].Name;
  }

  get address() {
    return this[PRIVATE_PROPERTIES.values].Address;
  }

  get globalDataNode() {
    return this[PRIVATE_PROPERTIES.values].GlobalDataNode;
  }

  get iconUrl() {
    return this[PRIVATE_PROPERTIES.local].iconUrl;
  }

  static parseXML(data) {
    let xml;

    if (!data || typeof data !== 'string') {
      return null;
    }

    try {
      xml = (new window.DOMParser()).parseFromString(data, 'text/xml');
    } catch (e) {
      xml = undefined;
    }

    return xml;
  }

  static createDeviceType(iconId = 0, classId, categoryId, subCategoryId, manufacturerId) {
    return {
      iconId,
      classId,
      categoryId,
      subCategoryId,
      manufacturerId
    };
  }

  static parseDeviceType(deviceTypeXML) {

    if ((deviceTypeXML !== '') && (deviceTypeXML != null)) {
      const
        doc = NetCrunchNetworkNode.parseXML(deviceTypeXML),
        deviceType = doc.getElementsByTagName('devtype');

      if (deviceType[0] != null) {
        return NetCrunchNetworkNode.createDeviceType(
          deviceType[0].getAttribute('iconid') || MAP_ICON_ID_UNKNOWN,
          deviceType[0].getAttribute('classid'),
          deviceType[0].getAttribute('CategoryId'),
          deviceType[0].getAttribute('SubCategoryId'),
          deviceType[0].getAttribute('ManufacturerId')
        );
      }
      return NetCrunchNetworkNode.createDeviceType();
    }

    return NetCrunchNetworkNode.createDeviceType();
  }

  static getIconUrl(iconId, serverConnection) {
    const iconUrl = serverConnection.ncSrv.IMapIcons.GetIcon.asURL(iconId, ICON_SIZE);
    return serverConnection.Client.urlFilter(iconUrl);
  }

}

export {
  NetCrunchNetworkNode
};
