import { MOCKS_DIR } from '../config';
import glob from 'fast-glob';
import { match as pathMatcher } from 'path-to-regexp';
import match from 'match-json';
import fs from 'fs';

/**
 * @method isEmpty
 * @param {String | Number | Object} value
 * @returns {Boolean} true & false
 * @description this value is Empty Check
 */
export const isEmpty = (value: string | number | object): boolean => {
  if (value === null) {
    return true;
  } else if (typeof value !== 'number' && value === '') {
    return true;
  } else if (typeof value === 'undefined' || value === undefined) {
    return true;
  } else if (value !== null && typeof value === 'object' && !Object.keys(value).length) {
    return true;
  } else {
    return false;
  }
};

export const getFiles = dir => {
  return glob.sync([`${dir}/**/*.json`]);
};

export const mappingsDir = serverId => {
  return `${MOCKS_DIR}/${serverId}/mappings`;
};

export const proxyRootDir = serverId => {
  return `${MOCKS_DIR}/${serverId}`;
};

export const matchPath = (pattern, path) => {
  const matchFunction = pathMatcher(pattern.replace('?', '\\?'));
  return matchFunction(path);
};

export const bodyMatch = (body, pattern) => {
  if (pattern.partial && Object.keys(body).length > 0) {
    return match.partial(body, pattern.partial);
  }

  return match(body, pattern.equalTo);
};

export const randInt = (from: number, to: number) => {
  return Math.floor(Math.random() * to) + from;
};

export const getProxyConfig = async (serverId: string) => {
  const file = `${MOCKS_DIR}/${serverId}/config.json`;
  try {
    const content = fs.readFileSync(file, 'utf8');
    const config = JSON.parse(content);
    return config;
  } catch (error) {
    throw Error(`Can not load config file ${file}`);
  }
};
