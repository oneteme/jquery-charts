# Pilotage — jquery-organizer

> Fichier vivant. Mettre à jour à chaque évolution.
> Contexte détaillé : docs/contexte-organizer-externalization.md
> README librairie : projects/oneteme/jquery-organizer/README.md

---

## État global

`jquery-organizer` est une librairie Angular standalone opérationnelle depuis le 2026-06-18.
Elle expose `OrganizerButtonComponent` et `SlicePanelComponent`, intégrés et validés dans `inspect-app`.

---

## Ce qui est terminé

### Librairie jquery-organizer

- [x] Création du projet indépendant (structure, config, build) — 2026-06-18
- [x] `OrganizerButtonComponent` : mat-menu, 6 sections, lazy-loading avec cache, FieldState
- [x] `OrganizerSliceState` : interface + `@Output() sliceStateChange` sur le bouton
- [x] `onFetchSliceData` dans `OrganizerConfig` : fetch automatique + émission slice state
- [x] `SlicePanelComponent` migré depuis `jquery-table` vers `jquery-organizer` (i18n inlinée, sans token JQT_I18N)
- [x] `@HostBinding('class.collapsed')` sur `SlicePanelComponent` pour CSS collapsible
- [x] `public-api.ts` exporte : `OrganizerButtonComponent`, `OrganizerButtonModule`, `SlicePanelComponent`, `SliceConfig`, `SliceColumnDef`, `SliceCategory`, `OrganizerSliceState`, toutes les interfaces
- [x] Build `npm run b5` : SUCCESS

### jquery-table rétrocompatibilité

- [x] `table.component.ts` importe `SlicePanelComponent` depuis `@oneteme/jquery-organizer`
- [x] `public-api.ts` re-exporte `SlicePanelComponent`, `SliceConfig`, `SliceColumnDef`, `SliceCategory` depuis `@oneteme/jquery-organizer`
- [x] Build `npm run b3` : SUCCESS

### inspect-app — page de test `/kpi-test/request/rest`

