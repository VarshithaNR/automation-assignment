import { APIRequestContext, expect } from '@playwright/test';

export interface LearningInstance {
  id?: string | number;
  name: string;
  status?: string;
  type?: string;
  description?: string;
  createdOn?: string;
  createdBy?: string;
  [key: string]: unknown;
}

export interface ApiResponse<T = unknown> {
  status: number;
  body: T;
  headers: Record<string, string>;
  responseTime: number;
}

/**
 * ApiClient – REST helper for Automation Anywhere CE
 *
 * AA CE v3 auth endpoint: POST /v1/authentication
 * Body: { username, password, multipleLogin }
 * Returns: { token, user, ... }
 *
 * If you get a 401, open DevTools → Network tab, log in manually,
 * find the /authentication request and copy the exact request body here.
 */
export class ApiClient {
  private readonly request: APIRequestContext;
  private readonly baseUrl: string;
  private authToken = '';

  constructor(request: APIRequestContext, baseUrl?: string) {
    this.request = request;
    this.baseUrl = (baseUrl || process.env.BASE_URL || 'https://community.cloud.automationanywhere.digital').replace(/\/$/, '');
  }

  // ── Auth ────────────────────────────────────────────────────────────────

  async login(username: string, password: string): Promise<string> {
    const startTime = Date.now();

    // AA CE supports two auth body shapes — try primary first
    const response = await this.request.post(`${this.baseUrl}/v1/authentication`, {
      data: {
        username,
        password,
        multipleLogin: false,
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    const elapsed = Date.now() - startTime;
    let body: Record<string, unknown>;

    try {
      body = await response.json();
    } catch {
      body = {};
    }

    console.log(`[Auth] Status: ${response.status()} | Time: ${elapsed}ms`);
    if (response.status() !== 200) {
      console.error('[Auth] Response body:', JSON.stringify(body));
    }

    expect(response.status(), `Auth failed (${response.status()}). Check USERNAME/PASSWORD in .env`).toBe(200);
    expect(body['token'], 'No token in auth response').toBeTruthy();
    expect(elapsed, 'Login response time should be < 8000ms').toBeLessThan(8000);

    this.authToken = body['token'] as string;
    return this.authToken;
  }

  // ── Generic helpers ──────────────────────────────────────────────────────

  private get authHeaders() {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Authorization': this.authToken,
    };
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    const start    = Date.now();
    const response = await this.request.get(`${this.baseUrl}${path}`, { headers: this.authHeaders });
    const elapsed  = Date.now() - start;
    const body     = await response.json().catch(() => ({}));
    return { status: response.status(), body: body as T, headers: response.headers() as Record<string, string>, responseTime: elapsed };
  }

  async post<T>(path: string, data: unknown): Promise<ApiResponse<T>> {
    const start    = Date.now();
    const response = await this.request.post(`${this.baseUrl}${path}`, { data, headers: this.authHeaders });
    const elapsed  = Date.now() - start;
    const body     = await response.json().catch(() => ({}));
    return { status: response.status(), body: body as T, headers: response.headers() as Record<string, string>, responseTime: elapsed };
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    const start    = Date.now();
    const response = await this.request.delete(`${this.baseUrl}${path}`, { headers: this.authHeaders });
    const elapsed  = Date.now() - start;
    const body     = await response.json().catch(() => ({}));
    return { status: response.status(), body: body as T, headers: response.headers() as Record<string, string>, responseTime: elapsed };
  }

  // ── Learning Instance endpoints ──────────────────────────────────────────

  /** List all learning instances – POST /v3/mlmodel/list */
  async listLearningInstances() {
    return this.post<{ list: LearningInstance[]; total: number }>(
      '/v3/mlmodel/list',
      {
        sort:   [{ field: 'createdOn', direction: 'desc' }],
        filter: {},
        fields: [],
        page:   { offset: 0, total: 100, length: 100 },
      }
    );
  }

  /** Create a learning instance – POST /v3/mlmodel */
  async createLearningInstance(payload: { name: string; type?: string; description?: string }) {
    return this.post<LearningInstance>('/v3/mlmodel', {
      name:        payload.name,
      type:        payload.type || 'DOCUMENT_INTELLIGENCE',
      description: payload.description || '',
    });
  }

  /** Get a learning instance by ID – GET /v3/mlmodel/{id} */
  async getLearningInstance(id: string | number) {
    return this.get<LearningInstance>(`/v3/mlmodel/${id}`);
  }

  /** Delete a learning instance – DELETE /v3/mlmodel/{id} */
  async deleteLearningInstance(id: string | number) {
    return this.delete<unknown>(`/v3/mlmodel/${id}`);
  }

  getToken(): string { return this.authToken; }
}
