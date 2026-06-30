const fs = require('fs');
const path = require('path');

// 1. Try to load local .env file if it exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value.trim();
      }
    }
  });
}

// 2. Define target paths
const prodPath = path.join(__dirname, 'src', 'environments', 'environment.ts');
const devPath = path.join(__dirname, 'src', 'environments', 'environment.development.ts');

const apiUrl = process.env.NG_APP_API_URL || "http://localhost:5174/api";
const hubUrl = process.env.NG_APP_HUB_URL || "http://localhost:5174/hubs/jomla";

// 3. Generate file contents
const prodConfigFile = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  hubUrl: '${hubUrl}'
};
`;

const devConfigFile = `export const environment = {
  production: false,
  apiUrl: '${apiUrl}',
  hubUrl: '${hubUrl}'
};
`;

// 4. Ensure directory exists and write files
const dirPath = path.dirname(prodPath);
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

fs.writeFileSync(prodPath, prodConfigFile, 'utf8');
fs.writeFileSync(devPath, devConfigFile, 'utf8');

console.log(`Environment files generated successfully:`);
console.log(`- ${prodPath}`);
console.log(`- ${devPath}`);
