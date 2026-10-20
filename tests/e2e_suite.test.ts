// tests/e2e_suite.test.ts
// TypeScript E2E Test Suite Entry Point

import { runTier1FeatureTests } from './suites/tier1_features.mjs';
import { runTier2BoundaryTests } from './suites/tier2_boundary.mjs';
import { runTier3CrossFeatureTests } from './suites/tier3_cross_feature.mjs';
import { runTier4RealWorldTests } from './suites/tier4_real_world.mjs';
import { runTier5AdversarialTests } from './suites/tier5_adversarial.mjs';

export interface TestReporter {
  suite(name: string): void;
  test(name: string, fn: () => void | Promise<void>): void;
}

export async function runAllE2ETests(reporter?: TestReporter) {
  const defaultReporter: TestReporter = {
    suite: (name: string) => console.log(`[SUITE] ${name}`),
    test: (name: string, fn: () => void | Promise<void>) => {
      try {
        fn();
        console.log(`  ✔ ${name}`);
      } catch (err: any) {
        console.error(`  ✖ ${name}:`, err.message);
        throw err;
      }
    }
  };

  const targetReporter = reporter || defaultReporter;
  await runTier1FeatureTests(targetReporter);
  await runTier2BoundaryTests(targetReporter);
  await runTier3CrossFeatureTests(targetReporter);
  await runTier4RealWorldTests(targetReporter);
  await runTier5AdversarialTests(targetReporter);
}

// Auto-run if executed directly via Node --experimental-strip-types
if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`) {
  runAllE2ETests().then(() => {
    console.log('All TypeScript E2E tests finished successfully.');
  });
}
