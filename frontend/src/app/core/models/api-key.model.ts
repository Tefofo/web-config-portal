/**
 * Metadata for an API key. The raw key and its hash are never returned by the
 * backend after creation — only this non-sensitive metadata.
 */
export interface ApiKeyMetadata {
  id: string;
  tenantId: string;
  applicationId: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

/**
 * Response from creating an API key. `key` is the RAW secret and is returned
 * exactly ONCE — it must be surfaced to the user immediately and never stored.
 */
export interface CreatedApiKey {
  id: string;
  name: string;
  prefix: string;
  key: string;
  applicationId: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreateApiKeyRequest {
  name: string;
  expiresAt?: string;
}
