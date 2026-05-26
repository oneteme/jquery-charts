import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  col,
  JqtCellDefDirective,
  TableComponent,
  TableProvider,
} from '@oneteme/jquery-table';

type TypeIntervention     = 'raccordement' | 'dépannage' | 'maintenance' | 'remplacement';
type StatutIntervention   = 'terminée' | 'en cours' | 'planifiée';
type PrioriteIntervention = 'haute' | 'normale' | 'basse';

interface DemoIntervention {
  id:               number;
  reference:        string;         // INT-2024-XXXX
  type:             TypeIntervention;
  region:           string;
  commune:          string;
  technicien:       string;
  statut:           StatutIntervention;
  priorite:         PrioriteIntervention;
  puissanceKva:     number;
  dateIntervention: string;         // ISO YYYY-MM-DD
}

// ─── Données de génération ──────────────────────────────────────────────────
const REGIONS = [
  'Île-de-France', 'PACA', 'Occitanie', 'Nouvelle-Aquitaine',
  'Auvergne-Rhône-Alpes', 'Grand Est', 'Hauts-de-France',
  'Bretagne', 'Normandie', 'Centre-Val de Loire',
];

const COMMUNES_BY_REGION: Record<string, string[]> = {
  'Île-de-France':        ['Paris 1er', 'Paris 15e', 'Boulogne-Billancourt', 'Saint-Denis', 'Versailles'],
  'PACA':                 ['Marseille', 'Nice', 'Toulon', 'Aix-en-Provence', 'Avignon'],
  'Occitanie':            ['Toulouse', 'Montpellier', 'Nîmes', 'Perpignan', 'Carcassonne'],
  'Nouvelle-Aquitaine':   ['Bordeaux', 'Libourne', 'Pau', 'Bayonne', 'Périgueux'],
  'Auvergne-Rhône-Alpes': ['Lyon', 'Grenoble', 'Clermont-Ferrand', 'Annecy', 'Chambéry'],
  'Grand Est':            ['Strasbourg', 'Reims', 'Metz', 'Nancy', 'Mulhouse'],
  'Hauts-de-France':      ['Lille', 'Amiens', 'Roubaix', 'Valenciennes', 'Calais'],
  'Bretagne':             ['Rennes', 'Brest', 'Quimper', 'Lorient', 'Vannes'],
  'Normandie':            ['Rouen', 'Caen', 'Le Havre', 'Évreux', 'Cherbourg'],
  'Centre-Val de Loire':  ['Orléans', 'Tours', 'Blois', 'Bourges', 'Chartres'],
};

const TECHNICIENS = [
  'Jean Dupont', 'Marie Martin', 'Pierre Bernard', 'Sophie Durand',
  'Lucas Moreau', 'Emma Leroy', 'Thomas Robert', 'Léa Petit', 'Hugo Simon', 'Clara Laurent',
];

const TYPES: TypeIntervention[]         = ['raccordement', 'dépannage', 'maintenance', 'remplacement'];
const STATUTS: StatutIntervention[]     = ['terminée', 'en cours', 'planifiée'];
const PRIORITES: PrioriteIntervention[] = ['haute', 'normale', 'basse'];
const PUISSANCES_KVA                    = [6, 9, 12, 15, 18, 24, 30, 36, 42, 48];

function buildInterventions(): DemoIntervention[] {
  const base = new Date(2024, 0, 1);
  return Array.from({ length: 100 }, (_, i): DemoIntervention => {
    const id      = i + 1;
    const region  = REGIONS[i % REGIONS.length];
    const communes = COMMUNES_BY_REGION[region];
    const d = new Date(base);
    d.setDate(base.getDate() + (i * 4) % 365);
    return {
      id,
      reference:        `INT-2024-${String(id).padStart(4, '0')}`,
      type:             TYPES[i % 4],
      region,
      commune:          communes[Math.floor(i / REGIONS.length) % communes.length],
      technicien:       TECHNICIENS[i % 10],
      statut:           STATUTS[i % 3],
      priorite:         PRIORITES[Math.floor(i / 10) % 3],
      puissanceKva:     PUISSANCES_KVA[i % 10],
      dateIntervention: d.toISOString().slice(0, 10),
    };
  });
}

