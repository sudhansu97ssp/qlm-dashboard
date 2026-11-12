import app from './app.js';
import { config } from './config/env.js';
import { initDatabase } from './database/db.js';

// Start Server and attempt EC2 MS SQL initialization for local/standalone run
const PORT = config.port;
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`  QLM Soraco & EC2 MS SQL Dashboard Server Running   `);
  console.log(`  Port: http://localhost:${PORT}                      `);
  console.log(`  Environment: ${config.env}                          `);
  console.log(`=======================================================`);

  // Initialize DB pool
  await initDatabase();
});

