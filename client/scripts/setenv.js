const fs = require('fs');
const path = require('path');

// Path to .env file
const envPath = path.join(__dirname, '../.env');
// Path to environment.ts file
const targetPath = path.join(__dirname, '../src/environments/environment.ts');

// Function to parse .env file
function parseEnv(envContent) {
  const env = {};
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  });
  return env;
}

try {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = parseEnv(envContent);

    const envFileContent = `export const environment = {
  production: ${envVars.PRODUCTION === 'true'},
  apiUrl: '${envVars.API_URL || 'http://localhost:3000/api'}'
};
`;

    fs.writeFileSync(targetPath, envFileContent);
    console.log('Successfully generated environment.ts from .env');
  } else {
    console.log('.env file not found, skipping generation.');
  }
} catch (err) {
  console.error('Error generating environment.ts:', err);
}
