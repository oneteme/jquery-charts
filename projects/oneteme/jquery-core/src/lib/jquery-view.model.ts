import { ChartProvider, SerieProvider, XaxisType, YaxisType } from './jquery-core.model';

/** Descripteur générique d'un champ disponible dans le panneau Organizer. */
export interface OrganizerFieldDef {
  /** Identifiant unique du champ (ex: clé de colonne, nom de série). */
  id: string;
  /** Libellé affiché dans le panneau Organizer. */
  label?: string;
  /** Icône optionnelle associée au champ. */
  icon?: string;
  /** Le champ peut-il être utilisé comme critère de regroupement. Par défaut : true si label présent. */
  groupable?: boolean;
  /** Le champ peut-il être utilisé comme critère de slice. Par défaut : true si label présent. */
  sliceable?: boolean;
  /** Champ optionnel — masqué par défaut et ajoutables par l'utilisateur. */
  optional?: boolean;
}

/** Configuration générique du panneau Organizer. */
export interface OrganizerConfig {
  /** Active le bouton et le panneau Organizer. Par défaut : false. */
  enabled?: boolean;
  /** Autorise la suppression de champs non-optionnels via Organizer > Champs. Par défaut : true. */
  enableFieldRemoval?: boolean;
  /** Active le drag & drop pour réordonner les champs. Par défaut : false. */
  enableFieldDragDrop?: boolean;
}

/** Snapshot de l'état courant du panneau Organizer. */
export interface OrganizerState {
  /** Ids des champs actuellement sélectionnés, dans l'ordre d'affichage. */
  selectedFieldIds: string[];
  /** Id du champ de regroupement actif, null si aucun regroupement. */
  groupByKey: string | null;
  /** Ids des slices dynamiques actives. */
  dynamicSliceKeys: string[];
}

/** Union typée des événements émis par la logique Organizer. */
export type OrganizerEvent =
  | { type: 'groupByChanged'; key: string | null }
  | { type: 'fieldsChanged'; fieldIds: string[] }
  | { type: 'dynamicSlicesChanged'; keys: string[] };

// ── Helpers purs (sans DOM)

/** Construit un OrganizerFieldDef à partir d'un id et de propriétés optionnelles. */
export function organizerFieldDef(id: string, partial?: Partial<Omit<OrganizerFieldDef, 'id'>>): OrganizerFieldDef {
  return { id, ...partial };
}

/** Retourne uniquement les champs utilisables comme critère de regroupement. */
export function groupableOrganizerFields(fields: OrganizerFieldDef[]): OrganizerFieldDef[] {
  return fields.filter(f => f.groupable !== false && (f.label !== undefined || f.groupable === true));
}

/** Retourne uniquement les champs utilisables comme critère de slice. */
export function sliceableOrganizerFields(fields: OrganizerFieldDef[]): OrganizerFieldDef[] {
  return fields.filter(f => f.sliceable !== false && (f.label !== undefined || f.sliceable === true));
}

/** Construit un OrganizerState initial : seuls les champs non-optionnels sont sélectionnés. */
export function initialOrganizerState(fields: OrganizerFieldDef[]): OrganizerState {
  return {
    selectedFieldIds: fields.filter(f => !f.optional).map(f => f.id),
    groupByKey: null,
    dynamicSliceKeys: [],
  };
}

// ── Helpers charts

/**
 * Extrait des OrganizerFieldDef depuis les séries d'un ChartProvider.
 * Seules les séries avec un nom statique (string) sont énumérables ; les
 * séries dont le nom est une fonction DataProvider ne peuvent pas être
 * pré-listées sans exécuter les données.
 */
export function organizerFieldDefsFromChartSeries(series: SerieProvider<any, any>[]): OrganizerFieldDef[] {
  return (series ?? [])
    .filter(s => typeof s.name === 'string' && !!s.name)
    .map(s => ({ id: s.name as string, label: s.name as string }));
}

/**
 * Retourne un ChartProvider modifié avec `visible` appliqué selon le OrganizerState.
 * Les séries dont le nom est une fonction DataProvider sont laissées inchangées.
 */
export function applyOrganizerStateToSeries<X extends XaxisType, Y extends YaxisType>(
  provider: ChartProvider<X, Y>,
  state: Pick<OrganizerState, 'selectedFieldIds'>
): ChartProvider<X, Y> {
  if (!provider.series?.length) return provider;
  const selected = new Set(state.selectedFieldIds);
  return {
    ...provider,
    series: provider.series.map(s =>
      typeof s.name === 'string' ? { ...s, visible: selected.has(s.name) } : s
    ),
  };
}
