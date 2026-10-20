#!/usr/bin/env node
// scripts/run_e2e_tests.mjs
// Master E2E Automated Test Runner for NETIZEN PARTY (MLN131 Edition)

import { performance } from 'node:perf_hooks';
import { runTier1FeatureTests } from '../tests/suites/tier1_features.mjs';
import { runTier2BoundaryTests } from '../tests/suites/tier2_boundary.mjs';
import { runTier3CrossFeatureTests } from '../tests/suites/tier3_cross_feature.mjs';
import { runTier4RealWorldTests } from '../tests/suites/tier4_real_world.mjs';
import { runTier5AdversarialTests } from '../tests/suites/tier5_adversarial.mjs';
import { runAllStressTests } from '../tests/stress/m1_stress_harness.ts';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bgGreen: '\x1b[42m\x1b[30m',
  bgRed: '\x1b[41m\x1b[37m'
};

class TestContext {
  constructor() {
    this.currentSuite = '';
    this.suites = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.errors = [];
    this.startTime = 0;
  }

  suite(name) {
    this.currentSuite = name;
    if (!this.suites.includes(name)) {
      this.suites.push(name);
    }
    console.log(`\n${colors.bold}${colors.yellow}▶ [SUITE] ${name}${colors.reset}`);
  }

  async test(name, fn) {
    this.totalTests++;
    const testStart = performance.now();
    try {
      await fn();
      const duration = (performance.now() - testStart).toFixed(2);
      this.passedTests++;
      console.log(`  ${colors.green}✔${colors.reset} ${name} ${colors.dim}(${duration}ms)${colors.reset}`);
    } catch (err) {
      const duration = (performance.now() - testStart).toFixed(2);
      this.failedTests++;
      this.errors.push({ suite: this.currentSuite, test: name, error: err });
      console.log(`  ${colors.red}✖ ${name} (${duration}ms)${colors.reset}`);
      console.log(`    ${colors.dim}${err.message}${colors.reset}`);
    }
  }

  async runAll() {
    console.log(`${colors.bold}${colors.magenta}================================================================${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}  NETIZEN PARTY: ĐẠI HỘI DÂN MẠNG (MLN131 Edition) - E2E RUNNER ${colors.reset}`);
    console.log(`${colors.dim}  Opaque-Box Requirement-Driven Multi-Tier Verification Suite${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}================================================================${colors.reset}`);

    this.startTime = performance.now();

    await runTier1FeatureTests(this);
    await runTier2BoundaryTests(this);
    await runTier3CrossFeatureTests(this);
    await runTier4RealWorldTests(this);
    await runTier5AdversarialTests(this);

    // Tier 6: Empirical Stress & Live Route Hardening
    this.suite('Tier 6: Empirical Stress & Live Route Hardening');
    const stressResult = await runAllStressTests();
    this.totalTests += stressResult.total;
    this.passedTests += stressResult.passed;
    if (stressResult.failed > 0) {
      this.failedTests += stressResult.failed;
      this.errors.push({
        suite: 'Tier 6: Empirical Stress & Live Route Hardening',
        test: 'runAllStressTests',
        error: new Error(`${stressResult.failed} stress scenarios failed`),
      });
    }

    const totalDuration = (performance.now() - this.startTime).toFixed(2);

    console.log(`\n${colors.bold}${colors.magenta}================================================================${colors.reset}`);
    console.log(`${colors.bold}  TEST SUITE SUMMARY REPORT${colors.reset}`);
    console.log(`${colors.bold}${colors.magenta}================================================================${colors.reset}`);
    console.log(`  Total Suites:  ${colors.bold}${this.suites.length}${colors.reset}`);
    console.log(`  Total Tests:   ${colors.bold}${this.totalTests}${colors.reset}`);
    console.log(`  Passed Tests:  ${colors.green}${colors.bold}${this.passedTests}${colors.reset}`);
    console.log(`  Failed Tests:  ${this.failedTests > 0 ? colors.red + colors.bold : colors.dim}${this.failedTests}${colors.reset}`);
    console.log(`  Total Time:    ${colors.cyan}${totalDuration}ms${colors.reset}`);

    if (this.failedTests > 0) {
      console.log(`\n${colors.bgRed} FAILURE DETAILS (${this.failedTests}) ${colors.reset}`);
      this.errors.forEach((e, idx) => {
        console.log(`\n${idx + 1}) [${e.suite}] ${e.test}`);
        console.log(`   ${colors.red}${e.error.stack || e.error}${colors.reset}`);
      });
      console.log(`\n${colors.bold}${colors.red}❌ E2E TEST RUN FAILED${colors.reset}\n`);
      process.exit(1);
    } else {
      console.log(`\n${colors.bgGreen} SUCCESS: ALL ${this.totalTests} E2E TESTS PASSED (100%) ${colors.reset}\n`);
      process.exit(0);
    }
  }
}

const runner = new TestContext();
runner.runAll().catch(err => {
  console.error('Fatal Test Runner Exception:', err);
  process.exit(1);
});
