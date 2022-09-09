import { MOCKS_DIR } from '../config';
import glob from 'fast-glob';
import { match as pathMatcher } from 'path-to-regexp';
import fs from 'fs';
import md5 from 'md5';
import { join } from 'path';

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

export const isObject = variable => {
  return typeof variable === 'object' && variable !== null;
};

export const getFiles = (dir, extention = '.js') => {
  return glob.sync([`${dir}/**/*${extention}`]);
};

export const mappingsDir = serverId => {
  return join(MOCKS_DIR, serverId, "mappings");
};

export const proxyRootDir = serverId => {
  return `${MOCKS_DIR}/${serverId}`;
};

export const matchPath = (pattern, path) => {
  const matchFunction = pathMatcher(pattern.replace('?', '\\?'));
  return matchFunction(path);
};

export const randInt = (from: number, to: number) => {
  return Math.floor(Math.random() * to) + from;
};

export const getProxyConfig = async (serverId: string) => {
  const file = join(MOCKS_DIR, serverId, "config.json");
  try {
    const content = fs.readFileSync(file, 'utf8');
    const config = JSON.parse(content);
    return config;
  } catch (error) {
    throw Error(`Can not load config file ${file}`);
  }
};

export const getHash = (method, url, body) => {
  const data = `${method}#${url}#${JSON.stringify(body)}`;
  const hash = md5(data);
  return hash;
};

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateString(length) {
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export function omit(obj, ...props) {
  const result = { ...obj };
  props.forEach(function (prop) {
    delete result[prop];
  });
  return result;
}

export function omitMetaProps(obj, ...props) {
  const data = { ...obj };
  for (const prop in data) {
    const value = data[prop];
    if (props.includes(prop) || props.includes(value)) {
      delete data[prop];
    } else if (typeof data[prop] === 'object') {
      omitMetaProps(data[prop]);
    }
  }
  return data;
}

export function pathToFolders(path: string) {
  return join(...path.split('/'));
}
