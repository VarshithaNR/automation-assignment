import { test, expect } from '@playwright/test';
import { ApiClient, LearningInstance } from '../../utils/ApiClient';
import { credentials, uniqueName } from '../../utils/testData';

/**
 * Use Case 3: Learning Instance API Flow
 * ───────────────────────────────────────
 * 1. Perform login using credentials → obtain token
 * 2. Create a Learning Instance
 * 3. Validate the created instance with schema and field-level checks
 * 4. Cleanup (delete the instance)
 *
 * All endpoints inferred from Automation Anywhere CE v3 REST API.
 * Use browser Network tab to verify exact paths if endpoints change.
 */
test.describe('Use Case 3 – Learning Instance API', () => {
  let apiClient: ApiClient;
  let createdInstanceId: string | number | undefined;

  const INSTANCE_NAME = uniqueName('API_Learn_Instance');

  // ── Test 3.1 – Authentication ─────────────────────────────────────────
  test('3.1 Should authenticate and receive a valid token', async ({ request }) => {
    apiClient = new ApiClient(request);
    const startTime = Date.now();

    const token = await apiClient.login(credentials.username, credentials.password);

    const elapsed = Date.now() - startTime;

    // ── Validations ───────────────────────────────────────────────────────
    expect(token, 'Token must be a non-empty string').toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.length, 'Token should be at least 20 chars').toBeGreaterThan(20);
    expect(elapsed, 'Auth should respond within 5 seconds').toBeLessThan(5000);

    console.log(`✓ Auth response time: ${elapsed}ms`);
    console.log(`✓ Token received (first 10 chars): ${token.substring(0, 10)}...`);
  });

  // ── Test 3.2 – List Learning Instances ───────────────────────────────
  test('3.2 Should list learning instances successfully', async ({ request }) => {
    apiClient = new ApiClient(request);
    await apiClient.login(credentials.username, credentials.password);

    const startTime = Date.now();
    const response  = await apiClient.listLearningInstances();
    const elapsed   = Date.now() - startTime;

    // ── HTTP status ───────────────────────────────────────────────────────
    expect(response.status, 'List endpoint should return 200').toBe(200);

    // ── Response time ─────────────────────────────────────────────────────
    expect(elapsed, 'List response should be < 5000ms').toBeLessThan(5000);
    console.log(`✓ List response time: ${elapsed}ms`);

    // ── Schema validation ─────────────────────────────────────────────────
    const body = response.body as { list?: LearningInstance[]; total?: number };
    expect(body).toBeDefined();
    // The body should have a list array (even if empty) or total field
    if (body.list !== undefined) {
      expect(Array.isArray(body.list)).toBeTruthy();
      console.log(`✓ Found ${body.total ?? body.list.length} existing learning instances`);
    }
  });

  // ── Test 3.3 – Create Learning Instance ───────────────────────────────
  test('3.3 Should create a Learning Instance with correct data', async ({ request }) => {
    apiClient = new ApiClient(request);
    await apiClient.login(credentials.username, credentials.password);

    const payload = {
      name: INSTANCE_NAME,
      type: 'DOCUMENT_INTELLIGENCE',
      description: 'Created by Playwright API automation test',
    };

    const startTime = Date.now();
    const response  = await apiClient.createLearningInstance(payload);
    const elapsed   = Date.now() - startTime;

    // ── HTTP status ───────────────────────────────────────────────────────
    // AA CE typically returns 200 or 201 for creation
    expect(
      [200, 201].includes(response.status),
      `Expected 200 or 201, got ${response.status}`
    ).toBeTruthy();

    // ── Response time ─────────────────────────────────────────────────────
    expect(elapsed, 'Create response should be < 8000ms').toBeLessThan(8000);
    console.log(`✓ Create response time: ${elapsed}ms`);

    // ── Response body schema ──────────────────────────────────────────────
    const body = response.body as LearningInstance;
    expect(body, 'Response body must be defined').toBeDefined();

    // ID is assigned by server
    expect(body.id, 'Created instance must have an ID').toBeTruthy();

    // Name should match what we sent
    expect(body.name, 'Instance name should match requested name').toBe(INSTANCE_NAME);

    // Store ID for subsequent tests
    createdInstanceId = body.id;
    console.log(`✓ Learning instance created with ID: ${createdInstanceId}`);
    console.log(`✓ Name: ${body.name}`);
    console.log(`✓ Status: ${body.status}`);
  });

  // ── Test 3.4 – Validate Created Instance by ID ────────────────────────
  test('3.4 Should fetch and validate the created Learning Instance by ID', async ({ request }) => {
    apiClient = new ApiClient(request);
    await apiClient.login(credentials.username, credentials.password);

    // Create instance first
    const createResponse = await apiClient.createLearningInstance({
      name: uniqueName('Validate_Instance'),
      description: 'Instance for fetch validation',
    });
    expect([200, 201].includes(createResponse.status)).toBeTruthy();

    const created = createResponse.body as LearningInstance;
    expect(created.id).toBeTruthy();

    createdInstanceId = created.id;

    // ── Fetch by ID ────────────────────────────────────────────────────────
    const startTime  = Date.now();
    const response   = await apiClient.getLearningInstance(created.id!);
    const elapsed    = Date.now() - startTime;

    // ── HTTP status ───────────────────────────────────────────────────────
    expect(response.status, 'GET by ID should return 200').toBe(200);

    // ── Response time ─────────────────────────────────────────────────────
    expect(elapsed, 'Fetch response should be < 5000ms').toBeLessThan(5000);
    console.log(`✓ Fetch by ID response time: ${elapsed}ms`);

    // ── Field-level validations ────────────────────────────────────────────
    const body = response.body as LearningInstance;

    // ID matches
    expect(String(body.id)).toBe(String(created.id));

    // Name matches
    expect(body.name).toBe(created.name);

    // Status field exists and is a non-empty string
    if (body.status) {
      expect(typeof body.status).toBe('string');
      expect(body.status.length).toBeGreaterThan(0);
      console.log(`✓ Instance status: ${body.status}`);
    }

    console.log(`✓ Field validations passed for instance ID: ${body.id}`);
  });

  // ── Test 3.5 – Full API Flow: Login → Create → Validate ───────────────
  test('3.5 Full API flow: Authenticate → Create → Validate → Cleanup', async ({ request }) => {
    // ── Step 1: Login ──────────────────────────────────────────────────────
    apiClient = new ApiClient(request);
    const token = await apiClient.login(credentials.username, credentials.password);
    expect(token).toBeTruthy();
    console.log('\n── Step 1: Authentication ✓');

    // ── Step 2: Create Learning Instance ──────────────────────────────────
    const instanceName = uniqueName('Full_Flow_Instance');
    const createResp   = await apiClient.createLearningInstance({
      name: instanceName,
      type: 'DOCUMENT_INTELLIGENCE',
      description: 'Full flow Playwright API test',
    });

    expect([200, 201].includes(createResp.status)).toBeTruthy();
    const created = createResp.body as LearningInstance;
    expect(created.id).toBeTruthy();
    expect(created.name).toBe(instanceName);
    console.log(`── Step 2: Created instance ID ${created.id} ✓`);

    // ── Step 3: Validate instance exists ──────────────────────────────────
    const getResp = await apiClient.getLearningInstance(created.id!);
    expect(getResp.status).toBe(200);
    const fetched = getResp.body as LearningInstance;
    expect(String(fetched.id)).toBe(String(created.id));
    expect(fetched.name).toBe(instanceName);
    console.log(`── Step 3: Validated instance "${fetched.name}" ✓`);

    // ── Step 4: Functional accuracy checks ────────────────────────────────
    // Verify the data we sent is reflected in the response
    expect(fetched.name, 'Name must match what was submitted').toBe(instanceName);
    if (fetched.description) {
      expect(fetched.description).toBe('Full flow Playwright API test');
    }
    console.log('── Step 4: Functional accuracy checks ✓');

    // ── Step 5: Cleanup ────────────────────────────────────────────────────
    const deleteResp = await apiClient.deleteLearningInstance(created.id!);
    expect([200, 204].includes(deleteResp.status)).toBeTruthy();
    console.log(`── Step 5: Cleaned up instance ${created.id} ✓`);
    console.log('\n✓ Full API flow completed successfully');
  });

  // ── Test 3.6 – Response Schema Validation ─────────────────────────────
  test('3.6 Should validate complete response schema of Learning Instance', async ({ request }) => {
    apiClient = new ApiClient(request);
    await apiClient.login(credentials.username, credentials.password);

    const createResp = await apiClient.createLearningInstance({
      name: uniqueName('Schema_Instance'),
      description: 'Schema validation test',
    });

    expect([200, 201].includes(createResp.status)).toBeTruthy();
    const body = createResp.body as LearningInstance;

    // ── Required fields ────────────────────────────────────────────────────
    expect(body.id,   'id field must exist').toBeDefined();
    expect(body.name, 'name field must exist').toBeDefined();

    // ── Field types ────────────────────────────────────────────────────────
    expect(
      ['string', 'number'].includes(typeof body.id),
      `id should be string or number, got ${typeof body.id}`
    ).toBeTruthy();
    expect(typeof body.name).toBe('string');

    // ── Optional fields type checks ────────────────────────────────────────
    if (body.status)      expect(typeof body.status).toBe('string');
    if (body.type)        expect(typeof body.type).toBe('string');
    if (body.description) expect(typeof body.description).toBe('string');
    if (body.createdOn)   expect(typeof body.createdOn).toBe('string');
    if (body.createdBy)   expect(typeof body.createdBy).toBe('string');

    // Cleanup
    await apiClient.deleteLearningInstance(body.id!).catch(() => {});

    console.log(`✓ Schema validation passed`);
    console.log(`  Fields present: ${Object.keys(body).join(', ')}`);
  });

  // ── Cleanup after all tests ────────────────────────────────────────────
  test.afterAll(async ({ request }) => {
    if (createdInstanceId) {
      try {
        const client = new ApiClient(request);
        await client.login(credentials.username, credentials.password);
        await client.deleteLearningInstance(createdInstanceId);
        console.log(`Cleanup: deleted instance ${createdInstanceId}`);
      } catch {
        console.warn(`Cleanup: could not delete instance ${createdInstanceId}`);
      }
    }
  });
});
