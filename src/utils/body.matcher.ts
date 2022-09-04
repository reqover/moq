import { logger } from './logger';
import match from 'match-json';
import { omitMetaProps } from './util';
import { join } from 'path';
import { MOCKS_DIR } from '../config';
import importFresh from 'import-fresh';

export const bodyMatch = async (serverId, body, mock) => {
  try {
    if (isPartialMatch(body, mock.body)) {
      const partialContent = mock.body.partial?.content;
      return match.partial(body, partialContent);
    }

    const matcherScript = mock.matcher;
    if (matcherScript) {
      const scriptPath = join(MOCKS_DIR, serverId, 'matchers', matcherScript);
      delete require.cache[matcherScript];
      const { matcher } = (await importFresh(scriptPath)) as any;
      return matcher(match, body, mock.body);
    }

    return equalToRuleMatch(body, mock.body);
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

function equalToRuleMatch(body, pattern) {
  const equalToRule = pattern.equalTo;
  const equalToContent = equalToRule.content;
  const propsToOmit = getPropsToOmit(equalToRule);

  const requestBody = omitMetaProps(body, ...propsToOmit);
  const mockBody = omitMetaProps(equalToContent, ...propsToOmit);
  return match(requestBody, mockBody);
}

function isPartialMatch(body, pattern) {
  return pattern.partial && Object.keys(body).length > 0;
}

export function getPropsToOmit(obj) {
  const omitProps = ['<any>'];
  const result = [];
  const data = { ...obj.content };
  for (const prop in data) {
    const value = data[prop];
    if (value === null) {
      continue;
    }
    if (omitProps.includes(value)) {
      result.push(prop);
    } else if (typeof data[prop] === 'object') {
      getPropsToOmit(data[prop]);
    }
  }

  const omit = obj?.omit || [];
  const propsToOmit = [...omit, ...result];
  return propsToOmit;
}
