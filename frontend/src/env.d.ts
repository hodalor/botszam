interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  /** Canonical site origin for Open Graph URLs, e.g. https://botszam.com */
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
