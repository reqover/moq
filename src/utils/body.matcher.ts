import { logger } from './logger';
import match from 'match-json';
import { omitMetaProps } from './util';
import { join } from 'path';
import { MOCKS_DIR } from '@/config';
import importFresh from 'import-fresh';

export const bodyMatch = async (serverId, body, pattern) => {
  try {
    if (isPartialMatch(body, pattern)) {
      const partialContent = pattern.partial?.content;
      return match.partial(body, partialContent);
    }
    const usingScript = pattern.equalTo.usingScript;

    if(usingScript){
      const scriptPath = join(MOCKS_DIR, serverId, 'matchers', usingScript);
      delete require.cache[usingScript];
      const { matcher } = await importFresh(scriptPath);
      const result =  matcher(match, body);
      return result;
    }

    return equalToRuleMatch(body, pattern);
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

function isScriptMatcher(pattern) {
  return pattern.equalTo.usingScript;
}


export function getPropsToOmit(obj) {
  const omitProps = ['<any>'];
  const result = [];
  const data = { ...obj.content };
  for (const prop in data) {
    const value = data[prop];
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
