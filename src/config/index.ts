import { config as loadDotenv } from 'dotenv';

loadDotenv();

export { loadEnvConfig } from './env.js';
export type {
  EnvConfig,
  FirebaseConfig,
  FacebookConfig,
} from './env.js';
