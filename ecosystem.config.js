module.exports = {
  apps: [
    {
      name: "frontend",
      cwd: "./frontend", // Path to your Nuxt app
      script: "pnpm",
      args: "run dev",   // Runs the 'dev' script from frontend/package.json
      interpreter: "none",
      autorestart: false,
      // Nuxt dev server runs in 'fork' mode
      exec_mode: 'fork', 
    },
    {
      name: "backend",
      cwd: "./backend",  // Path to your Hono app
      script: "pnpm",
      args: "run dev",   // Runs 'wrangler dev...' from backend/package.json
      interpreter: "none",
      autorestart: false,
      exec_mode: 'fork',
    },
    {
      name: "caddy",
      cwd: "./infra/http-server",  // Path to Caddy configuration
      script: "caddy",
      args: "run --config Caddyfile",   // Runs Caddy with the Caddyfile
      interpreter: "none",
      autorestart: false,
      exec_mode: 'fork',
    }
  ]
};

