/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

// Babel doesn't support extends from native class like Array, Map, Set

function NetCrunchNodesArray() {}

NetCrunchNodesArray.prototype = Object.create(Array.prototype);

export {
  NetCrunchNodesArray
};
