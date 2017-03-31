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

  static aggregateTokenValues(result) {
    let
      resultToken,
      aggregatedValue;

    if (result != null) {
      resultToken = result.tokens[0];

      aggregatedValue = resultToken.value.reduce((aggregation, token) => {
        aggregation.push(...([].concat(token.value)));
        return aggregation;
      }, []);

      return ReadResult.getReadResult(resultToken.type, aggregatedValue, result.residuals);
    }

    return null;
  }

}

class GenericTokenReaders {

  static readToken(tokenType, pattern, input) {
    const regExpResult = (input || '').match(new RegExp(`^${pattern}(.*)$`, 'i'));
    return ReadResult.getReadResultFromTokenRegExp(tokenType, regExpResult);
  }

  static readSelectorToken(tokenType, selectorName, input) {
    const
      selectorParametersPattern = '(?:(?:\\\\\\(|\\\\\\))|[^()])+',
      selectorPattern = `(?:${selectorName})\\((${selectorParametersPattern})\\)`;
    return this.readToken(tokenType, selectorPattern, input);
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

  static readFirstOccurredToken(tokenType, tokenReaders, input) {

    function firstOccurredIterator(anonymousCallback) {
      return tokenReaders.some(anonymousCallback);
    }

    return this.readTokens(tokenType, firstOccurredIterator, input);
  }

  static readTokensIfOccur(tokenType, tokenReaders, input) {

    function ifOccurIterator(anonymousCallback) {
      let iteratorResult = false;

      tokenReaders.forEach((reader, index, array) => {
        const result = anonymousCallback(reader, index, array);
        if (result) {
          iteratorResult = true;
        }
      });

      return iteratorResult;
    }

    return this.readTokens(tokenType, ifOccurIterator, input);
  }

}

class QueryTokenReaders {

  static readNodes(input) {
    return GenericTokenReaders.readToken('nodes', 'nodes()', input);
  }

  static readMonitoringPacks(input) {
    return GenericTokenReaders.readToken('monitoringPacks', '\\.monitoringPacks()', input);
  }

  static readSelectorWithStringParameter(tokenType, selectorName, input) {
    const
      parameterCharPattern = '(?:[\\w~`!@#$%^&*_+-=\\[\\]{};\':<>,\\.\\?\\/|]|\\\\"|\\\\\\(|\\\\\\)|\\\\)',
      parameterPattern = `"(\\s*${parameterCharPattern}+(?:[\\s]${parameterCharPattern}+)*\\s*)"`,
      selectorReadResult = GenericTokenReaders.readSelectorToken('', selectorName, input);
    let
      parameterReadResult,
      parameterValue;

    function replaceHashedChars(string) {
      let result;

      result = (string || '').replace(/\\\(/g, '(');
      result = result.replace(/\\\)/g, ')');
      result = result.replace(/\\"/g, '"');
      return result;
    }

    if (selectorReadResult != null) {
      parameterReadResult = GenericTokenReaders.readToken('', parameterPattern, selectorReadResult.tokens[0].value);
      parameterValue = replaceHashedChars(parameterReadResult.tokens[0].value);
    }

    if ((selectorReadResult != null) && (parameterReadResult != null)) {
      return ReadResult.getReadResult(tokenType, parameterValue, selectorReadResult.residuals);
    }

    return null;
  }

  static readDot(input) {
    return GenericTokenReaders.readToken('dot', '(\\.)', input);
  }

  static readDotSelectorWithStringParameter(tokenType, functionName, input) {
    const selectorReader = (readerInput => this.readSelectorWithStringParameter('', functionName, readerInput));
    let
      readResult = GenericTokenReaders.readTokenSequence('', [this.readDot, selectorReader], input),
      resultTokenValue;

    if (readResult != null) {
      readResult = ReadResult.aggregateTokenValues(readResult);
      resultTokenValue = readResult.tokens[0].value;
      return ReadResult.getReadResult(tokenType, resultTokenValue[1], readResult.residuals);
    }
    return null;
  }

  static readNetworkAtlas(input) {
    return this.readDotSelectorWithStringParameter('networkAtlas', 'networkAtlas', input);
  }

  static readFolder(input) {
    return QueryTokenReaders.readDotSelectorWithStringParameter('folder', 'folder', input);
  }

  static readRepetitiveFolder(input) {
    const result = GenericTokenReaders.readRepetitiveToken('folders', QueryTokenReaders.readFolder, input);
    return ReadResult.aggregateTokenValues(result);
  }

  static readView(input) {
    return this.readDotSelectorWithStringParameter('view', 'view', input);
  }

  static readName(input) {
    return this.readDotSelectorWithStringParameter('name', 'name', input);
  }

}

export {
  QueryTokenReaders
};
