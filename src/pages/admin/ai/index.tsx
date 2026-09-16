import { GetServerSidePropsContext } from 'next';
import { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';

import { withAdminProps } from '~/lib/admin/props/with-admin-props';
import AdminRouteShell from '~/components/admin/AdminRouteShell';
import AdminHeader from '~/components/admin/AdminHeader';
import { useApiRequest } from '~/core/hooks/use-api';

const PROVIDERS = [
  {
    value: 'openai',
    label: 'OpenAI',
    hint: 'e.g. gpt-4o, gpt-4o-mini, o1, o1-mini',
    needsBaseURL: false,
  },
  {
    value: 'anthropic',
    label: 'Anthropic',
    hint: 'e.g. claude-sonnet-4-20250514, claude-3-5-haiku-20241022',
    needsBaseURL: false,
  },
  {
    value: 'google',
    label: 'Google Gemini',
    hint: 'e.g. gemini-2.5-pro, gemini-2.5-flash, gemini-2.0-flash',
    needsBaseURL: false,
  },
  {
    value: 'openai-compatible',
    label: 'OpenAI Compatible (Ollama, Together, Fireworks, vLLM, etc.)',
    hint: 'Enter the exact model ID from your provider',
    needsBaseURL: true,
  },
] as const;

const PROMPT_LABELS: Record<string, string> = {
  groupAndTags: 'Group & Tags (AI Grouping)',
  actions: 'Action Items (AI Actions)',
  patternsAdvice: 'Board Summary (Patterns & Advice)',
  improvementAreas: 'Analytics (Improvement Areas)',
};

interface PromptConfig {
  systemPrompt: string;
  temperature: number;
}

interface AIConfigState {
  provider: string;
  model: string;
  hasApiKey: boolean;
  baseURL?: string;
  prompts: Record<string, PromptConfig>;
  source?: string;
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

interface TestResult {
  status: TestStatus;
  message?: string;
  hint?: string;
}

function AISettingsPage() {
  const [config, setConfig] = useState<AIConfigState | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<TestResult>({ status: 'idle' });
  const [verified, setVerified] = useState(false);
  const apiRequest = useApiRequest<{ success: boolean }, any>();
  const testApiRequest = useApiRequest<any, any>();

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai-config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setVerified(true);
        setTestResult({ status: 'idle' });
      } else {
        toast.error('Failed to load AI settings');
      }
    } catch (err) {
      console.error('Failed to load AI config:', err);
      toast.error('Failed to load AI settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, []);

  const resetVerification = () => {
    setVerified(false);
    setTestResult({ status: 'idle' });
  };

  const handleTest = async () => {
    if (!config) return;
    if (!config.model.trim()) {
      toast.error('Enter a model name first');
      return;
    }

    setTestResult({ status: 'testing' });

    try {
      const body: any = {
        provider: config.provider,
        model: config.model.trim(),
        baseURL: config.baseURL || '',
      };
      if (apiKey) {
        body.apiKey = apiKey;
      }

      const result = await testApiRequest({
        path: '/api/admin/ai-config/test',
        method: 'POST',
        body,
      });

      if (result.success) {
        setTestResult({
          status: 'success',
          message: result.message || 'Connection successful!',
        });
        setVerified(true);
        toast.success('Model verified successfully');
      } else {
        setTestResult({
          status: 'error',
          message: result.error || 'Test failed',
          hint: result.hint,
        });
        setVerified(false);
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: 'Failed to test connection. Check server logs.',
      });
      setVerified(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    if (!config.model.trim()) {
      toast.error('Enter a model name before saving');
      return;
    }

    if (!verified) {
      toast.error('Please test the connection before saving');
      return;
    }

    setSaving(true);

    try {
      const body: any = {
        provider: config.provider,
        model: config.model.trim(),
        baseURL: config.baseURL || '',
        prompts: config.prompts,
      };
      if (apiKey) {
        body.apiKey = apiKey;
      }

      await apiRequest({
        path: '/api/admin/ai-config',
        method: 'POST',
        body,
      });

      toast.success('AI settings saved to database');
      setApiKey('');
      fetchConfig();
    } catch (err) {
      console.error('Failed to save AI config:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updatePrompt = (key: string, field: keyof PromptConfig, value: any) => {
    if (!config) return;
    setConfig({
      ...config,
      prompts: {
        ...config.prompts,
        [key]: {
          ...config.prompts[key],
          [field]: value,
        },
      },
    });
  };

  if (loading) {
    return (
      <>
        <AdminHeader />
        <AdminRouteShell>
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">Loading AI settings...</div>
          </div>
        </AdminRouteShell>
      </>
    );
  }

  if (!config) {
    return (
      <>
        <AdminHeader />
        <AdminRouteShell>
          <div className="flex items-center justify-center py-20">
            <div className="text-red-500">Failed to load AI settings</div>
          </div>
        </AdminRouteShell>
      </>
    );
  }

  const currentProvider = PROVIDERS.find((p) => p.value === config.provider);
  const showBaseURL = currentProvider?.needsBaseURL ?? false;

  return (
    <>
      <AdminHeader />
      <AdminRouteShell>
        <Head>
          <title>RetroTeam | AI Settings</title>
          <meta name="robots" content="noindex" />
        </Head>

        <div className="p-3">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Settings
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Configure the AI provider, model, and prompts. All settings are
              stored in the database and take effect immediately.
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Connected to Firestore database
            </div>
          </div>

          {/* Provider & Model */}
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Provider & Model
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  AI Provider
                </label>
                <select
                  value={config.provider}
                  onChange={(e) => {
                    const newProvider = e.target.value;
                    setConfig({
                      ...config,
                      provider: newProvider,
                      model: '',
                      baseURL: '',
                    });
                    resetVerification();
                  }}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {showBaseURL && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Base URL
                  </label>
                  <input
                    type="text"
                    value={config.baseURL || ''}
                    onChange={(e) => {
                      setConfig({ ...config, baseURL: e.target.value });
                      resetVerification();
                    }}
                    placeholder="e.g. http://localhost:11434/v1, https://api.together.xyz/v1"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    The OpenAI-compatible API endpoint for your provider.
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Model
                </label>
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) => {
                    setConfig({ ...config, model: e.target.value });
                    resetVerification();
                  }}
                  placeholder={currentProvider?.hint || 'Enter model ID'}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Type any model ID supported by your provider. Uses the{' '}
                  <a
                    href="https://sdk.vercel.ai/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Vercel AI SDK
                  </a>{' '}
                  — any model the SDK supports will work here.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  API Key{' '}
                  {config.hasApiKey && (
                    <span className="text-green-600">(configured in database)</span>
                  )}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    resetVerification();
                  }}
                  placeholder={
                    config.hasApiKey
                      ? 'Leave blank to keep current key'
                      : 'Enter API key for selected provider'
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Stored securely in the Firestore database. Never exposed to the
                  client browser.
                  {showBaseURL && ' Leave blank if your provider does not require a key (e.g. local Ollama).'}
                </p>
              </div>

              {/* Test Connection */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Connection Test
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Verify your provider, model, and API key work before saving.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={testResult.status === 'testing' || !config.model.trim()}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-500 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                  >
                    {testResult.status === 'testing' ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Testing...
                      </span>
                    ) : (
                      'Test Connection'
                    )}
                  </button>
                </div>

                {testResult.status === 'success' && (
                  <div className="mt-3 rounded-md bg-green-50 p-3 dark:bg-green-900/20">
                    <div className="flex items-start gap-2">
                      <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        {testResult.message}
                      </p>
                    </div>
                  </div>
                )}

                {testResult.status === 'error' && (
                  <div className="mt-3 rounded-md bg-red-50 p-3 dark:bg-red-900/20">
                    <div className="flex items-start gap-2">
                      <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-red-700 dark:text-red-400">
                          {testResult.message}
                        </p>
                        {testResult.hint && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                            {testResult.hint}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Prompts */}
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              System Prompts
            </h2>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Edit the system prompts sent to the AI for each feature. Changes
              are saved to the database and apply immediately to all users.
            </p>

            <div className="space-y-6">
              {Object.entries(config.prompts).map(([key, prompt]) => (
                <div
                  key={key}
                  className="rounded-md border border-gray-100 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {PROMPT_LABELS[key] || key}
                    </h3>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        Temperature:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={prompt.temperature}
                        onChange={(e) =>
                          updatePrompt(
                            key,
                            'temperature',
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-16 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                  <textarea
                    value={prompt.systemPrompt}
                    onChange={(e) =>
                      updatePrompt(key, 'systemPrompt', e.target.value)
                    }
                    rows={8}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-mono dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              All changes are persisted to the Firestore database at{' '}
              <code className="rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-700">
                rules/ai-config
              </code>
            </p>
            <div className="flex items-center gap-3">
              {!verified && config.model.trim() && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Test connection before saving
                </p>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !verified || !config.model.trim()}
                title={
                  !verified
                    ? 'Test the connection first to verify your model works'
                    : undefined
                }
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving to database...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </AdminRouteShell>
    </>
  );
}

export default AISettingsPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return withAdminProps(context);
}
