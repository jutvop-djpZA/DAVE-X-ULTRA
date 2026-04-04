#!/usr/bin/env node
'use strict';

/**
 * DAVEX-ULTRA Setup Script
 * Run: node setup.js
 * Creates required directories and validates environment.
 */

const fs = require('fs');
const path = require('path');

const dirs = [
  'data',
  'tmp',
  'tmp/antidelete',
  'logs',
];

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  DAVEX-ULTRA v3.0.0 — Setup');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Create directories
for (const dir of dirs) {
  const full = path.join(__dirname, dir);
  if (!fs.existsSync(full)) {
    fs.mkdirSync(full, { recursive: true });
    console.log(`✅ Created: ${dir}/`);
  } else {
    console.log(`✔  Exists:  ${dir}/`);
  }
}

// Create .env if not exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const envTemplate = `# DAVEX-ULTRA Environment Variables
# Copy this file and fill in your values.

# Required: Your WhatsApp session (base64 encoded)
SESSION_ID=

# Bot settings (all optional — have defaults)
BOT_NAME=DAVEX-ULTRA
BOT_OWNER=DAVEX
OWNER_NUMBER=
PREFIX=.
MODE=public
PACKNAME=DAVEX-ULTRA
TIMEZONE=Africa/Nairobi

# Optional: PostgreSQL database URL (leave empty to use SQLite)
DATABASE_URL=

# Optional: API Keys
GEMINI_API_KEY=
OPENAI_API_KEY=
`;
  fs.writeFileSync(envPath, envTemplate);
  console.log('\n✅ Created .env template — fill in your SESSION_ID and other values.');
} else {
  console.log('\n✔  .env already exists.');
}

// Check for Node version
const [major] = process.versions.node.split('.').map(Number);
if (major < 18) {
  console.error(`\n❌ Node.js v${process.versions.node} is too old. Minimum required: v18.0.0`);
  process.exit(1);
}
console.log(`\n✅ Node.js v${process.versions.node} — OK`);

// Check for required dependencies
const requiredModules = ['@whiskeysockets/baileys', 'better-sqlite3', 'express', 'pino', 'chalk'];
let missingModules = [];
for (const mod of requiredModules) {
  try {
    require.resolve(mod);
  } catch {
    missingModules.push(mod);
  }
}

if (missingModules.length > 0) {
  console.error(`\n❌ Missing modules: ${missingModules.join(', ')}`);
  console.error('   Run: npm install');
  process.exit(1);
}
console.log('✅ Core dependencies — OK');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Setup complete! Start options:');
console.log('');
console.log('  node index.js          — Direct start');
console.log('  npm run pm2:start      — PM2 managed');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
