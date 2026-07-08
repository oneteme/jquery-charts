# Plan d'Action : Système de Templates Avancé pour jquery-organizer

**Statut** : Plan détaillé à valider  
**Scope** : jquery-organizer + jquery-table  
**Objectif** : Permettre des configurations par défaut préservant X, Y, YAggregate, GroupBy + **Slices (filtres)**

---

## 1. Architecture Cible

### 1.1 Évolution de `OrganizerTemplate`

**Fichier** : `projects/oneteme/jquery-organizer/src/lib/models/organizer-config.interface.ts`

```typescript
export interface OrganizerTemplate {
  id: string;                    // ✓ existant
  label: string;                 // ✓ existant
  icon?: string;                 // ✓ existant

  // Configuration chart/table
  xField?: string;               // ✓ existant
  yField?: string;               // ✓ existant
  yAggregate?: string;           // ✓ existant
  groupBy?: string;              // ✓ existant
  
  // ✨ NOUVEAU : Filtres/slices
  selectedSlices?: string[];     // NEW: IDs des slices à pré-sélectionner
  sliceValues?: Record<string, any[]>; // NEW: Optionnel - valeurs pré-chargées des slices
  
  // Métadonnées
  description?: string;          // NEW: Description affichée au hover
}
```

### 1.2 Nouvelle Flag dans `OrganizerConfig`

```typescript
export interface OrganizerConfig {
  // Champs existants...
  
  // ✨ NOUVEAU : Feature flag templates
  enableTemplates?: boolean;     // NEW: Default true (backward compat)
  
  // Callback optionnel - permet au dev de customiser l'application du template
  onApplyTemplate?: (template: OrganizerTemplate, currentState: OrganizerState) => OrganizerState;
}
```

### 1.3 Nouvel Événement dans `OrganizerButtonEvent`

```typescript
export interface OrganizerButtonEvent {
  type: 'fieldToggled' | 'xSelected' | 'ySelected' | 
        'groupBySelected' | 'templateSelected' | 
        'sliceSelected' | 'reset' | 'viewSwitched';
  state: OrganizerState;
  source?: 'user' | 'api';
  resolvedYUnit?: string | UnitConfig;
  
  // ✨ NOUVEAU : Metadata pour templates
  templateId?: string;           // NEW: ID du template appliqué
}
```

---

## 2. Phases d'Implémentation

### Phase 1 : Extensions des Modèles (1h)

**Fichiers à modifier** :
1. `organizer-config.interface.ts` — Ajouter `selectedSlices` à `OrganizerTemplate`
2. `organizer-config.interface.ts` — Ajouter `enableTemplates` à `OrganizerConfig`
3. `organizer-config.interface.ts` — Ajouter `templateId` à `OrganizerButtonEvent`

**Contenu** :
- Extension simple, zéro breaking change
- `enableTemplates` par défaut `true`

---

### Phase 2 : Refactor `onTemplateSelect()` (2h)

**Fichier** : `organizer-button.component.ts`

#### Avant (ligne 77-89)
```typescript
onTemplateSelect(templateId: string): void {
  const t = this.config.templates?.find(tmpl => tmpl.id === templateId);
  if (!t) return;
  this.emitChange('templateSelected', {
    selectedTemplate: templateId,
    selectedX: t.xField,
    selectedY: t.yField,
    selectedYAggregate: t.yAggregate,
    selectedGroupBy: t.groupBy
  });
}
```

#### Après (refactorisé)
```typescript
onTemplateSelect(templateId: string): void {
  // Feature gate
  if (!this.config.enableTemplates) return;
  
  const template = this.config.templates?.find(t => t.id === templateId);
  if (!template) return;

  // Construire le nouvel état basé sur le template
  let newState: Partial<OrganizerState> = {
    selectedTemplate: templateId,
    selectedX: template.xField,
    selectedY: template.yField,
    selectedYAggregate: template.yAggregate,
    selectedGroupBy: template.groupBy,
    selectedSlices: template.selectedSlices || [] // ✨ NEW
  };

  // Permettre au parent de customiser l'application du template
  if (this.config.onApplyTemplate) {
    newState = this.config.onApplyTemplate(template, { ...this.state, ...newState });
  }

  this.emitChange('templateSelected', newState, templateId); // ✨ Passer templateId
}

private emitChange(
  type: OrganizerButtonEvent['type'],
  stateUpdate: Partial<OrganizerState>,
  templateId?: string  // ✨ NEW parameter
): void {
  const event: OrganizerButtonEvent = {
    type,
    state: { ...this.state, ...stateUpdate },
    source: 'user',
    templateId  // ✨ NEW
  };
  this.viewChange.emit(event);
}
```

---

### Phase 3 : Utilitaire `TemplateManager` (2h)

**Nouveau fichier** : `organizer-button/template-manager.utility.ts`