@Component({
  selector: 'app-table-presentation',
  standalone: true,
  imports: [CommonModule, TableComponent, JqtCellDefDirective],
  templateUrl: './table-presentation.component.html',
  styleUrls: ['./table-presentation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablePresentationComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  isLoading = true;
  interventions: DemoIntervention[] = [];

  // Outputs du 1er tableau
  selectedRow: DemoIntervention | null = null;
  lastSort: { active: string; direction: string } | null = null;
  lastPage: { pageIndex: number; pageSize: number } | null = null;
  lastSearch = '';
  lastGroupBy: string | null = null;

  // ─── Config tableau 1 : toutes les fonctionnalités ─────────────────────────
  readonly tableConfig: TableProvider<DemoIntervention> = {
    title: 'Interventions réseau — Enedis 2024',

    search: {
      enabled: true,
      searchColumns: ['reference', 'commune', 'technicien', 'region'],
    },

    pagination: {
      enabled: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      pageSizeOptionsGroupBy: [5, 10, 20],
    },

    view: { enabled: true, enableColumnRemoval: true, enableColumnDragDrop: true },

    defaultSort: { active: 'dateIntervention', direction: 'desc' },

    labels: { empty: 'Aucune intervention trouvée', loading: 'Chargement des interventions…' },

    export: {
      enabled: true,
      filename: 'interventions-enedis-2024',
      transform: (r) => ({
        reference:     r.reference,
        type:          r.type,
        region:        r.region,
        commune:       r.commune,
        technicien:    r.technicien,
        statut:        r.statut,
        priorite:      r.priorite,
        puissance_kva: String(r.puissanceKva),
        date:          r.dateIntervention,
      }),
    },

    preferences: { enabled: true, tableId: 'presentation-enedis-full' },

    slices: [
      { title: 'Région', columnKey: 'region' },
      {
        title: 'Type', columnKey: 'type',
        categories: [
          { key: 'raccordement', label: 'Raccordement', filter: (r) => r.type === 'raccordement' },
          { key: 'dépannage',    label: 'Dépannage',    filter: (r) => r.type === 'dépannage'    },
          { key: 'maintenance',  label: 'Maintenance',  filter: (r) => r.type === 'maintenance'  },
          { key: 'remplacement', label: 'Remplacement', filter: (r) => r.type === 'remplacement' },
        ],
      },
      {
        title: 'Statut', columnKey: 'statut',
        categories: [
          { key: 'terminée',  label: 'Terminée',  filter: (r) => r.statut === 'terminée'  },
          { key: 'en cours',  label: 'En cours',  filter: (r) => r.statut === 'en cours'  },
          { key: 'planifiée', label: 'Planifiée', filter: (r) => r.statut === 'planifiée' },
        ],
      },
      {
        title: 'Priorité', columnKey: 'priorite',
        categories: [
          { key: 'haute',   label: 'Haute',   filter: (r) => r.priorite === 'haute'   },
          { key: 'normale', label: 'Normale', filter: (r) => r.priorite === 'normale' },
          { key: 'basse',   label: 'Basse',   filter: (r) => r.priorite === 'basse'   },
        ],
      },
    ],

    columns: [
      col('id',              '#',               { sortable: true, width: '60px', groupable: false, sliceable: false }),
      col('reference',       'Référence',       { sortable: true, sliceable: false, icon: 'fingerprint' }),
      col('type',            'Type',            { sortable: true, groupable: true, icon: 'category' }),
      col('region',          'Région',          { sortable: true, groupable: true, icon: 'map' }),
      col('commune',         'Commune',         { sortable: true, groupable: true, optional: true, icon: 'location_city' }),
      col('technicien',      'Technicien',      { sortable: true, groupable: true, icon: 'engineering' }),
      {
        key: 'statut', header: 'Statut', icon: 'info',
        sortable: true, groupable: true,
        sortValue: (r: DemoIntervention) => ({ 'terminée': 0, 'en cours': 1, 'planifiée': 2 }[r.statut] ?? 3),
      },
      {
        key: 'priorite', header: 'Priorité', icon: 'flag',
        sortable: true, groupable: true, optional: true,
        sortValue: (r: DemoIntervention) => ({ haute: 0, normale: 1, basse: 2 }[r.priorite] ?? 3),
      },
      {
        key: 'puissanceKva', header: 'Puissance (kVA)', icon: 'bolt',
        sortable: true, optional: true,
        value:     (r: DemoIntervention) => `${r.puissanceKva} kVA`,
        sortValue: (r: DemoIntervention) => r.puissanceKva,
      },
      {
        key: 'dateIntervention', header: 'Date', icon: 'event',
        sortable: true, optional: true,
        value: (r: DemoIntervention) => new Date(r.dateIntervention).toLocaleDateString('fr-FR'),
      },
      {
        key: 'nbCompteurs', header: 'Compteurs affectés', icon: 'electric_meter',
        sortable: true, optional: true,
        lazy: {
          fetchFn: () =>
            of(this.interventions.map((i) => 5 + (i.id * 7) % 200)).pipe(delay(1200)),
        },
      },
    ],
  };

  // ─── Config tableau 2 : templates personnalisés ─────────────────────────────
  readonly templateConfig: TableProvider<DemoIntervention> = {
    title: 'Tableau avec templates personnalisés',

    search: { enabled: true },
    pagination: { enabled: true, pageSize: 5, pageSizeOptions: [5, 10, 20] },
    view: { enabled: true, enableColumnRemoval: true },
    export: { enabled: true, filename: 'interventions-templates' },
    preferences: { enabled: true, tableId: 'presentation-enedis-template' },

    slices: [
      {
        title: 'Statut', columnKey: 'statut',
        categories: [
          { key: 'terminée',  label: 'Terminée',  filter: (r) => r.statut === 'terminée'  },
          { key: 'en cours',  label: 'En cours',  filter: (r) => r.statut === 'en cours'  },
          { key: 'planifiée', label: 'Planifiée', filter: (r) => r.statut === 'planifiée' },
        ],
      },
    ],

    columns: [
      col('reference',  'Référence',  { sortable: true, sliceable: false }),
      col('commune',    'Commune',    { sortable: true, groupable: true }),
      col('technicien', 'Technicien', { sortable: true, groupable: true }),
      {
        key: 'type', header: 'Type', sortable: true, groupable: true,
        // Rendu délégué au ng-template jqtCellDef="type"
      },
      {
        key: 'statut', header: 'Statut', sortable: true,
        sortValue: (r: DemoIntervention) => ({ 'terminée': 0, 'en cours': 1, 'planifiée': 2 }[r.statut] ?? 3),
        // Rendu délégué au ng-template jqtCellDef="statut"
      },
      {
        key: 'priorite', header: 'Priorité', sortable: true,
        sortValue: (r: DemoIntervention) => ({ haute: 0, normale: 1, basse: 2 }[r.priorite] ?? 3),
        // Rendu délégué au ng-template jqtCellDef="priorite"
      },
      { key: 'actions', header: 'Actions', sortable: false, groupable: false, sliceable: false },
    ],
  };

  // ─── Strings de code affichés en section 2 et 4 ────────────────────────────
  readonly CODE_FULL_TS = `tableConfig: TableProvider<DemoIntervention> = {
  title: 'Interventions réseau — Enedis 2024',

  // Recherche texte (restreinte à 4 colonnes)
  search: {
    enabled: true,
    searchColumns: ['reference', 'commune', 'technicien', 'region'],
  },

  // Pagination — options séparées en mode group-by
  pagination: {
    enabled: true,
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50],
    pageSizeOptionsGroupBy: [5, 10, 20],
  },

  // Bouton View : masquage colonnes + drag & drop
  view: { enabled: true, enableColumnRemoval: true, enableColumnDragDrop: true },

  // Tri et messages par défaut
  defaultSort: { active: 'dateIntervention', direction: 'desc' },
  labels: { empty: 'Aucune intervention trouvée', loading: 'Chargement des interventions…' },

  // Export CSV avec transformation des champs
  export: {
    enabled: true,
    filename: 'interventions-enedis-2024',
    transform: (r) => ({
      reference: r.reference,
      type: r.type,
      region: r.region,
      commune: r.commune,
      technicien: r.technicien,
      statut: r.statut,
      priorite: r.priorite,
      puissance_kva: String(r.puissanceKva),
      date: r.dateIntervention,
    }),
  },

  // Persistance des préférences utilisateur en localStorage
  preferences: { enabled: true, tableId: 'presentation-enedis-full' },

  // Panneaux de filtre latéraux (slices)
  slices: [
    { title: 'Région', columnKey: 'region' },
    {
      title: 'Type', columnKey: 'type',
      categories: [
        { key: 'raccordement', label: 'Raccordement', filter: (r) => r.type === 'raccordement' },
        { key: 'dépannage',    label: 'Dépannage',    filter: (r) => r.type === 'dépannage'    },
        { key: 'maintenance',  label: 'Maintenance',  filter: (r) => r.type === 'maintenance'  },
        { key: 'remplacement', label: 'Remplacement', filter: (r) => r.type === 'remplacement' },
      ],
    },
    {
      title: 'Statut', columnKey: 'statut',
      categories: [
        { key: 'terminée',  label: 'Terminée',  filter: (r) => r.statut === 'terminée'  },
        { key: 'en cours',  label: 'En cours',  filter: (r) => r.statut === 'en cours'  },
        { key: 'planifiée', label: 'Planifiée', filter: (r) => r.statut === 'planifiée' },
      ],
    },
    {
      title: 'Priorité', columnKey: 'priorite',
      categories: [
        { key: 'haute',   label: 'Haute',   filter: (r) => r.priorite === 'haute'   },
        { key: 'normale', label: 'Normale', filter: (r) => r.priorite === 'normale' },
        { key: 'basse',   label: 'Basse',   filter: (r) => r.priorite === 'basse'   },
      ],
    },
  ],

  columns: [
    // col(key, header, options?) — raccourci pour les colonnes simples
    col('id',         '#',          { sortable: true, width: '60px', groupable: false }),
    col('reference',  'Référence',  { sortable: true }),
    col('type',       'Type',       { sortable: true, groupable: true }),
    col('region',     'Région',     { sortable: true, groupable: true }),
    col('commune',    'Commune',    { sortable: true, groupable: true, optional: true }),
    col('technicien', 'Technicien', { sortable: true, groupable: true }),

    // Colonnes avec sortValue personnalisé (tri par ordre logique)
    {
      key: 'statut', header: 'Statut', sortable: true, groupable: true,
      sortValue: (r) => ({ 'terminée': 0, 'en cours': 1, 'planifiée': 2 }[r.statut] ?? 3),
    },
    {
      key: 'priorite', header: 'Priorité', sortable: true, optional: true,
      sortValue: (r) => ({ haute: 0, normale: 1, basse: 2 }[r.priorite] ?? 3),
    },
    {
      key: 'puissanceKva', header: 'Puissance (kVA)', sortable: true, optional: true,
      value:     (r) => r.puissanceKva + ' kVA',
      sortValue: (r) => r.puissanceKva,
    },
    {
      key: 'dateIntervention', header: 'Date', sortable: true, optional: true,
      value: (r) => new Date(r.dateIntervention).toLocaleDateString('fr-FR'),
    },

    // Colonne lazy — données chargées en arrière-plan à la demande
    {
      key: 'nbCompteurs', header: 'Compteurs affectés', sortable: true, optional: true,
      lazy: {
        fetchFn: () => of(this.interventions.map(i => 5 + (i.id * 7) % 200)).pipe(delay(1200)),
      },
    },
  ],
};`;

  readonly CODE_TEMPLATE_HTML = `<jquery-table class="tpl-table" [config]="templateConfig" [data]="interventions" [isLoading]="isLoading">

  <!-- Colonne 'type' — chip coloré par catégorie -->
  <ng-template jqtCellDef="type" let-row>
    <span class="badge-type" [ngClass]="typeCssClass(row.type)">{{ typeLabel(row.type) }}</span>
  </ng-template>

  <!-- Colonne 'statut' — badge coloré -->
  <ng-template jqtCellDef="statut" let-row>
    <!-- $implicit = la ligne brute DemoIntervention ; index aussi disponible via let-i="index" -->
    <span class="badge-statut" [ngClass]="statutCssClass(row.statut)">{{ statutLabel(row.statut) }}</span>
  </ng-template>

  <!-- Colonne 'priorite' — chip avec point de couleur -->
  <ng-template jqtCellDef="priorite" let-row>
    <span class="badge-priorite" [ngClass]="'badge-priorite--' + row.priorite">
      <span class="badge-priorite__dot"></span>{{ prioriteLabel(row.priorite) }}
    </span>
  </ng-template>

  <!-- Colonne 'actions' — boutons inline -->
  <ng-template jqtCellDef="actions" let-row>
    <button class="action-btn" (click)="viewIntervention(row, $event)">Voir</button>
  </ng-template>

</jquery-table>`;

  readonly CODE_TEMPLATE_TS = `// Imports nécessaires — JqtCellDefDirective doit être dans imports[]
import { TableComponent, JqtCellDefDirective, col, TableProvider } from '@oneteme/jquery-table';

@Component({
  standalone: true,
  imports: [CommonModule, TableComponent, JqtCellDefDirective],
  ...
})
export class MyComponent {

  templateConfig: TableProvider<DemoIntervention> = {
    search: { enabled: true },
    pagination: { enabled: true, pageSize: 5 },
    view: { enabled: true, enableColumnRemoval: true },
    slices: [
      {
        title: 'Statut', columnKey: 'statut',
        categories: [
          { key: 'terminée',  label: 'Terminée',  filter: (r) => r.statut === 'terminée'  },
          { key: 'en cours',  label: 'En cours',  filter: (r) => r.statut === 'en cours'  },
          { key: 'planifiée', label: 'Planifiée', filter: (r) => r.statut === 'planifiée' },
        ],
      },
    ],
    columns: [
      col('reference',  'Référence',  { sortable: true }),
      col('commune',    'Commune',    { sortable: true, groupable: true }),
      col('technicien', 'Technicien', { sortable: true, groupable: true }),
      // Pas de 'value' → rendu délégué au ng-template jqtCellDef="type"
      { key: 'type', header: 'Type', sortable: true, groupable: true },
      // Pas de 'value' → rendu délégué au ng-template jqtCellDef="statut"
      {
        key: 'statut', header: 'Statut', sortable: true,
        sortValue: (r) => ({ 'terminée': 0, 'en cours': 1, 'planifiée': 2 }[r.statut] ?? 3),
      },
      // Pas de 'value' → rendu délégué au ng-template jqtCellDef="priorite"
      {
        key: 'priorite', header: 'Priorité', sortable: true,
        sortValue: (r) => ({ haute: 0, normale: 1, basse: 2 }[r.priorite] ?? 3),
      },
      // Colonne purement template (pas de value ni sortValue)
      { key: 'actions', header: 'Actions', sortable: false, groupable: false, sliceable: false },
    ],
  };

  // Méthodes helper pour les templates
  typeCssClass(t: string): string {
    return 'badge-type--' + ({ raccordement: 'raccordement', dépannage: 'depannage',
      maintenance: 'maintenance', remplacement: 'remplacement' }[t] ?? t);
  }
  statutCssClass(s: string): string {
    return 'badge-statut--' + ({ terminée: 'terminee', 'en cours': 'en-cours',
      planifiée: 'planifiee' }[s] ?? s);
  }
  prioriteLabel(p: string): string {
    return { haute: 'Haute', normale: 'Normale', basse: 'Basse' }[p] ?? p;
  }
}`;

  // ─── Cycle de vie ───────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.interventions = buildInterventions();
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  // ─── Handlers / helpers ────────────────────────────────────────────────────
  onRowSelected(row: DemoIntervention): void {
    this.selectedRow = row;
    this.cdr.markForCheck();
  }

  typeLabel(t: string): string {
    const map: Record<string, string> = {
      raccordement: 'Raccordement', dépannage: 'Dépannage',
      maintenance: 'Maintenance', remplacement: 'Remplacement',
    };
    return map[t] ?? t;
  }

  typeCssClass(t: string): string {
    const map: Record<string, string> = {
      raccordement: 'raccordement', dépannage: 'depannage',
      maintenance: 'maintenance', remplacement: 'remplacement',
    };
    return `badge-type--${map[t] ?? t}`;
  }

  statutLabel(s: string): string {
    const map: Record<string, string> = {
      'terminée': 'Terminée', 'en cours': 'En cours', 'planifiée': 'Planifiée',
    };
    return map[s] ?? s;
  }

  statutCssClass(s: string): string {
    const map: Record<string, string> = {
      'terminée': 'terminee', 'en cours': 'en-cours', 'planifiée': 'planifiee',
    };
    return `badge-statut--${map[s] ?? s}`;
  }

  prioriteLabel(p: string): string {
    const map: Record<string, string> = { haute: 'Haute', normale: 'Normale', basse: 'Basse' };
    return map[p] ?? p;
  }

  viewIntervention(row: DemoIntervention, event: Event): void {
    event.stopPropagation();
    globalThis.alert(`${row.reference}\n${row.type} — ${row.commune}\nTechnicien : ${row.technicien}`);
  }
}
