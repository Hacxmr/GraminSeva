// frontend/next.config.ts (Final Correct Version)
import type { NextConfig } from 'next';
import path from 'path';

const config: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default config;