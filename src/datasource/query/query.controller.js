/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

//noinspection TypeScriptCheckImport
import {QueryCtrl} from 'app/plugins/sdk';
import {datasourceURL} from '../common';

//noinspection TypeScriptValidateTypes
class NetCrunchQueryController extends QueryCtrl {

  constructor() {
    super();
  }

  static get templateUrl() {
    return datasourceURL + 'query/query.editor.html';
  };

}

export {
  NetCrunchQueryController as NetCrunchQueryController
}
