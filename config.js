/**
 * SweatItOut — Runtime Configuration
 * ─────────────────────────────────────────────────────────────────
 * 1. Copy this file to config.js
 * 2. Fill in your credentials below
 * 3. Add config.js to your .gitignore (NEVER commit real keys)
 *
 * Supabase setup:  https://supabase.com/dashboard
 * Cerebras API:    https://cloud.cerebras.ai
 */

// ── Supabase ──────────────────────────────────────────────────────
var SUPABASE_URL  = 'hhttps://wsezkrxvyuznbahirfym.supabase.co';
var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZXprcnh2eXV6bmJhaGlyZnltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzA3NDYsImV4cCI6MjA4ODc0Njc0Nn0.EoxQnJWwuwMYlBT8D_uZmBx-Tr7vITLEQo9VXpOm4-M';

// ── Cerebras AI ───────────────────────────────────────────────────
// Optional: You can store this in Supabase app_config table instead
// (recommended for production — see supabase-setup.sql)
var CEREBRAS_KEY   = 'csk-2mtnj2fcwckxnd3d2pwy8p4exhmt4485ce6pv39rmpjdvkx4';           // leave blank to load from Supabase DB
var CEREBRAS_MODEL = 'gpt-oss-120b';   // or another supported model