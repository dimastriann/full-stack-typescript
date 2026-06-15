import { useState, useEffect } from 'react';
import { Settings, Database, Upload, Loader2 } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import type { SettingItem } from '../types';

interface ProviderConfig {
  enabled: boolean;
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  remotePath?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  bucketName?: string;
  prefix?: string;
  accessToken?: string;
  folderId?: string;
  folder?: string;
  [key: string]: string | number | boolean | undefined;
}

export default function SettingsTab({
  showToast,
}: {
  showToast: (t: string, e?: boolean) => void;
}) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [iconPreview, setIconPreview] = useState<string>('/pwa/icon.png');
  const [uploadingIcon, setUploadingIcon] = useState(false);

  // Storage Providers States
  const [activeProviders, setActiveProviders] = useState<string[]>(['local']);
  const [selectedProvider, setSelectedProvider] = useState<string>('local');
  const [providerConfigs, setProviderConfigs] = useState<Record<string, ProviderConfig>>({
    local: { enabled: true },
    sftp: {
      enabled: false,
      host: '',
      port: '22',
      username: '',
      password: '',
      remotePath: '/backups',
    },
    s3: {
      enabled: false,
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
      bucketName: '',
      prefix: 'backups/',
    },
    google_drive: { enabled: false, accessToken: '', folderId: '' },
    dropbox: { enabled: false, accessToken: '', folder: '/ProjectFlowBackups' },
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await apiClient.get('/superadmin/settings');
        if (res.ok) {
          const data = await res.json();
          const mapped: Record<string, string> = {};
          data.forEach((item: SettingItem) => {
            mapped[item.key] = item.value;
          });
          setSettings(mapped);

          // Load active providers
          if (mapped['backup_active_providers']) {
            try {
              setActiveProviders(JSON.parse(mapped['backup_active_providers']));
            } catch (e) {
              console.error('Failed to parse active backup providers', e);
            }
          }

          // Load provider configs
          if (mapped['backup_provider_configs']) {
            try {
              const parsed = JSON.parse(mapped['backup_provider_configs']);
              setProviderConfigs((prev) => ({
                ...prev,
                ...parsed,
              }));
            } catch (e) {
              console.error('Failed to parse provider configs', e);
            }
          }
        } else {
          showToast('Failed to load application settings', true);
        }
      } catch {
        showToast('Error loading application settings', true);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [showToast]);

  const handleSaveSettings = async () => {
    try {
      setSubmitting(true);
      const updatedSettings = {
        ...settings,
        backup_active_providers: JSON.stringify(activeProviders),
        backup_provider_configs: JSON.stringify(providerConfigs),
      };
      const res = await apiClient.put('/superadmin/settings', updatedSettings);
      if (res.ok) {
        showToast('Application settings saved successfully');
      } else {
        showToast('Failed to save settings', true);
      }
    } catch {
      showToast('Error saving settings', true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingIcon(true);
      const res = await apiClient.post(
        '/superadmin/settings/upload-pwa-icon',
        formData,
      );
      if (res.ok) {
        showToast('PWA icon uploaded successfully!');
        setIconPreview(`/pwa/icon.png?t=${Date.now()}`);
      } else {
        showToast('Failed to upload PWA icon', true);
      }
    } catch {
      showToast('Error uploading PWA icon', true);
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleProviderToggle = (provider: string, enabled: boolean) => {
    setProviderConfigs((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], enabled },
    }));

    setActiveProviders((prev) => {
      if (enabled && !prev.includes(provider)) {
        return [...prev, provider];
      } else if (!enabled && prev.includes(provider)) {
        return prev.filter((p) => p !== provider);
      }
      return prev;
    });
  };

  const handleProviderConfigChange = (
    provider: string,
    key: string,
    value: string,
  ) => {
    setProviderConfigs((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [key]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Settings & PWA Configuration
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Customize PWA manifest fields, general branding options, and configure
          database automatic backup policies.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* PWA Settings */}
        <div className="p-6 bg-surface-50 dark:bg-slate-950 border border-surface-200 dark:border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-surface-200 dark:border-slate-800">
            <Settings className="w-5 h-5 text-indigo-500" />
            <h4 className="font-bold text-gray-900 dark:text-white">
              PWA & General Branding
            </h4>
          </div>

          <div>
            <label className="label-modern text-gray-700 dark:text-gray-300">
              Application Name
            </label>
            <input
              type="text"
              className="input-modern"
              value={settings['app_name'] || ''}
              onChange={(e) => handleSettingChange('app_name', e.target.value)}
              placeholder="ProjectFlow"
            />
          </div>

          <div>
            <label className="label-modern text-gray-700 dark:text-gray-300">
              Application Short Name
            </label>
            <input
              type="text"
              className="input-modern"
              value={settings['app_short_name'] || ''}
              onChange={(e) =>
                handleSettingChange('app_short_name', e.target.value)
              }
              placeholder="ProjFlow"
            />
          </div>

          <div>
            <label className="label-modern text-gray-700 dark:text-gray-300">
              Accent Theme Color (Hex)
            </label>
            <input
              type="text"
              className="input-modern"
              value={settings['app_accent_color'] || ''}
              onChange={(e) =>
                handleSettingChange('app_accent_color', e.target.value)
              }
              placeholder="#f59e0b"
            />
          </div>

          {/* Icon upload and preview */}
          <div>
            <label className="label-modern text-gray-700 dark:text-gray-300">
              Application Custom Icon
            </label>
            <div className="mt-2 flex items-center gap-4">
              <img
                src={iconPreview}
                alt="PWA Icon Preview"
                className="w-16 h-16 rounded-xl border border-surface-200 dark:border-slate-800 bg-white p-1 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/project-flow.png';
                }}
              />
              <div className="flex-1">
                <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingIcon ? 'Uploading...' : 'Choose Icon File'}
                  <input
                    type="file"
                    accept="image/png"
                    onChange={handleIconUpload}
                    className="hidden"
                    disabled={uploadingIcon}
                  />
                </label>
                <p className="text-[10px] text-gray-400 mt-1">
                  PNG format recommended. Size: 512x512px.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Backup configuration */}
        <div className="p-6 bg-surface-50 dark:bg-slate-950 border border-surface-200 dark:border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-surface-200 dark:border-slate-800">
            <Database className="w-5 h-5 text-amber-500" />
            <h4 className="font-bold text-gray-900 dark:text-white">
              Auto Backup Schedule
            </h4>
          </div>

          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="backup_enabled"
              checked={settings['backup_enabled'] === 'true'}
              onChange={(e) =>
                handleSettingChange(
                  'backup_enabled',
                  e.target.checked ? 'true' : 'false',
                )
              }
              className="rounded border-gray-300 text-amber-500 focus:ring-amber-400"
            />
            <label
              htmlFor="backup_enabled"
              className="text-xs font-bold text-gray-700 dark:text-gray-300"
            >
              Enable Scheduled Automated Backups
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-modern text-gray-700 dark:text-gray-300">
                Backup Frequency
              </label>
              <select
                className="input-modern"
                value={settings['backup_frequency'] || 'daily'}
                onChange={(e) =>
                  handleSettingChange('backup_frequency', e.target.value)
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="label-modern text-gray-700 dark:text-gray-300">
                Preferred Time (UTC)
              </label>
              <input
                type="text"
                className="input-modern"
                value={settings['backup_time'] || '02:00'}
                onChange={(e) =>
                  handleSettingChange('backup_time', e.target.value)
                }
                placeholder="02:00"
              />
            </div>
          </div>

          <div>
            <label className="label-modern text-gray-700 dark:text-gray-300">
              Retention Period (Days)
            </label>
            <input
              type="number"
              className="input-modern"
              value={settings['backup_retention_days'] || '30'}
              onChange={(e) =>
                handleSettingChange('backup_retention_days', e.target.value)
              }
              placeholder="30"
            />
          </div>

          <div>
            <label className="label-modern text-gray-700 dark:text-gray-300">
              Custom Connection Credentials (JSON, Optional)
            </label>
            <textarea
              className="input-modern font-mono text-[10px] h-20 resize-none text-gray-900 dark:text-white"
              value={settings['backup_custom_credentials'] || ''}
              onChange={(e) =>
                handleSettingChange('backup_custom_credentials', e.target.value)
              }
              placeholder={
                '{\n  "host": "localhost",\n  "port": 5432,\n  "username": "postgres",\n  "password": "...",\n  "database": "prod_db"\n}'
              }
            />
            <p className="text-[9px] text-gray-400 mt-1">
              If blank, backups fallback to main DATABASE_URL connection
              details.
            </p>
          </div>
        </div>
      </div>

      {/* Backup Destinations Section */}
      <div className="p-6 bg-surface-50 dark:bg-slate-950 border border-surface-200 dark:border-slate-800 rounded-2xl space-y-4">
        <div className="pb-2 border-b border-surface-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-500" />
            <h4 className="font-bold text-gray-900 dark:text-white">
              Backup Storage Destinations (Multi-Provider)
            </h4>
          </div>
          <span className="text-[10px] font-bold text-gray-400 bg-surface-200 dark:bg-slate-800 px-2 py-1 rounded-full">
            Active Destinations: {activeProviders.length}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-surface-100 dark:border-slate-800/60 pb-3">
          {[
            { id: 'local', name: 'Local Server' },
            { id: 'sftp', name: 'SFTP / FTP' },
            { id: 's3', name: 'Amazon S3' },
            { id: 'google_drive', name: 'Google Drive' },
            { id: 'dropbox', name: 'Dropbox' },
          ].map((prov) => {
            const isActive = activeProviders.includes(prov.id);
            const isSelected = selectedProvider === prov.id;
            return (
              <button
                key={prov.id}
                type="button"
                onClick={() => setSelectedProvider(prov.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative flex items-center gap-2 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-white hover:bg-surface-50 border border-surface-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 dark:bg-slate-900 dark:hover:bg-slate-800'
                }`}
              >
                {prov.name}
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-surface-100 dark:border-slate-800/40 rounded-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-100 dark:border-slate-800/40">
            <div>
              <h5 className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                {selectedProvider.replace('_', ' ')} Destination Settings
              </h5>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Enable and configure details for{' '}
                {selectedProvider.replace('_', ' ')} backups.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`toggle_${selectedProvider}`}
                checked={providerConfigs[selectedProvider]?.enabled || false}
                onChange={(e) =>
                  handleProviderToggle(selectedProvider, e.target.checked)
                }
                className="rounded border-gray-300 text-indigo-500 focus:ring-indigo-400"
              />
              <label
                htmlFor={`toggle_${selectedProvider}`}
                className="text-xs font-bold text-gray-700 dark:text-gray-300"
              >
                Enable Destination
              </label>
            </div>
          </div>

          {providerConfigs[selectedProvider]?.enabled ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedProvider === 'local' && (
                <div className="md:col-span-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed bg-surface-50 dark:bg-slate-950 p-4 rounded-xl">
                  <strong>Local Backups</strong> are archived as encrypted SQL
                  zip files and stored on the local container volume under the
                  `/backups` directory. Recommended as a primary fallback
                  destination.
                </div>
              )}

              {selectedProvider === 'sftp' && (
                <>
                  <div>
                    <label className="label-modern text-gray-700 dark:text-gray-300">
                      SFTP Host / IP
                    </label>
                    <input
                      type="text"
                      className="input-modern text-gray-900 dark:text-white"
                      value={providerConfigs.sftp.host || ''}
                      onChange={(e) =>
                        handleProviderConfigChange(
                          'sftp',
                          'host',
                          e.target.value,
                        )
                      }
                      placeholder="sftp.example.com"
                    />
                  </div>
                  <div>
                    <label className="label-modern text-gray-700 dark:text-gray-300">
                      SFTP Port
                    </label>
                    <input
                      type="number"
                      className="input-modern text-gray-900 dark:text-white"
                      value={providerConfigs.sftp.port || '22'}
                      onChange={(e) =>
                        handleProviderConfigChange(
                          'sftp',
                          'port',
                          e.target.value,
                        )
                      }
                      placeholder="22"
                    />
                  </div>
                  <div>
                    <label className="label-modern text-gray-700 dark:text-gray-300">
                      SFTP Username
                    </label>
                    <input
                      type="text"
                      className="input-modern text-gray-900 dark:text-white"
                      value={providerConfigs.sftp.username || ''}
                      onChange={(e) =>
                        handleProviderConfigChange(
                          'sftp',
                          'username',
                          e.target.value,
                        )
                      }
                      placeholder="backup_user"
                    />
                  </div>
                  <div>
                    <label className="label-modern text-gray-700 dark:text-gray-300">
                      SFTP Password
                    </label>
                    <input
                      type="password"
                      className="input-modern text-gray-900 dark:text-white"
                      value={providerConfigs.sftp.password || ''}
                      onChange={(e) =>
                        handleProviderConfigChange(
                          'sftp',
                          'password',
                          e.target.value,
                        )
                      }
                      placeholder="••••••••••••"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label-modern text-gray-700 dark:text-gray-300">
                      Remote Directory Path
                    </label>
                    <input
                      type="text"
                      className="input-modern text-gray-900 dark:text-white"
                      value={providerConfigs.sftp.remotePath || ''}
                      onChange={(e) =>
                        handleProviderConfigChange(
                          'sftp',
                          'remotePath',
                          e.target.value,
                        )
                      }
                      placeholder="/var/backups/db"
                    />
                  </div>
                </>
              )}

              {selectedProvider === 's3' && (
                <>
                  <div>
                    <label className="label-modern text-gray-700 dark:text-gray-300">
                      Access Key ID
                    </label>
                    <input
                      type="text"
                      className="input-modern text-gray-900 dark:text-white"
                      value={providerConfigs.s3.accessKeyId || ''}
                      onChange={(e) =>
                        handleProviderConfigChange(
                          's3',
                          'accessKeyId',
                          e.target.value,
                        )
                      }
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                    />
                  </div>
                  <div>
                    <label className="label-modern text-gray-700 dark:text-gray-300">
                      Secret Access Key
                    </label>
                    <input
                      type="password"
                      className="input-modern text-gray-900 dark:text-white"
                      value={providerConfigs.s3.secretAccessKey || ''}
                      onChange={(e) =>
                        handleProviderConfigChange(
                          's3',
                          'secretAccessKey',
                          e.target.value,
                        )
                      }
                      placeholder="••••••••••••••••••••••••••••••••"
                    />
                  </div>
                  <div>
                    <label className="label-modern text-gray-700 dark:text-gray-300">
                      S3 Bucket Name
                    </label>
                    <input
                      type="text"
                      className="input-modern text-gray-900 dark:text-white"
                      value={providerConfigs.s3.bucketName || ''}
                      onChange={(e) =>
                        handleProviderConfigChange(
                          's3',
                          'bucketName',
                          e.target.value,
                        )
                      }
                      placeholder="my-db-backups-bucket"
                    />
                  </div>
                  <div>
                    <label className="label-modern text-gray-700 dark:text-gray-300">
                      AWS Region
                    </label>
                    <input
                      type="text"
                      className="input-modern text-gray-900 dark:text-white"
                      value={providerConfigs.s3.region || 'us-east-1'}
                      onChange={(e) =>
                        handleProviderConfigChange(
                          's3',
                          'region',
                          e.target.value,
                        )
                      }
                      placeholder="us-east-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label-modern text-gray-700 dark:text-gray-300">
                      Folder Prefix / Path
                    </label>
                    <input
                      type="text"
                      className="input-modern text-gray-900 dark:text-white"
                      value={providerConfigs.s3.prefix || ''}
                      onChange={(e) =>
                        handleProviderConfigChange(
                          's3',
                          'prefix',
                          e.target.value,
                        )
                      }
                      placeholder="db-backups/"
                    />
                  </div>
                </>
              )}

              {selectedProvider === 'google_drive' && (
                <>
                  <div className="md:col-span-2">
                    <label className="label-modern text-gray-700 dark:text-gray-300">
                      OAuth2 Access Token
                    </label>
                    <textarea
                      className="input-modern h-16 resize-none text-xs font-mono text-gray-900 dark:text-white"
                      value={providerConfigs.google_drive.accessToken || ''}
                      onChange={(e) =>
                        handleProviderConfigChange(
                          'google_drive',
                          'accessToken',
                          e.target.value,
                        )
                      }
                      placeholder="ya29.a0ARdda..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label-modern text-gray-700 dark:text-gray-300">
                      Destination Folder ID (Optional)
                    </label>
                    <input
                      type="text"
                      className="input-modern text-gray-900 dark:text-white"
                      value={providerConfigs.google_drive.folderId || ''}
                      onChange={(e) =>
                        handleProviderConfigChange(
                          'google_drive',
                          'folderId',
                          e.target.value,
                        )
                      }
                      placeholder="1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
                    />
                  </div>
                </>
              )}

              {selectedProvider === 'dropbox' && (
                <>
                  <div className="md:col-span-2">
                    <label className="label-modern text-gray-700 dark:text-gray-300">
                      Dropbox Access Token
                    </label>
                    <textarea
                      className="input-modern h-16 resize-none text-xs font-mono text-gray-900 dark:text-white"
                      value={providerConfigs.dropbox.accessToken || ''}
                      onChange={(e) =>
                        handleProviderConfigChange(
                          'dropbox',
                          'accessToken',
                          e.target.value,
                        )
                      }
                      placeholder="sl.B_..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label-modern text-gray-700 dark:text-gray-300">
                      Destination Folder Path
                    </label>
                    <input
                      type="text"
                      className="input-modern text-gray-900 dark:text-white"
                      value={providerConfigs.dropbox.folder || ''}
                      onChange={(e) =>
                        handleProviderConfigChange(
                          'dropbox',
                          'folder',
                          e.target.value,
                        )
                      }
                      placeholder="/ProjectFlowBackups"
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
              This backup storage destination is currently disabled. Toggle
              "Enable Destination" to configure parameters.
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-surface-200 dark:border-slate-800">
        <button
          onClick={handleSaveSettings}
          disabled={submitting}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow flex items-center gap-2"
        >
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Save Configuration
        </button>
      </div>
    </div>
  );
}
