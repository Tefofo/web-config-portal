import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'wcp.theme';

/**
 * Manages the portal's colour theme (light / dark / follow-system) and persists
 * the choice. Applies a class on <html> that flips the Material `color-scheme`,
 * so all `--mat-sys-*` variables switch automatically.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly media = this.document.defaultView?.matchMedia?.(
    '(prefers-color-scheme: dark)',
  );

  private readonly mode = signal<ThemeMode>(this.readStored());

  /** The user's chosen mode (light/dark/system). */
  readonly themeMode = this.mode.asReadonly();

  /** The effective theme actually applied (system resolved to light/dark). */
  readonly resolved = computed<'light' | 'dark'>(() => {
    const mode = this.mode();
    if (mode === 'system') {
      return this.media?.matches ? 'dark' : 'light';
    }
    return mode;
  });

  constructor() {
    // React to OS changes only while in "system" mode.
    this.media?.addEventListener?.('change', () => {
      if (this.mode() === 'system') {
        this.apply();
      }
    });
    this.apply();
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    this.apply();
  }

  /** Convenience toggle between light and dark (leaves "system" if that was set). */
  toggle(): void {
    this.setMode(this.resolved() === 'dark' ? 'light' : 'dark');
  }

  private apply(): void {
    const root = this.document.documentElement;
    root.classList.toggle('theme-dark', this.resolved() === 'dark');
  }

  private readStored(): ThemeMode {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
  }
}
