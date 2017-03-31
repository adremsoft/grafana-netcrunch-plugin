/**
 * @license
 * Copyright AdRem Software. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0 that can be
 * found in the LICENSE file.
 */

const
  PRIVATE_PROPERTIES = {
    type: Symbol('type'),
    value: Symbol('value'),
    tokens: Symbol('token'),
    residuals: Symbol('residuals')
  };

class Token {

  constructor(type, value) {
    this[PRIVATE_PROPERTIES.type] = type;
    this[PRIVATE_PROPERTIES.value] = value;
  }

  get type() {
    return this[PRIVATE_PROPERTIES.type];
  }

  get value() {
    return this[PRIVATE_PROPERTIES.value];
  }

  static getToken(type, value) {
    return new Token(type, value);
  }

}

class ReadResult {

  constructor(tokens, residuals) {
    this[PRIVATE_PROPERTIES.tokens] = [].concat(tokens);
    this[PRIVATE_PROPERTIES.residuals] = residuals;
  }

  get tokens() {
    return this[PRIVATE_PROPERTIES.tokens];
  }

  get residuals() {
    return this[PRIVATE_PROPERTIES.residuals];
  }

  addToken(token) {
    this.tokens.push(token);
  }

  static getReadResult(tokenType, tokenValue, residuals) {
    return new ReadResult(Token.getToken(tokenType, tokenValue), residuals);
  }

  static getReadResultFromTokenRegExp(tokenType, tokenRegExpResult) {
    if ((tokenRegExpResult != null) && (tokenRegExpResult.length >= 3)) {
      return this.getReadResult(tokenType, tokenRegExpResult[1], tokenRegExpResult[2]);
    }
    return null;
  }
}

