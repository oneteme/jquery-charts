# AGENT CONTEXT — jquery-table

Updated: 2026-02-13

## Goal
- Provide an Angular wrapper around Angular Material table.
- Integrate with `@oneteme/jquery-core` so dynamic value providers can be reused.
- Offer a simple dynamic UX inspired by GitHub repo table controls.

## Current public API
- `TableComponent` (standalone, selector: `jquery-table`)
- `TableProvider`, `TableColumnProvider`, `TableOptionAction`
- `TableCategoryProvider`, `TableCategorySliceProvider`
- helper `col(key, header, sortable?)` using `field()` from `@oneteme/jquery-core`

## Current UX contract
- Dynamic columns from config.
- Last table column can host optional `+` action for column addition.
- Column removal supported when enabled by config.
- Left-side category slice filters rows in real-time.
- External options button exposes actions:
  - Fields
  - Group by
  - Sort by
  - Field sum
  - Slice by
- Emits events only (consumer handles concrete behavior).

## Files to edit first for evolutions
- `src/lib/jquery-table.model.ts`
- `src/lib/component/table.component.ts`
- `src/lib/component/table.component.html`
- `src/lib/component/table.component.scss`
- `src/public-api.ts`

## Rules for future changes
- Keep API additive when possible (avoid breaking changes).
- Keep wrapper generic (`T = any` now, make stricter only if asked).
- Keep visual behavior simple and predictable.
- If advanced features are needed (sorting/pagination/grouping), expose as opt-in config and events first.

## Acceptance coverage status
- Dynamic add/remove columns: implemented via inputs/events.
- Category slice + interactive filtering: implemented.
- Exposed API for columns and categories: implemented.
- Unit/integration tests: present in `table.component.spec.ts`.
- Documentation with usage examples: updated in `README.md`.

## Visual customisation
All main colors are exposed as CSS custom properties on `:host` — no `::ng-deep` or `!important` needed from consumer side.

Override from the host application's global stylesheet:

```scss
jquery-table {
  /* Text */
  --jqt-title-color:       #1f2937;
  --jqt-text-color:        #111827;
  --jqt-text-secondary:    #6b7280;
  --jqt-text-muted:        #9ca3af;

  /* Surfaces */
  --jqt-surface-color:     #ffffff;
  --jqt-surface-alt-color: #f9fafb;
  --jqt-row-hover-bg:      #f3f4f6;

  /* Borders */
  --jqt-border-color:      #e5e7eb;

  /* Group rows (groupBy) */
  --jqt-group-bg:          #eef2f7;
  --jqt-group-bg-hover:    #e4ecf4;
  --jqt-group-accent:      #94a3b8;
  --jqt-group-border:      #d1d9e4;

  /* Accent & danger */
  --jqt-primary-color:     #1d4ed8;
  --jqt-danger-color:      #dc2626;
}
```

Full reference in `README.md` → section *Personnalisation visuelle*.
