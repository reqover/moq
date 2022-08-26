import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const { NODE_ENV } = process.env;
export const MOCKS_DIR = './mocks';
export const PORT = process.env.PORT || 3000;
export const LOG_DIR = '../../logs';
export const LOG_FORMAT = 'combined';
