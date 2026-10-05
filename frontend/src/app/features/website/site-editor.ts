import { SiteDocument } from '../../core/models/site.model';

/**
 * Contract implemented by each per-template editor component. The Website
 * shell drives save/publish by reading validity and building the document
 * from whichever editor is active.
 */
export interface TemplateEditor {
  /** True when the editor's form is valid and safe to save. */
  isValid(): boolean;
  /** Marks all controls touched so validation messages show. */
  markAllTouched(): void;
  /** Builds the current site document from the form. */
  buildDocument(): SiteDocument;
  /** True when the form has unsaved edits. */
  isDirty(): boolean;
  /** Clears the dirty flag after a successful save. */
  markPristine(): void;
}
