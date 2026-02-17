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