- [x] Correction du bug "undefined" dans les légendes : `buildSeries()` appelé sur données brutes, `pivotByStack()` ensuite
- [x] Correction `REST_VOLUMETRY_CHART_CONFIG` : `buildAlias()` et `value()` alignés
- [x] `OrganizerButtonComponent` intégré sur les 4 charts (Statut, Performance, Volumétrie, Latence)
- [x] Single-select toggle sur les filtres (pas d'accumulation)
- [x] `onFetchSliceData` configuré → `(sliceStateChange)` piloté automatiquement
- [x] `slice-panel` affiché en sidebar avec largeur fixe 260px / repliée 42px avec transition CSS
- [x] `$xxxFilteredValues` transmis aux fetch API
- [x] Junction `node_modules/@oneteme/jquery-organizer` corrigée (pointait vers l'ancien dossier)

---

## Backlog

### Court terme

| # | Ticket | Priorité |
|---|--------|----------|
| A | Intégrer `OrganizerButtonComponent` sur la page KPI production (`/kpi/request/rest`) en remplacement du menu ad-hoc actuel | Haute |
| B | Valider que `jquery-echarts` peut utiliser `OrganizerButtonComponent` sans modification (critère de décentralisation) | Haute |
| C | Supprimer `DynamicChartComponent` ou le faire déléguer à `OrganizerButtonComponent` | Moyenne |

### Moyen terme

| # | Ticket | Priorité |
|---|--------|----------|
| D | Ajouter `ViewState.indicator` dans `jquery-core` (optionnel, non breaking) | Moyenne |
| E | Ajouter `groupByChanged` / `indicatorChanged` dans le type union `ViewEvent` de core | Basse |
| F | Intégrer `OrganizerButtonModule` dans `jquery-table` (remplacer le bouton View hardcodé) | Basse |
| G | Tests unitaires : `OrganizerButtonComponent`, `SlicePanelComponent`, helpers | Basse |

---

## Décisions structurantes (non révisables)

Voir `docs/contexte-organizer-externalization.md` section 7.

---

## Règle de mise à jour

Quand un ticket passe en DONE :
1. Le déplacer dans "Ce qui est terminé"
2. Mettre à jour `contexte-organizer-externalization.md` si l'architecture change
3. Mettre à jour `projects/oneteme/jquery-organizer/README.md` si l'API publique change


> Fichier vivant. A mettre a jour au fil du developpement.
> Reference contexte global: docs/contexte-organizer-externalization.md

---

## OBJECTIFS COURANTS

> Preciser cette section a chaque evolution majeure.

- [x] Finaliser la vision globale du perimetre Organizer
- [x] Cartographier l'etat actuel dans jquery-table (audit)
- [x] Etablir le contrat cible stable dans jquery-core
- [x] Migrer jquery-table sur le nouveau contrat sans regression
- [x] Rendre Organizer disponible sur jquery-highcharts et jquery-apexcharts (phase 4 basique)
- [x] Créer le projet indépendant jquery-organizer (Phase 0-bis Organizer) — BUILD SUCCESS 2026-06-18
- [x] Implémenter OrganizerButtonComponent avec mat-menu (lazy-loading, caching, FieldState enum) — 2026-06-18
- [ ] Rendre possible via configuration les fonctionnalites avancees identifiees dans kpi-global (indicateur, series dynamiques, events enrichis), de facon optionnelle et non breaking
- [ ] Valider que Organizer peut remplacer DynamicChartComponent dans kpi-global sans forcer d'usage de ces options pour les autres consommateurs
- [ ] Valider l'intégration triviale avec jquery-echarts (critère d'acceptation décentralisation)

---

## BACKLOG TICKETS

Statuts possibles: `TODO` | `IN PROGRESS` | `DONE` | `BLOCKED` | `ABANDONED`

---

### PHASE 0 — Cadrage et inventaire

| # | Ticket | Statut | Notes |
|---|--------|--------|-------|
| 0.1 | Cartographier tous les points View actuels dans jquery-table (bouton, panel, fields, group, slice, positionnement) | DONE | voir AUDIT ci-dessous |
| 0.2 | Lister les dependances implicites (services, modele, lifecycle, templates) | DONE | voir AUDIT ci-dessous |
| 0.3 | Formaliser les invariants comportementaux (ce qui ne doit pas changer) | DONE | voir AUDIT ci-dessous |
| 0.4 | Dresser la matrice "comportement actuel" vs "cible" | DONE | voir MATRICE ci-dessous |
| 0.5 | Evaluer si slice-chart dans /table/slice-chart est reutilisable ou a abandonner | DONE | POC a abandonner — voir T-001 |

---

## AUDIT PHASE 0 — Etat actuel jquery-table

### A — Points View dans jquery-table

#### Bouton View
- Fichier: `table.component.html` (zone `table-toolbar-right`)
- Condition d'affichage: `showViewButton` getter → `config.view?.enabled === true`
- Trigger: `MatMenuTrigger` (`#viewMenuTrigger`) — reference `@ViewChild` dans TS pour fermeture programmatique
- Positionnement: purement CSS (fixe dans `table-toolbar-right`) — pas de logique de position dynamique JS

#### Panel View (mat-menu arborescent)
- `#viewMenu` — menu racine
  - Item "Champs" → `#fieldsSubMenu` (si `showFields`)
  - Item "Group by" → `#groupBySubMenu` (si `showGroupBySection`)
  - Item "Slice by" → `#sliceBySubMenu` (si `showAddSliceButton`)
- Les trois sous-menus sont des `mat-menu` imbriques avec stop-propagation pour eviter fermeture intempestive

#### Fields (Champs)
- Source: `menuBaseColumns` (non-optional) + `menuOptionalColumns` (optional) depuis `resolvedConfig.columns`
- State: `activeColumns: TableColumnProvider[]` dans le composant + flag `userCustomizedColumns`
- Actions: `onColumnVisibilityChange()`, `onAddColumn()`, `onRemoveColumn()`
- `allowColumnRemoval` flag depuis `config.view?.enableColumnRemoval`
- Drag & drop colonnes gere separement: `config.view?.enableColumnDragDrop` → `isColumnDragDropEnabled`

#### Group by
- Source: `groupByColumns` getter — filtre `groupable !== false` + header present (ou `groupable === true`)
- State: `activeGroupByKey: string | null`
- Action: `onGroupByChange()` — ferme aussi le `viewMenuTrigger` apres selection
- Sub-state associe: `_collapsedGroups`, `_groupPages`, `groupSortOrder`, `_defaultGroupCollapsed`
- Label affiche: `activeGroupByLabel` getter

#### Slice by
- Slices **statiques**: depuis `config.slices` — deleguees a `SlicePanelComponent` via `@ViewChild slicePanelRef`
  - Menu: `staticSlicesForMenu` — Array `{key, title, icon}`
  - Toggle: `toggleStaticSlice(key)` → `slicePanelRef.toggleStaticSlice(key)`
  - Visibilite: `isStaticSliceVisible(key)` → `slicePanelRef.isStaticSliceVisible(key)`
- Slices **dynamiques**: colonnes avec `sliceable !== false` + header
  - State: `_allDynamicSliceColumns`, `_activeDynamicSliceColumns`, `_availableColumnsForDynamicSlice`
  - Toggle: `toggleDynamicSlice(col)` → `addDynamicSlice()` / `removeDynamicSliceByKey()` → `slicePanelRef`
  - Feed-back: `onDynamicSliceKeysChange()` output du SlicePanelComponent
- Label: `_activeSliceByLabel` (calcule dans `_computeSliceLabel()`)
- Filtre final: `activeSliceFilter` → function predicate mis a jour via `onSliceFilterChange()` output du SlicePanelComponent

#### SlicePanelComponent
- Fichier: `slice-panel.component.ts`
- Inputs: `sliceConfigs`, `columns` (type `SliceColumnDef`), `data`, `lazyData`, `lazyStatus`, `showToggle`
- Outputs: `filterChange`, `activeKeysChange`, `dynamicSliceKeysChange`, `collapsedChange`
- Deja externalisee (export public-api) avec son propre modele (`SliceColumnDef`, `SliceConfig`)
- `SliceColumnDef` = sous-ensemble de `TableColumnProvider` (sans rendu/tri/suppression)

### B — Dependances implicites

| Dependance | Role dans View | Type |
|-----------|----------------|------|
| `MatMenuModule` / `MatMenuTrigger` | rendu panel View | Angular Material |
| `MatButtonModule` / `MatIconModule` | bouton View | Angular Material |
| `ChangeDetectorRef` (inject) | markForCheck apres slice updates | Angular |
| `ElementRef` (inject) | _measureHeaderHeight (sticky) | Angular DOM |
| `@ViewChild SlicePanelComponent slicePanelRef` | delegation toggle/visibility slices | Angular |
| `@ViewChild MatMenuTrigger viewMenuTrigger` | fermeture programmatique apres groupBy | Angular |
| `resolvedConfig: TableProvider` | config effective (fusionne inputs) | interne |
| `activeColumns: TableColumnProvider[]` | colonnes visibles actifs | interne state |
| `userCustomizedColumns: boolean` | flag preservation customisation user | interne state |
| `_lazyColumnStatus/Data` | etat lazy fetch colonnes | interne state |
| `refreshViewModel()` | recalcul de tout le state View + data | interne pipeline |

### C — Invariants comportementaux (a ne pas casser)

1. `showViewButton` = porte d'entree unique → si false, tout le View est absent du DOM
2. La fermeture automatique du menu apres selection Group by (`viewMenuTrigger?.closeMenu()`)
3. `userCustomizedColumns` preserve la customisation meme apres changement de data/config
4. `allowColumnRemoval` bloque la suppression des colonnes de base si desactive
5. Une colonne sans header n'apparait dans groupBy/sliceBy que si `groupable/sliceable === true` est explicite
6. Les lazy columns ont un cycle de vie independant (fetch, cancel, retry) — le View ne le pilote pas directement
7. `_computeSliceLabel()` doit refleter l'etat reel de slicePanelRef (count visible)
8. `onSliceFilterChange` declenche `refreshViewModel()` ET `paginator.firstPage()`
9. `getMenuTrigger` closing: appel uniquement si `key !== null` dans `onGroupByChange`

### D — Bilan POC slice-chart (/table/slice-chart)

- Utilise `SlicePanelComponent` directement depuis `@oneteme/jquery-table`
- Filtre applique manuellement pour recomputer les donnees du chart
- Montre CE QUE les charts ont besoin: `sliceConfigs`, `columns`, `data` et l'output `filterChange`
- **Verdict**: a abandonner comme pattern d'integration — mais utile comme reference pour comprendre les besoins charts

---

## MATRICE — Comportement actuel vs cible

| Comportement | Actuel (jquery-table) | Cible (View externalisé) |
|---|---|---|
| Activer View | `config.view.enabled: true` | identique + ligne HTML optionnelle |
| Bouton View | hardcode dans table.component.html | composant/directive standalone |
| Panel Champs | hardcode mat-menu dans table.component.html | template du composant View |
| Panel Group by | hardcode mat-menu dans table.component.html | template du composant View |
| Panel Slice by | hardcode mat-menu + delegate slicePanelRef | template du composant View + SlicePanelComponent |
| Sources fields | `resolvedConfig.columns` | `ViewConfig.fields` → alimente par le renderer |
| Sources groupBy | getter `groupByColumns` (filtre colonnes) | `ViewConfig.groupBy.fields` |
| Sources sliceBy | getter `allDynamicSliceColumns` + `config.slices` | `ViewConfig.sliceBy.fields` + `sliceConfigs` |
| State fields | `activeColumns[]` dans TableComponent | `ViewState.selectedFields` dans ViewFacade |
| State groupBy | `activeGroupByKey` dans TableComponent | `ViewState.groupBy` dans ViewFacade |
| State sliceBy | `_activeDynamicSliceColumns` + delegue slicePanelRef | `ViewState.sliceBy` dans ViewFacade |
| Fermeture menu apres groupBy | `viewMenuTrigger.closeMenu()` hardcode | event ViewEvent.applied → renderer ferme |
| Positionnement bouton | CSS statique | CSS statique (pas de changement prevu) |
| Lazy columns | etat independant dans TableComponent | inchange (hors perimetre View) |

---

### PHASE 1 — Stabilisation interne jquery-table

| # | Ticket | Statut | Notes |
|---|--------|--------|-------|
| 1.1 | Creer ViewFacade interne (etat + actions + events) | DONE | `src/lib/component/view/view.facade.ts` |
| 1.2 | Centraliser la logique ouverture/fermeture panel dans ViewFacade | DONE | ouverture/fermeture = MatMenuTrigger Angular — pas de logique metier, reste dans le template |
| 1.3 | Centraliser le peuplement des fields dans ViewFacade | DONE | `update()` + `_refreshDefaultColumns()` dans ViewFacade |
| 1.4 | Centraliser group/slice state dans ViewFacade | DONE | `ViewGroupByState`, `ViewSliceByState`, `onDynamicSliceKeysChange()` dans ViewFacade |
| 1.5 | Centraliser le positionnement dynamique du bouton dans ViewFacade | DONE | pas de logique JS — CSS statique confirme en phase 0 |
| 1.6 | Rebrancher jquery-table sur ViewFacade | DONE | TableComponent delègue entièrement via `this._view` — compile sans erreur |
| 1.7 | Valider parite fonctionnelle complete (avant/apres) | DONE | ng build --configuration development : 0 erreur, warnings CommonJS pre-existants uniquement |

---

### PHASE 2 — Contrat partage dans jquery-core

| # | Ticket | Statut | Notes |
|---|--------|--------|-------|
| 2.1 | Definir ViewConfig (interfaces + helpers purs) | DONE | `ViewConfig` dans `jquery-view.model.ts` |
| 2.2 | Definir ViewField | DONE | `ViewField` dans `jquery-view.model.ts` |
| 2.3 | Definir ViewState | DONE | `ViewState` dans `jquery-view.model.ts` |
| 2.4 | Definir ViewContext | ABANDONED | Pas necessaire pour Phase 2 — ajout possible si besoin en Phase 4 |
| 2.5 | Definir ViewEvent | DONE | `ViewEvent` type union dans `jquery-view.model.ts` |
| 2.6 | Implementer helpers purs associes (sans DOM) | DONE | `viewField`, `groupableViewFields`, `sliceableViewFields`, `initialViewState` |
| 2.7 | Exporter depuis public-api de jquery-core | DONE | `export * from './lib/jquery-view.model'` dans `public-api.ts` |
| 2.8 | Rebrancher jquery-table sur le contrat core | DONE | `ViewFacade` importe `ViewField/ViewState/ViewEvent` depuis `@oneteme/jquery-core`, re-exporte le contrat, ajoute `toViewState()` et `ViewFacade.toViewField()`, events `fieldsChanged` emettent `fieldIds` |

---

### PHASE 3 — Modes d'integration

| # | Ticket | Statut | Notes |
|---|--------|--------|-------|
| 3.1 | Implementer activation via config (view: { ... }) | DONE | Deja fonctionnel via `config.view.enabled = true` dans `TableProvider` |
| 3.2 | Implementer activation via HTML (directive ou composant hote) | DONE | `@Input() view?: TableViewConfig` sur `TableComponent` — prend le dessus sur `config.view` si defini |
| 3.3 | Garantir equivalence comportementale config == HTML | DONE | `buildEffectiveConfig()` fusionne `this.view ?? config.view` — comportement identique |
| 3.4 | Valider regression zero sur jquery-table | DONE | `npm run cb3` exit 0, 0 erreurs TypeScript |

---

### PHASE 4 — Generalisation charts

| # | Ticket | Statut | Notes |
|---|--------|--------|-------|
| 4.1 | Analyser les besoins View specifiques jquery-highcharts | DONE | Champs = series statiques (nom string) ; visibilite via SerieProvider.visible ; type switch/pivot absorbables plus tard dans View menu |
| 4.2 | Implementer adaptateur ViewState -> Highcharts (series/categories/group) | DONE | `ChartViewFacade` dans `jquery-highcharts/src/lib/component/view/` ; `@Input() view?` sur ChartComponent ; `_effectiveConfig` passe la config avec flags visible |
| 4.3 | Analyser les besoins View specifiques jquery-apexcharts | DONE | Meme contrat que highcharts (meme ChartProvider) |
| 4.4 | Implementer adaptateur ViewState -> ApexCharts | DONE | `ChartViewFacade` dans `jquery-apexcharts/src/lib/component/view/` ; `@Input() view?` sur ChartComponent ; template mis a jour (`_effectiveConfig`) |
| 4.5 | Valider non-regression pivot, type switch, loading/no-data/error sur highcharts | DONE — SIMPLIFIE | Pivot/toolbar non preserves intentionnellement (seront absorbes dans View menu a terme) ; builds cb1+cb2 exit 0 |

Helpers purs ajoutes dans `jquery-core/src/lib/jquery-view.model.ts` :
- `viewFieldsFromChartSeries(series)` — extrait ViewField depuis les noms statiques
- `applyViewStateToSeries(provider, state)` — retourne ChartProvider avec visible flags appliques

---

### PHASE 0-bis — Création du projet jquery-organizer (indépendant)

> Prerequis: Phase 4 (Organizer externalisé sur charts) terminée.
> Objectif: extraire le composant OrganizerButtonComponent du contexte jquery-table vers un nouveau projet indépendant.
> Statut: INITIALIZATION COMPLETE - Structure created, Decisions documented

| # | Ticket | Statut | Notes |
|---|--------|--------|-------|
| 0b.1 | Décisions de cadrage (13 questions → réponses strategiques) | ✅ DONE (2026-06-18) | Document: docs/cadrage-decisions.md. Décisions prises sur: indicateur (CORE), séries dynamiques (callback), stack (menu View), localisation (nouveau projet), CSS (Material+tokens), menus contextes, events (enrichi), config (@Input), lifecycle (hybrid), migrations |
| 0b.2 | Créer la structure du nouveau projet jquery-organizer | ✅ DONE (2026-06-18) | Folder: projects/oneteme/jquery-organizer. Created: config files (package.json, ng-package.json, tsconfig), component (TS+HTML+SCSS+Module), models (interfaces, constants), public-api, README.md (~500 lines), CONTEXT.md, PROGRESS.md, .gitignore. Total: ~1800 lines. |
| 0b.3 | Implémenter OrganizerButtonComponent (logique complète menus) | ✅ DONE (2026-06-18) | Component complet: 200+ lignes logique (onFieldToggle, onIndicatorSelect, onGroupBySelect, onStackSelect, onSliceClick, loadFieldData avec caching, onReset, emitChange). Template: mat-menu avec 6 sections. Stylesheet: Material + CSS tokens. Build: `npm run b5` EXIT 0 en 4.094s |
| 0b.4 | Validation critères décentralisation et tests par utilisation | 📋 IN PROGRESS | Build verification ✅ done. Next: jquery-echarts integration test (no code changes), KPI test, dependency graph audit, config explicitness audit |

---

### PHASE 4-bis — Extension optionnelle du contrat core pour besoins kpi-global

> Reference: docs/contexte-kpi-global.md
> Contexte: la branche kpi-global implémente un menu Organizer ad-hoc sur les charts (DynamicChartComponent).
> Objectif: rendre ces besoins couverts par View de facon OPTIONNELLE — l'usage standard (table, series statiques) ne doit subir aucun impact.
> Principe directeur: tout ce qui est ajoute ici est additionnel et desactive par defaut. Aucune breaking change.

| # | Ticket | Statut | Notes |
|---|--------|--------|-------|
| 4b.1 | Ajouter `indicator?: string` dans `ViewState` (optionnel, desactive par defaut) | TODO | Voir Q-06 — champ ignore si absent; n'affecte pas les usages sans indicateur |
| 4b.2 | Ajouter `groupByChanged` et `indicatorChanged` dans le type union `ViewEvent` (en complement de `fieldsChanged`) | TODO | Additionnel — les consommateurs qui n'ecoutent que `fieldsChanged` ne voient aucun changement |
| 4b.3 | Creer un helper complementaire `applyViewStateToSeriesDynamic()` pour les series entierement deduites des donnees (valeurs inconnues a la config) | TODO | NE PAS modifier `applyViewStateToSeries()` existant — creer un helper separe specialise |
| 4b.4 | Documenter le pattern d'integration recommande pour remplacer `dynamic-chart` par `<chart [view]="...">` | TODO | Montrer que les options avancees (indicateur, series dynamiques) s'activent uniquement via config, pas par defaut |

### PHASE 5 — Validation et documentation

| # | Ticket | Statut | Notes |
|---|--------|--------|-------|
| 5.1 | Tests unitaires: contrat core (helpers + state transitions) | TODO | |
| 5.2 | Tests unitaires: ViewFacade table | TODO | |
| 5.3 | Tests unitaires: adaptateurs chart | TODO | |
| 5.4 | Tests integration: non-regression table | TODO | |
| 5.5 | Tests integration: scenarios chart critiques | TODO | |
| 5.6 | Mettre a jour public-api.ts et CHANGELOG | TODO | |

---

### PHASE 6 — Integration kpi-global (inspect-app)

> Prerequis: Phase 4-bis terminee.
> Objectif: remplacer DynamicChartComponent dans inspect-app/kpi-global par le View externalisé.

| # | Ticket | Statut | Notes |
|---|--------|--------|-------|
| 6.1 | Verifier que `ViewState.groupBy` peut remplacer `config.selectedGroup` dans dynamic-chart | TODO | Axe X du graphique = groupBy dans le vocabulaire View |
| 6.2 | Verifier que `ViewState.selectedFields` peut remplacer `config.selectedSerie` | TODO | Series = fields visibles dans le vocabulaire View |
| 6.3 | Integrer l'indicateur (count/sum/avg) dans le menu View chart | TODO | Bloque par decision Q-06 |
| 6.4 | Tester remplacement de `<dynamic-chart>` par `<chart [view]="...">` sur une vue statistic | TODO | Vue cible : statistic/request/http |
| 6.5 | Traiter le cas drill-down (dynamic-table laterale au clic slice) — hors perimetre View ou SlicePanelComponent etendu ? | TODO | Voir Q-07 |

---

## TRAJECTOIRES — CORRECTIONS ET DECISIONS

> Quand une mauvaise direction est prise, noter ici: PROBLEME → MAUVAISE TRAJECTOIRE → BONNE TRAJECTOIRE.
> Sert de memoire pour ne pas reproduire les memes erreurs.

---

### T-001 — POC slice-chart non cible

- Contexte: externalisation partielle de slice-panel commencee dans table/slice-chart
- Mauvaise trajectoire: travailler uniquement sur slice-panel et l'implementer via le POC existant
- Bonne trajectoire: traiter l'ensemble du systeme View (bouton + panel + fields + group + slice), le POC sert de reference pour comprendre les besoins charts (inputs: sliceConfigs/columns/data, output: filterChange) mais ne doit pas conditionner l'implementation finale
- Statut correction: FERME — POC documente comme reference, non comme cible

### T-002 — NG0100 sur isColumnVisible après getter activeColumns

- Contexte: après refactoring ViewFacade, `activeColumns` était devenu un getter retournant `_view.fields.activeColumns`
- Mauvaise trajectoire: getter sur objet mutable externe — entre la passe de rendu Angular et la passe de vérification (dev mode), `_view.update()` peut reconstruire le tableau, faisant changer `isColumnVisible` → NG0100
- Bonne trajectoire: `activeColumns` redevient une propriété stable sur `TableComponent`, synchronisée depuis `_view.fields.activeColumns` dans `refreshViewModel()` après chaque `_view.update()`. La facade reste source de vérité, la propriété est un snapshot stable qu'Angular peut suivre.
- Statut correction: FERME

### T-003 — click non recu dans mat-menu sous-menu custom

- Contexte: les boutons des sous-menus View (fields, groupBy, sliceBy) utilisaient `(click)` binding Angular
- Mauvaise trajectoire: les `(click)` ne firaient jamais — Angular Material CDK attache des listeners en phase capture sur les overlays mat-menu qui consomment le click avant dispatch Angular
- Bonne trajectoire: passer tous les boutons de `(click)` a `(mousedown)` — fires avant la phase capture CDK. Le div parent conserve `(mousedown)="$event.stopPropagation()"` pour garder le menu ouvert
- Statut correction: FERME

> Questions sans reponse tranchee. A fermer au fil du developpement.

| # | Question | Priorite | Statut |
|---|----------|----------|--------|
| Q-01 | Doit-on creer une lib dediee jquery-view plutot que surcharger jquery-core si la couche UI View est significativement mutualisee ? | HAUTE | OUVERTE — penchant actuel: rester dans jquery-core tant que le contrat est sans DOM |
| Q-02 | Le positionnement dynamique du bouton doit-il etre gere par une directive ou par des styles/tokens CSS ? | MOYENNE | FERMEE — CSS statique, pas de logique JS de positionnement (confirmé par audit) |
| Q-03 | Quelle est la source de verite pour les fields disponibles dans un chart (series, axes, categories) ? | HAUTE | PARTIELLEMENT FERMEE — pour la table: `resolvedConfig.columns` filtrés. Pour les charts: `ChartProvider.series` (names/stack) + xaxis (categories). Mapping a definir en phase 4 |
| Q-04 | L'event ViewEvent doit-il etre synchrone ou Observable ? | MOYENNE | FERMEE — Observable (RxJS deja partout dans table + highcharts, coherence) |
| Q-05 | Faut-il un mode "read-only" pour View (afficher sans permettre la modification) ? | BASSE | OUVERTE |
| Q-06 | L'indicateur (count/sum/avg) doit-il entrer dans `ViewState` ou rester gere cote vue hote ? | HAUTE | ORIENTATION: option (a) `ViewState.indicator?: string` champ optionnel — nul = fonctionnement inchange pour tous les usages sans indicateur. La vue hote active la fonctionnalite via `ViewConfig.enableIndicator?: true` |
| Q-07 | Le drill-down (table laterale au clic slice de kpi-global) est-il dans le perimetre View ou hors perimetre ? | HAUTE | OUVERTE — pattern specifique a kpi-global, probablement hors perimetre View generique |

---

## DECISIONS ACTEES

> Decisions definitives, ne pas revenir dessus sauf raison explicite documentee.

| # | Decision | Date | Raison |
|---|----------|------|--------|
| D-01 | Le contrat View (config/state/events) est dans jquery-core | 2026-03-17 | shared entre les 3 renderers |
| D-02 | Le rendu UI (bouton, panel, positioning) reste dans chaque renderer | 2026-03-17 | separation DOM/metier, flexibilite |
| D-03 | Backward compatibility obligatoire sur jquery-table | 2026-03-17 | pas de breaking change |
| D-04 | Deux modes d'integration: config ET html avec equivalence comportementale | 2026-03-17 | UX integratrice flexible |
| D-05 | (mousedown) a la place de (click) pour les boutons des sous-menus View custom | 2026-03-20 | Angular Material CDK capture les click en phase capture sur les overlays mat-menu |
| D-06 | Toute extension du contrat View est optionnelle et backward-compatible | 2026-03-20 | View est global — l'usage standard (table, series statiques) ne doit jamais etre impacte par des fonctionnalites avancees ajoutees pour un cas specifique. Toute nouvelle capacite s'active via un flag optionnel dans ViewConfig ou un champ nullable dans ViewState. Les helpers existants ne sont jamais modifies, seulement complementes. |

---

## CHANGELOG DEVELOPPEMENT

> Resumes concis de ce qui a ete fait, dans quel ordre, et pourquoi.

| Date | Action | Ticket(s) | Detail |
|------|--------|-----------|--------|
| 2026-03-17 | Initialisation du plan et fichiers de contexte | - | Creation docs/contexte-view-externalisation.md et docs/pilotage-view-externalisation.md |
| 2026-03-17 | Audit complet Phase 0 | 0.1 0.2 0.3 0.4 0.5 | Cartographie View table, dependances, invariants, matrice actuel/cible, verdict POC slice-chart |
| 2026-03-17 | Creation ViewFacade + rebranchement TableComponent | 1.1 1.2 1.3 1.4 1.5 1.6 | `view/view.facade.ts` creee, TableComponent delègue entièrement — tsc 0 erreur lib + app |
| 2026-03-17 | Validation parite fonctionnelle Phase 1 | 1.7 | ng build development : 0 erreur — Phase 1 complete |
| 2026-03-20 | Fix slice hidden activable (click non recu mat-menu) | T-003 D-05 | `(click)` → `(mousedown)` sur tous les boutons sous-menus View — cause: CDK capture phase |
| 2026-03-20 | Fix reset _staticSliceHiddenKeys a chaque refreshViewModel | - | Comparaison par contenu (_setsEqual) au lieu de reference — buildEffectiveConfig() retourne un nouvel objet a chaque appel |
| 2026-03-20 | Analyse branche kpi-global inspect-app | 4b.1-4b.4 Q-06 Q-07 | Creation docs/contexte-kpi-global.md — identification des 3 besoins non couverts: indicateur, series dynamiques, events enrichis |
