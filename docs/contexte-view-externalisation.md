# Contexte global - externalisation du "View" (table + charts)

Date de reference: 2026-03-17
Scope principal: projects/oneteme/jquery-table, projects/oneteme/jquery-core, projects/oneteme/jquery-highcharts, projects/oneteme/jquery-apexcharts

## 1) Objectif produit

Externaliser la gestion complete du "View" et pas uniquement "slice-panel":
- bouton View
- panel View
- fields
- group by
- slice by
- mecanique d'ouverture/fermeture, peuplement, interactions et events

Objectif final:
- activer View via config ou via une ligne HTML dediee
- reutiliser le meme systeme sur table, highcharts et apexcharts
- conserver le comportement actuel de jquery-table (zero regression)

## 2) Etat actuel et constat

- Une externalisation partielle de slice-panel a deja commence.
- Un test d'implementation existe dans table/slice-chart, mais ce n'est pas la direction cible.
- La vision cible doit couvrir l'ensemble View (bouton + contenu + logique), avec une integration propre et generalisable.

## 3) Decision d'architecture (cible)

### Separation des responsabilites

- jquery-core:
  - contrat partage
  - modeles
  - regles metier pures
  - gestion d'etat (si sans dependance UI)
- jquery-table / jquery-highcharts / jquery-apexcharts:
  - rendu UI
  - lifecycle Angular
  - positionnement dynamique du bouton
  - mapping des donnees du renderer vers le contrat View

### Justification

- jquery-core est partage et convient au contrat commun.
- Le rendu et les details DOM doivent rester dans les bibliotheques de rendu.
- On preserve la compatibilite des providers et l'architecture existante.

### Option evolutive

Si la couche UI View devient significativement mutualisable, creer plus tard une lib dediee (ex: jquery-view) au lieu de surcharger jquery-core.

## 4) Contrat fonctionnel a definir dans jquery-core

## 4.1 Types principaux

- ViewConfig
  - enabled
  - mode d'integration (config/html)
  - position policy (auto, fixed, anchor)
  - data sources pour fields/group/slice
  - defaults
- ViewField
  - id, label, type
  - capabilities (groupable, sliceable, sortable)
- ViewState
  - selectedFields
  - groupBy
  - sliceBy
  - panelOpen
- ViewContext
  - metadata table/chart
  - contraintes renderer
- ViewEvent
  - opened, closed, changed, applied, reset

## 4.2 Regles

- Pas de dependance Angular/DOM dans jquery-core.
- API backward compatible.
- Defaults explicites et deterministes.

## 5) Plan d'action concret

## Phase 0 - Cadrage et inventaire (court)

1. Cartographier les points View actuels dans jquery-table:
   - bouton
   - panel
   - sources des fields
   - group/slice logic
   - positionnement dynamique
2. Lister les dependances implicites (services, modele, lifecycle).
3. Formaliser les invariants de comportement a ne pas casser.

Livrable: matrice "comportement actuel" + "cible".

## Phase 1 - Stabilisation interne jquery-table

1. Isoler la logique View dans une facade interne (ex: ViewFacade).
2. Garder le rendu existant mais centraliser l'etat et les events.
3. Rebrancher jquery-table sur cette facade.
4. Valider parite fonctionnelle complete (avant/apres).

Livrable: jquery-table inchange visuellement et fonctionnellement, architecture preperee a l'extraction.

## Phase 2 - Extraction du contrat vers jquery-core

1. Introduire les interfaces et helpers purs (ViewConfig/ViewState/ViewField).
2. Deplacer la logique metier genericable dans jquery-core.
3. Garder les adaptateurs renderer-specifiques dans jquery-table.

Livrable: contrat View partage et stable.

## Phase 3 - Mode d'integration unifie

1. Ajouter integration par config:
   - view: { ... }
2. Ajouter integration par HTML:
   - ligne dediee pour activer/monter View
3. Garantir equivalence de comportement entre les deux modes.

Livrable: experience d'integration simple, explicite et reproductible.

## Phase 4 - Generalisation charts

1. Implementer l'adaptateur jquery-highcharts.
2. Implementer l'adaptateur jquery-apexcharts.
3. Mapper ViewState vers categories/series/grouping selon chaque renderer.
4. Verifier coherence avec pivot/toolbar/type switch existants.

Livrable: View reutilisable sur charts sans casser les contrats chart existants.

## Phase 5 - Validation finale et documentation

1. Tests unitaires:
   - contrat et helpers core
   - facade table
   - adaptateurs chart
2. Tests d'integration:
   - non-regression table
   - scenarios chart critiques
3. Documentation usage:
   - activation via config
   - activation via HTML
   - limites et contraintes connues

Livrable: socle maintenable + guide de migration.

## 6) Points d'attention a traiter explicitement

- Positionnement dynamique du bouton View:
  - ancrage, resize, scroll, responsive
- Peuplement des fields:
  - source de verite
  - mapping type-safe
  - synchro avec le dataset
- Recuperation d'informations:
  - API claire pour alimenter View
  - events standardises
- Cycle de vie:
  - initialisation
  - update des donnees
  - reset
  - destruction
- Cas limites:
  - zero data
  - colonnes dynamiques
  - fields non groupables/non sliceables

## 7) Definition of Done (globale)

Le chantier est considere termine si:
1. View complet est activable sans code specifique table cache.
2. jquery-table reste strictement compatible fonctionnellement.
3. jquery-highcharts et jquery-apexcharts consomment le meme contrat View.
4. La configuration View est possible via config ou via HTML.
5. Les tests critiques passent et la documentation est a jour.

## 8) Contexte de reprise pour prochaines conversations

Prompt de reprise recommande:

"On reprend le chantier d'externalisation View.
Utilise docs/contexte-view-externalisation.md comme reference source.
Objectif courant: [phase/ticket en cours].
Contraintes: backward compatibility jquery-table + contrat partage core + integration config/html."
