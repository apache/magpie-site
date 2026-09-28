import { criticalProgressionTests } from './progression.mjs';
if (!process.env.MAGPIE_TEST_MANIFEST) throw new Error('Use npm run test:browser so tests own a fresh build and server.');
criticalProgressionTests();
