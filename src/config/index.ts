import { config } from 'dotenv';
const { dirname, join } = require('path');
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

const APP_DIR = join(dirname(require.main.filename), '..', 'mocks');
export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const { NODE_ENV } = process.env;
export const MOCKS_DIR = process.env.MOCKS_DIR || APP_DIR;
export const PORT = process.env.PORT || 3000;
export const LOG_DIR = process.env.LOG_DIR || join(dirname(require.main.filename), '..', 'logs');
export const LOG_FORMAT = 'combined';
export const PROXY_PATH = '/moq';
