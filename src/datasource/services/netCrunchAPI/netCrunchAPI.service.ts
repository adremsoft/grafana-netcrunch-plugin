/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

import angular from 'angular';
import {servicesModule} from '../../common';
import './adrem/module';

class NetCrunchAPIService {

  /** @ngInject */
  constructor (adrem) {
  }

}

angular
  .module(servicesModule)
  .service('netCrunchAPIService', NetCrunchAPIService);
