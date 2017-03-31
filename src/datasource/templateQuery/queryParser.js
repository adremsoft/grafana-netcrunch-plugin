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

  static getReadResult(tokenType, tokenValues, residuals) {
    return new ReadResult(Token.getToken(tokenType, tokenValues), residuals);
  }

  static getReadResultFromTokenRegExp(tokenType, tokenRegExpResult) {
    if ((tokenRegExpResult != null) && (tokenRegExpResult.length >= 3)) {
      return this.getReadResult(tokenType, tokenRegExpResult[1], tokenRegExpResult[2]);
    }
    return null;
  }

}

class GenericTokenReaders {

  static readToken(tokenType, pattern, input) {
    const regExpResult = (input || '').match(new RegExp(`^${pattern}(.*)$`, 'i'));
    return ReadResult.getReadResultFromTokenRegExp(tokenType, regExpResult);
  }

  static readFunctionToken(tokenType, functionName, input) {
    const
      functionParametersPattern = '(?:(?:\\\\\\(|\\\\\\))|[^()])+',
      functionPattern = `(?:${functionName})\\((${functionParametersPattern})\\)`;
    return this.readToken(tokenType, functionPattern, input);
  }

  static readRepetitiveToken(tokenType, tokenReader, input) {
    const readedTokens = [];
    let
      result = tokenReader(input),
      residuals;

    while (result != null) {
      readedTokens.push(...result.tokens);
      residuals = result.residuals;
      result = tokenReader(residuals);
    }

    return (readedTokens.length > 0) ? ReadResult.getReadResult(tokenType, readedTokens, residuals) : null;
  }

  static readTokens(tokenType, tokenReadersIterator, input) {
    const readedTokens = [];
    let
      iterationOK,
      residuals = input;

    iterationOK = tokenReadersIterator((tokenReader) => {       // eslint-disable-line prefer-const
      const result = tokenReader(residuals);
      if (result != null) {
        readedTokens.push(...result.tokens);
        residuals = result.residuals;
        return true;
      }
      return false;
    });

    return (iterationOK) ? ReadResult.getReadResult(tokenType, readedTokens, residuals) : null;
  }

  static readTokenSequence(tokenType, tokenReaders, input) {

    function sequenceIterator(anonymousCallback) {
      return tokenReaders.every(anonymousCallback);
    }

    return this.readTokens(tokenType, sequenceIterator, input);
  }

}

export {
  GenericTokenReaders
};
