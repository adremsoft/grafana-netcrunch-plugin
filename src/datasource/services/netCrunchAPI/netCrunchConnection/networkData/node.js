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
  ICON_SIZE = 25;

class NetCrunchNode {

  constructor(nodeRec, netCrunchServerConnection) {
    const
      deviceType = NetCrunchNode.parseDeviceType(nodeRec.values.DeviceType);

    this.id = nodeRec.values.Id;
    this.name = nodeRec.values.Name;
    this.address = nodeRec.values.Address;
    this.globalDataNode = nodeRec.values.GlobalDataNode;
    Object.assign(this, deviceType);
    this.iconUrl = NetCrunchNode.getIconUrl(this.iconId, netCrunchServerConnection);
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
        doc = NetCrunchNode.parseXML(deviceTypeXML),
        deviceType = doc.getElementsByTagName('devtype');

      if (deviceType[0] != null) {
        return NetCrunchNode.createDeviceType(
          deviceType[0].getAttribute('iconid') || MAP_ICON_ID_UNKNOWN,
          deviceType[0].getAttribute('classid'),
          deviceType[0].getAttribute('CategoryId'),
          deviceType[0].getAttribute('SubCategoryId'),
          deviceType[0].getAttribute('ManufacturerId')
        );
      }
      return NetCrunchNode.createDeviceType();
    }

    return NetCrunchNode.createDeviceType();
  }

  static getIconUrl(iconId, serverConnection) {
    const iconUrl = serverConnection.ncSrv.IMapIcons.GetIcon.asURL(iconId, ICON_SIZE);
    return serverConnection.Client.urlFilter(iconUrl);
  }

}

export {
  NetCrunchNode
};
