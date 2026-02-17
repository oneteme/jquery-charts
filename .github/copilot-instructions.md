# Copilot Instructions — jquery-charts (oneteme)

## Scope
Primary libraries to consider first:
- `projects/oneteme/jquery-core`
- `projects/oneteme/jquery-highcharts`

## Architecture mental model
- `jquery-core` = source of truth for chart data contract and generic transformations.
- `jquery-highcharts` = Angular + Highcharts renderer that implements the core contract.
- When a request impacts data shape, pivot, categories, sorting, or provider semantics: start in `jquery-core`.
- When a request impacts rendering, lifecycle, loading, map, or chart-type-specific options: start in `jquery-highcharts`.

## High-priority files
Core:
- `projects/oneteme/jquery-core/src/public-api.ts`
- `projects/oneteme/jquery-core/src/lib/jquery-core.model.ts`

Highcharts:
- `projects/oneteme/jquery-highcharts/src/public-api.ts`
- `projects/oneteme/jquery-highcharts/src/lib/component/chart.component.ts`
- `projects/oneteme/jquery-highcharts/src/lib/directive/chart.directive.ts`
- `projects/oneteme/jquery-highcharts/src/lib/directive/utils/config/chart-config-registry.ts`
- `projects/oneteme/jquery-highcharts/src/lib/directive/utils/config/map-config.ts`
- `projects/oneteme/jquery-highcharts/src/lib/directive/utils/loading.ts`
- `projects/oneteme/jquery-highcharts/src/lib/directive/utils/toolbar.ts`
- `projects/oneteme/jquery-highcharts/src/lib/directive/utils/highcharts-modules.ts`

## Contract rules (do not break unless explicitly requested)
- Keep `ChartProvider` / `SerieProvider` compatibility from `@oneteme/jquery-core`.
- Preserve supported `ChartType` behavior across existing chart families.
- Keep `buildChart(...)` behavior consistent for pivot, continue, xorder, and default values.

## Highcharts-specific rules
- Prefer extending chart behavior via registry in `chart-config-registry.ts`.
- Avoid ad-hoc type branching in `chart.directive.ts` when registry extension is possible.
- Preserve post-merge critical enforcement (`enforceCriticalOptions`) for chart options.
- Keep loading/no-data/error behavior centralized via `loading.ts`.

## Map-specific rules
- Respect `mapEndpoint`, `mapParam`, `mapDefaultValue`, `mapJoinBy`, `mapColor` contract.
- Keep `DEFAULT_MAP_JOINBY` compatibility.
- If map data format conversion is required, use map config helpers (standard <-> map), not one-off transforms.

## Toolbar/pivot rules
- `ChartComponent` owns type cycling and pivot toggling behavior.
- `toolbar.ts` emits `previous`, `next`, `pivot`; keep this event contract stable.
- `canPivot` restrictions by chart type must remain coherent.

## Packaging and side effects
- Do not remove side-effect init of Highcharts modules:
  - `projects/oneteme/jquery-highcharts/src/lib/directive/utils/highcharts-modules.ts`
- Keep `public-api.ts` exports stable unless task explicitly asks API changes.

## Known cautions
- `ChartType` includes `string`; keep runtime guards robust.
- `projects/oneteme/jquery-core/src/lib/stream.ts` exists but is not currently exported in `public-api.ts`.
- Minimize changes and avoid unrelated refactors.

## Change strategy
1. Find the contract boundary (core vs renderer).
2. Implement smallest possible fix at root cause.
3. Keep backward compatibility.
4. Validate with targeted checks/tests when available.

## Commit message conventions
- Write concise, professional commit messages.
- Use a short title line + an important-changes list.
- Focus only on meaningful changes (contract, behavior, risk, compatibility).
- Avoid noise (format-only details, trivial renames) unless they impact behavior.

Preferred format:

`<type>(<scope>): <short summary>`

`- <important change 1>`
`- <important change 2>`
`- <important impact/risk/compatibility note>`

Recommended types:
- `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

## Test and validation reporting
- Report validation in concise bullets, only what matters.
- Mention commands run and result status (`pass` / `fail`).
- If tests are not run, state why in one short bullet.
- If failures are unrelated, explicitly mark them as unrelated.