```typescript
import { OrganizerTemplate, OrganizerState } from '../models';

/**
 * Utilitaire pour gérer l'application des templates.
 * Complètement indépendant du composant — peut être réutilisé dans jquery-table.
 * 
 * Usage :
 * ```
 * const newState = TemplateManager.applyTemplate(template, currentState);
 * ```
 */
export class TemplateManager {
  
  /**
   * Applique un template au state courant.
   * 
   * @param template OrganizerTemplate à appliquer
   * @param currentState État courant (ou undefined pour reset)
   * @returns Nouvel OrganizerState avec les valeurs du template
   * 
   * **Stratégie** :
   * - Si template.xField est défini → selectedX = template.xField
   * - Si template.selectedSlices est défini → selectedSlices = template.selectedSlices
   * - Les champs non définis dans le template gardent leurs valeurs actuelles
   * - Exception : selectedTemplate est TOUJOURS défini
   */
  static applyTemplate(
    template: OrganizerTemplate,
    currentState?: OrganizerState
  ): OrganizerState {
    const base = currentState || {};
    
    return {
      viewMode: base.viewMode,
      visibleFields: base.visibleFields,
      
      selectedX: template.xField ?? base.selectedX,
      selectedY: template.yField ?? base.selectedY,
      selectedYAggregate: template.yAggregate ?? base.selectedYAggregate,
      selectedGroupBy: template.groupBy ?? base.selectedGroupBy,
      selectedSlices: template.selectedSlices ?? base.selectedSlices ?? [],
      selectedTemplate: template.id
    };
  }

  /**
   * Vérifie si un template est "compatible" avec une config.
   * Utile pour éviter d'appliquer un template qui référence des champs inexistants.
   * 
   * @param template Template à valider
   * @param xFieldIds IDs possibles pour X
   * @param yFieldIds IDs possibles pour Y
   * @param groupIds IDs possibles pour groupBy
   * @param sliceIds IDs possibles pour slices
   * @returns true si le template ne référence que des champs existants
   */
  static isCompatible(
    template: OrganizerTemplate,
    xFieldIds?: string[],
    yFieldIds?: string[],
    groupIds?: string[],
    sliceIds?: string[]
  ): boolean {
    if (template.xField && xFieldIds && !xFieldIds.includes(template.xField)) return false;
    if (template.yField && yFieldIds && !yFieldIds.includes(template.yField)) return false;
    if (template.groupBy && groupIds && !groupIds.includes(template.groupBy)) return false;
    
    if (template.selectedSlices && sliceIds) {
      for (const sliceId of template.selectedSlices) {
        if (!sliceIds.includes(sliceId)) return false;
      }
    }
    
    return true;
  }

  /**
   * Extrait le "delta" entre un template et le state courant.
   * Utile pour le logging et le debug.
   * 
   * @returns Object avec les champs qui seraient modifiés
   */
  static getDelta(template: OrganizerTemplate, currentState?: OrganizerState): Record<string, any> {
    const current = currentState || {};
    const delta: Record<string, any> = {};
    
    if (template.xField && template.xField !== current.selectedX) {
      delta.selectedX = { from: current.selectedX, to: template.xField };
    }
    if (template.yField && template.yField !== current.selectedY) {
      delta.selectedY = { from: current.selectedY, to: template.yField };
    }
    if (template.groupBy && template.groupBy !== current.selectedGroupBy) {
      delta.selectedGroupBy = { from: current.selectedGroupBy, to: template.groupBy };
    }
    if (template.selectedSlices && JSON.stringify(template.selectedSlices) !== JSON.stringify(current.selectedSlices)) {
      delta.selectedSlices = { from: current.selectedSlices, to: template.selectedSlices };
    }
    
    return delta;
  }
}
```

---

### Phase 4 : Adaptation du Template HTML (1h)

**Fichier** : `organizer-button.component.html` (déjà partiellement en place)

Ajouter optionnellement une info-bulle sur les templates (description) :

```html
<!-- Sous-menu : Template -->
<mat-menu #templateSubMenu="matMenu" panelClass="organizer-submenu-panel">
  <div class="organizer-submenu"
       (mousedown)="$event.stopPropagation()"
       (click)="$event.stopPropagation()"
       (keydown)="$event.stopPropagation()">
    <button type="button" class="organizer-submenu-item"
      *ngFor="let tmpl of config.templates"
      [class.active]="state?.selectedTemplate === tmpl.id"
      [title]="tmpl.description"
      (mousedown)="onTemplateSelect(tmpl.id)">
      <span class="organizer-submenu-check">{{ state?.selectedTemplate === tmpl.id ? '✓' : '' }}</span>
      <mat-icon *ngIf="tmpl.icon" class="organizer-submenu-icon">{{ tmpl.icon }}</mat-icon>
      {{ tmpl.label }}
    </button>
  </div>
</mat-menu>
```

---

### Phase 5 : Intégration dans jquery-table (2h)

**Fichier** : `projects/oneteme/jquery-table/src/lib/component/...`

