import { createServer } from '../node_modules/vite/dist/node/index.js';

async function main() {
  const server = await createServer({
    configFile: './vite.config.ts',
    server: {
      port: 5173,
      host: '0.0.0.0'
    }
  });
  await server.listen();
  console.log("GLASSMART VITE SERVER ACTIVE AT http://localhost:5173/");
  server.printUrls();
}

main().catch(err => {
  console.error("Vite server error:", err);
  process.exit(1);
});
