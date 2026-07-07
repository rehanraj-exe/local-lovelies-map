import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing URL or Key in .env");
  process.exit(1);
}

console.log("Connecting to:", supabaseUrl);
console.log("Using key prefix:", supabaseKey.substring(0, 15) + "...");

const supabase = createClient(supabaseUrl, supabaseKey);

const { data, error } = await supabase.from('shops').select('*').limit(5);

if (error) {
  console.error("Error fetching shops:", error);
} else {
  console.log("Success! Fetched shops count:", data.length);
  console.log("Shops data:", data);
}
