/**
 * Contrat View partagé — renderer-agnostic.
 * Aucune dépendance Angular/DOM.
 *
 * Consommé par : jquery-table, jquery-highcharts, jquery-apexcharts.
 */
import { ChartProvider, SerieProvider, XaxisType, YaxisType } from './jquery-core.model';

// ── Interfaces

/** Descripteur générique d'un champ disponible dans le panneau View. */
export interface ViewField {
  /** Identifiant unique du champ (ex: clé de colonne, nom de série). */
  id: string;
  /** Libellé affiché dans le panneau View. */
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

/** Configuration générique du panneau View. */
export interface ViewConfig {
  /** Active le bouton et le panneau View. Par défaut : false. */
  enabled?: boolean;
  /** Autorise la suppression de champs non-optionnels via View > Champs. Par défaut : true. */
  enableFieldRemoval?: boolean;
  /** Active le drag & drop pour réordonner les champs. Par défaut : false. */
  enableFieldDragDrop?: boolean;
}

/** Snapshot de l'état courant du panneau View. */
export interface ViewState {
  /** Ids des champs actuellement sélectionnés, dans l'ordre d'affichage. */
  selectedFieldIds: string[];
  /** Id du champ de regroupement actif, null si aucun regroupement. */
  groupByKey: string | null;
  /** Ids des slices dynamiques actives. */
  dynamicSliceKeys: string[];
}

/** Union typée des événements émis par la logique View. */
export type ViewEvent =
  | { type: 'groupByChanged'; key: string | null }
  | { type: 'fieldsChanged'; fieldIds: string[] }
  | { type: 'dynamicSlicesChanged'; keys: string[] };

// ── Helpers purs (sans DOM)

/** Construit un ViewField à partir d'un id et de propriétés optionnelles. */
export function viewField(id: string, partial?: Partial<Omit<ViewField, 'id'>>): ViewField {
  return { id, ...partial };
}

/** Retourne uniquement les champs utilisables comme critère de regroupement. */
export function groupableViewFields(fields: ViewField[]): ViewField[] {
  return fields.filter(f => f.groupable !== false && (f.label !== undefined || f.groupable === true));
}

/** Retourne uniquement les champs utilisables comme critère de slice. */
export function sliceableViewFields(fields: ViewField[]): ViewField[] {
  return fields.filter(f => f.sliceable !== false && (f.label !== undefined || f.sliceable === true));
}

/** Construit un ViewState initial : seuls les champs non-optionnels sont sélectionnés. */
export function initialViewState(fields: ViewField[]): ViewState {
  return {
    selectedFieldIds: fields.filter(f => !f.optional).map(f => f.id),
    groupByKey: null,
    dynamicSliceKeys: [],
  };
}

// ── Helpers charts

/**
 * Extrait des ViewField depuis les séries d'un ChartProvider.
 * Seules les séries avec un nom statique (string) sont énumérables ; les
 * séries dont le nom est une fonction DataProvider ne peuvent pas être
 * pré-listées sans exécuter les données.
 */
export function viewFieldsFromChartSeries(series: SerieProvider<any, any>[]): ViewField[] {
  return (series ?? [])
    .filter(s => typeof s.name === 'string' && !!s.name)
    .map(s => ({ id: s.name as string, label: s.name as string }));
}

/**
 * Retourne un ChartProvider modifié avec `visible` appliqué selon le ViewState.
 * Les séries dont le nom est une fonction DataProvider sont laissées inchangées.
 */
export function applyViewStateToSeries<X extends XaxisType, Y extends YaxisType>(
  provider: ChartProvider<X, Y>,
  state: Pick<ViewState, 'selectedFieldIds'>
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
