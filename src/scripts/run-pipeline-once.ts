import 'dotenv/config';

import { createDependencyContainer } from '../container/dependency-container.js';

async function main(): Promise<void> {
  const container = createDependencyContainer();
  await container.contentPipelineJob.execute();
}

main().catch((error: unknown) => {
  console.error('Pipeline failed:', error);
  process.exit(1);
});