Intégrer `TemplateManager` pour que jquery-table utilise le même système :

- Ajouter `templates?: OrganizerTemplate[]` à la config de la table
- Réutiliser `TemplateManager.applyTemplate()` lors du clic sur un template
- Émettre un événement compatible avec le reste du système

---

### Phase 6 : Documentation & Exemples (1h)

Créer les fichiers suivants :

1. **`TEMPLATES_GUIDE.md`** — Guide développeur pour utiliser les templates
2. **`TEMPLATES_EXAMPLES.ts`** — Exemples concrets d'utilisation dans kpi.config.ts

```typescript
// Exemple 1 : Template basique (chart)
{
  id: 'template-status-by-hour',
  label: 'Statut par Heure',
  icon: 'schedule',
  description: 'Affiche les statuts regroupés par heure',
  xField: undefined,  // Non applicable au chart
  yField: 'count',
  yAggregate: undefined,
  groupBy: 'date_hour',
  selectedSlices: ['status'] // Pré-sélectionner le filtre Statut
}

// Exemple 2 : Template avec filtres (chart)
{
  id: 'template-perf-200',
  label: 'Performance (Statut 200)',
  icon: 'trending_up',
  description: 'Performance des requêtes 200 OK uniquement',
  xField: undefined,
  yField: 'elapsedTime',
  yAggregate: 'p50',
  groupBy: 'date',
  selectedSlices: ['status'], // Slice au menu Filtrer Par
  // Le parent peut utiliser onApplyTemplate pour pre-charger les valeurs
}

// Exemple 3 : Template pour table
{
  id: 'template-minimal-table',
  label: 'Vue Minimale',
  icon: 'view_agenda',
  description: 'Affiche uniquement les colonnes essentielles',
  // Pour les tables, on peut ajouter aussi visibleFields
}
```

---

## 3. Stratégie de Déploiement

### 3.1 Backward Compatibility
- `enableTemplates` default `true` → zéro breaking change
- Si un ancien projet n'a pas `templates` dans `OrganizerConfig` → aucun problème
- `onApplyTemplate` optionnel

### 3.2 Étapes de Déploiement
1. Publier la nouvelle version de jquery-organizer
2. Adapter progressivement jquery-table
3. Mettre à jour les exemples sur les pages KPI (kpi.config.ts)
4. Aucune modification requise pour les projets existants

---

## 4. Cas d'Usage Cibles

### 4.1 Sur une page KPI (REST Status)

```typescript
// Dans REST_STATUS_CHART_CONFIG
{
  // Config existante...
  templates: [
    {
      id: 'status-by-hour',
      label: 'Dernières 24h (par heure)',
      xField: undefined,
      yField: 'count',
      groupBy: 'date_hour',
      selectedSlices: ['status', 'media'], // Pré-sélectionne deux filtres
    },
    {
      id: 'status-by-day',
      label: 'Vue Globale (par jour)',
      xField: undefined,
      yField: 'count',
      groupBy: 'date_day',
      selectedSlices: ['status'],
    },
  ]
}
```

### 4.2 Comportement au Clic sur un Template

1. **Utilisateur clique "Template: Dernières 24h (par heure)"**
2. `onTemplateSelect()` → construit le nouvel état
3. Émet `viewChange` avec `type: 'templateSelected'`, `templateId: 'status-by-hour'`
4. Parent reçoit l'événement et :
   - Appelle `applyOrganizerEvent()` (existant)
   - Mute la `ChartConfig`
   - Appelle `_fetch()` pour actualiser les données
   - Optionnellement, affiche un toast "Template appliqué"

---

## 5. Avantages de l'Approche

✅ **Permissif** : Développeur peut customiser avec `onApplyTemplate`  
✅ **Intelligent** : `TemplateManager` gère les cas limites  
✅ **Composable** : Réutilisable entre jquery-organizer et jquery-table  
✅ **Zéro Breaking Change** : Complètement backward-compatible  
✅ **Conditionnel** : `enableTemplates` peut être désactivé  
✅ **Documenté** : Guide et exemples fournis  

---

## 6. Temps Estimé

| Phase | Durée | Statut |
|-------|-------|--------|
| 1. Extensions modèles | 1h | TODO |
| 2. Refactor onTemplateSelect() | 2h | TODO |
| 3. TemplateManager utilitaire | 2h | TODO |
| 4. Template HTML | 1h | TODO |
| 5. jquery-table intégration | 2h | TODO |
| 6. Documentation & exemples | 1h | TODO |
| **Total** | **9h** | |

---

## 7. Fichiers à Créer/Modifier

### Création
- `organizer-button/template-manager.utility.ts`
- `TEMPLATES_GUIDE.md`
- `TEMPLATES_EXAMPLES.ts`

### Modifications
- `organizer-config.interface.ts`
- `organizer-button.component.ts`
- `organizer-button.component.html` (minor)

### À évaluer
- `jquery-table` — intégration selon structure existante

