import { field, pivotRows, rangeFields, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { ChartData, ChartDataCollection } from '../../core/models/chart.model';

export type EChartsExampleData = ChartData<XaxisType, YaxisType>;

const PIVOT_ROWS_SOURCE = [
  { usage_type: 'Eclairage Public', authorization_type: 'beneficiaire', consumption: 120 },
  { usage_type: 'Eclairage Public', authorization_type: 'beneficiaire', consumption: 30 },
  { usage_type: 'Eclairage Public', authorization_type: 'titulaire', consumption: 80 },
  { usage_type: 'Industrie', authorization_type: 'beneficiaire', consumption: 240 },
  { usage_type: 'Industrie', authorization_type: 'titulaire', consumption: 160 },
];

const PIVOT_ROWS_RESULT = pivotRows(PIVOT_ROWS_SOURCE, {
  index: 'usage_type',
  columns: 'authorization_type',
  values: ['consumption'],
  columnValues: ['beneficiaire', 'titulaire', 'absent'],
  aggregate: 'sum',
  fill: 0,
});

export const ECHARTS_EXAMPLES: ChartDataCollection<EChartsExampleData> = {

  barExample: {
    data: [
      { palier: 'P1 Critique', count: 42 },
      { palier: 'P2 Élevé', count: 68 },
      { palier: 'P3 Moyen', count: 96 },
      { palier: 'P4 Faible', count: 124 },
    ],
    config: {
      title: 'Tickets par priorité (par mois)',
      series: [{ data: { x: field('palier'), y: field('count') }, name: 'Tickets' }],
    },
  },

  columnExample: {
    data: [
      { mois: 'Jan', prod: 410, stg: 280, dev: 190 },
      { mois: 'Fév', prod: 390, stg: 310, dev: 210 },
      { mois: 'Mar', prod: 450, stg: 260, dev: 230 },
      { mois: 'Avr', prod: 480, stg: 290, dev: 200 },
      { mois: 'Mai', prod: 420, stg: 300, dev: 220 },
    ],
    config: {
      title: 'Incidents par environnement',
      series: [
        { data: { x: field('mois'), y: field('prod') }, name: 'Production' },
        { data: { x: field('mois'), y: field('stg') },  name: 'Staging' },
        { data: { x: field('mois'), y: field('dev') },  name: 'Dev' },
      ],
    },
  },

  lineExample: {
    data: [
      { semaine: 'S1', p50: 120, p95: 340 },
      { semaine: 'S2', p50: 132, p95: 410 },
      { semaine: 'S3', p50: 101, p95: 280 },
      { semaine: 'S4', p50: 134, p95: 390 },
      { semaine: 'S5', p50: 90,  p95: 260 },
      { semaine: 'S6', p50: 150, p95: 450 },
    ],
    config: {
      title: 'Temps de réponse API',
      series: [
        { data: { x: field('semaine'), y: field('p50') }, name: 'P50' },
        { data: { x: field('semaine'), y: field('p95') }, name: 'P95' },
      ],
    },
  },

  splineExample: {
    data: [
      { mois: 'Jan', backend: 245, frontend: 180, mobile: 95  },
      { mois: 'Fév', backend: 188, frontend: 210, mobile: 130 },
      { mois: 'Mar', backend: 320, frontend: 165, mobile: 210 },
      { mois: 'Avr', backend: 270, frontend: 290, mobile: 175 },
      { mois: 'Mai', backend: 410, frontend: 240, mobile: 310 },
      { mois: 'Jun', backend: 360, frontend: 380, mobile: 260 },
      { mois: 'Jul', backend: 195, frontend: 320, mobile: 420 },
      { mois: 'Aoû', backend: 280, frontend: 195, mobile: 340 },
      { mois: 'Sep', backend: 450, frontend: 430, mobile: 290 },
      { mois: 'Oct', backend: 390, frontend: 360, mobile: 480 },
      { mois: 'Nov', backend: 520, frontend: 410, mobile: 390 },
      { mois: 'Déc', backend: 460, frontend: 490, mobile: 530 },
    ],
    config: {
      title: 'Incidents par équipe',
      series: [
        { data: { x: field('mois'), y: field('backend')  }, name: 'Backend'  },
        { data: { x: field('mois'), y: field('frontend') }, name: 'Frontend' },
        { data: { x: field('mois'), y: field('mobile')   }, name: 'Mobile'   },
      ],
    },
  },

  areaExample: {
    data: [
      { heure: '00h', req: 120 },
      { heure: '04h', req: 60  },
      { heure: '08h', req: 340 },
      { heure: '12h', req: 520 },
      { heure: '16h', req: 480 },
      { heure: '20h', req: 280 },
    ],
    config: {
      title: 'Volume de requêtes par heure',
      subtitle: 'Zone remplie',
      series: [{ data: { x: field('heure'), y: field('req') }, name: 'Requêtes' }],
    },
  },

  pieExample: {
    data: [
      { segment: 'Enterprise', value: 42 },
      { segment: 'Mid-Market', value: 28 },
      { segment: 'SMB', value: 18 },
      { segment: 'Public', value: 12 },
    ],
    config: {
      title: 'Répartition des clients',
      series: [{ data: { x: field('segment'), y: field('value') }, name: 'Clients' }],
    },
  },

  donutExample: {
    data: [
      { status: '2xx', count: 840 },
      { status: '3xx', count: 120 },
      { status: '4xx', count: 65  },
      { status: '5xx', count: 15  },
    ],
    config: {
      title: 'Codes de réponse HTTP',
      subtitle: 'Dernières 24h',
      series: [{ data: { x: field('status'), y: field('count') }, name: 'Requêtes' }],
    },
  },

  scatterExample: {
    data: [
      { spend: 12, leads: 420, seg: 'Retail' },
      { spend: 18, leads: 510, seg: 'Retail' },
      { spend: 30, leads: 720, seg: 'Enterprise' },
      { spend: 38, leads: 860, seg: 'Enterprise' },
      { spend: 6,  leads: 210, seg: 'SMB' },
      { spend: 9,  leads: 280, seg: 'SMB' },
    ],
    config: {
      title: 'Marketing : budget vs leads',
      xtitle: 'Dépenses (k€)',
      ytitle: 'Leads',
      continue: true,
      series: [{ data: { x: field('spend'), y: field('leads') }, name: field('seg') }],
    },
  },

  bubbleExample: {
    data: [
      { x: 10, y: 220, z: 30, name: 'Appli A' },
      { x: 25, y: 340, z: 60, name: 'Appli B' },
      { x: 40, y: 180, z: 20, name: 'Appli C' },
      { x: 15, y: 400, z: 80, name: 'Appli D' },
      { x: 55, y: 290, z: 45, name: 'Appli E' },
    ],
    config: {
      title: 'Applications : perf vs coût (taille = usage)',
      xtitle: 'Coût (k€/mois)',
      ytitle: 'Req/s',
      continue: true,
      series: [{ data: { x: field('x'), y: field('y'), z: field('z') }, name: field('name') }],
    },
  },

  roseExample: {
    data: [
      { canal: 'Web', visites: 4200 },
      { canal: 'Mobile', visites: 3100 },
      { canal: 'API', visites: 2400 },
      { canal: 'Batch', visites: 900 },
      { canal: 'Partenaires', visites: 620 },
    ],
    config: {
      title: 'Trafic par canal',
      series: [{ data: { x: field('canal'), y: field('visites') }, name: 'Visites' }],
    },
  },

  gaugeExample: {
    data: [
      { indicateur: 'Disponibilité', valeur: 99.2 },
      { indicateur: 'Succès API', valeur: 97.5 },
      { indicateur: 'Cache hit', valeur: 64.8 },
      { indicateur: 'Charge CPU', valeur: 72.1 },
    ],
    config: {
      title: 'Indicateurs de santé',
      series: [{ name: 'Actuel', data: { x: field('indicateur'), y: field('valeur') }, unit: '%' }],
    },
  },

  sankeyExample: {
    data: [
      { origine: 'Navigateur', cible: 'Passerelle', flux: 420 },
      { origine: 'Mobile', cible: 'Passerelle', flux: 260 },
      { origine: 'Passerelle', cible: 'Auth', flux: 300 },
      { origine: 'Passerelle', cible: 'Catalogue', flux: 380 },
      { origine: 'Catalogue', cible: 'Base', flux: 210 },
      { origine: 'Auth', cible: 'Base', flux: 150 },
    ],
    config: {
      title: 'Flux de requêtes entre services',
      series: [{ data: { x: field('origine'), y: field('flux') }, name: field('cible') }],
    },
  },

  graphExample: {
    data: [
      { origine: 'Navigateur', cible: 'Passerelle', flux: 420 },
      { origine: 'Mobile', cible: 'Passerelle', flux: 260 },
      { origine: 'Passerelle', cible: 'Auth', flux: 300 },
      { origine: 'Passerelle', cible: 'Catalogue', flux: 380 },
      { origine: 'Catalogue', cible: 'Base', flux: 210 },
      { origine: 'Auth', cible: 'Base', flux: 150 },
      { origine: 'Base', cible: 'Catalogue', flux: 90 },
    ],
    config: {
      title: 'Dépendances entre services (graphe)',
      series: [{ data: { x: field('origine'), y: field('flux') }, name: field('cible') }],
    },
  },

  sunburstExample: {
    data: [
      { service: 'Auth', lectures: 320, ecritures: 45 },
      { service: 'Paiement', lectures: 210, ecritures: 120 },
      { service: 'Catalogue', lectures: 180, ecritures: 30 },
      { service: 'Panier', lectures: 150, ecritures: 95 },
    ],
    config: {
      title: 'Trafic par service et type d\'accès',
      series: [
        { name: 'Lectures', data: { x: field('service'), y: field('lectures') } },
        { name: 'Écritures', data: { x: field('service'), y: field('ecritures') } },
      ],
    },
  },

  calendarExample: {
    data: [
      { jour: '2024-01-02', deploiements: 2 },
      { jour: '2024-01-03', deploiements: 5 },
      { jour: '2024-01-04', deploiements: 1 },
      { jour: '2024-01-09', deploiements: 3 },
      { jour: '2024-01-10', deploiements: 7 },
      { jour: '2024-01-11', deploiements: 4 },
      { jour: '2024-01-16', deploiements: 6 },
      { jour: '2024-01-17', deploiements: 2 },
      { jour: '2024-01-18', deploiements: 9 },
      { jour: '2024-01-23', deploiements: 1 },
      { jour: '2024-01-24', deploiements: 4 },
      { jour: '2024-01-25', deploiements: 8 },
      { jour: '2024-01-30', deploiements: 3 },
      { jour: '2024-02-01', deploiements: 5 },
      { jour: '2024-02-06', deploiements: 2 },
      { jour: '2024-02-07', deploiements: 6 },
      { jour: '2024-02-13', deploiements: 10 },
      { jour: '2024-02-14', deploiements: 3 },
    ],
    config: {
      title: 'Déploiements par jour',
      series: [{ name: 'Déploiements', data: { x: field('jour'), y: field('deploiements') } }],
    },
  },

  waterfallExample: {
    data: [
      { poste: 'Solde initial', variation: 1000 },
      { poste: 'Ventes', variation: 450 },
      { poste: 'Achats', variation: -320 },
      { poste: 'Salaires', variation: -180 },
      { poste: 'Subventions', variation: 90 },
      { poste: 'Charges', variation: -60 },
    ],
    config: {
      title: 'Cascade de trésorerie',
      series: [{ name: 'Variation', data: { x: field('poste'), y: field('variation') } }],
    },
  },

  boxplotExample: {
    data: [
      { service: 'Auth', latence: 42 },
      { service: 'Auth', latence: 45 },
      { service: 'Auth', latence: 39 },
      { service: 'Auth', latence: 51 },
      { service: 'Auth', latence: 160 },
      { service: 'Catalogue', latence: 88 },
      { service: 'Catalogue', latence: 92 },
      { service: 'Catalogue', latence: 85 },
      { service: 'Catalogue', latence: 101 },
      { service: 'Catalogue', latence: 96 },
      { service: 'Paiement', latence: 120 },
      { service: 'Paiement', latence: 135 },
      { service: 'Paiement', latence: 128 },
      { service: 'Paiement', latence: 142 },
      { service: 'Paiement', latence: 131 },
      { service: 'Recherche', latence: 60 },
      { service: 'Recherche', latence: 64 },
      { service: 'Recherche', latence: 58 },
      { service: 'Recherche', latence: 71 },
      { service: 'Recherche', latence: 66 },
    ],
    config: {
      title: 'Latence par service (ms)',
      series: [{ data: { x: field('service'), y: field('latence') }, name: 'Latence' }],
    },
  },

  columnpyramidExample: {
    data: [
      { mois: 'Jan', solde: 120 },
      { mois: 'Fév', solde: 80 },
      { mois: 'Mar', solde: -40 },
      { mois: 'Avr', solde: 150 },
      { mois: 'Mai', solde: -90 },
      { mois: 'Jun', solde: 60 },
    ],
    config: {
      title: 'Solde net mensuel (k€)',
      series: [{ data: { x: field('mois'), y: field('solde') }, name: 'Solde' }],
    },
  },

  radialBarExample: {
    data: [
      { noeud: 'Nœud 1', charge: 72 },
      { noeud: 'Nœud 2', charge: 58 },
      { noeud: 'Nœud 3', charge: 91 },
      { noeud: 'Nœud 4', charge: 45 },
    ],
    config: {
      title: 'Charge CPU par nœud (%)',
      series: [{ data: { x: field('noeud'), y: field('charge') }, name: 'Charge CPU' }],
    },
  },

  radarAreaExample: {
    data: [
      { dim: 'Performance', svc_a: 80, svc_b: 65 },
      { dim: 'Fiabilité', svc_a: 92, svc_b: 88 },
      { dim: 'Sécurité', svc_a: 75, svc_b: 90 },
      { dim: 'Scalabilité', svc_a: 70, svc_b: 60 },
      { dim: 'UX', svc_a: 85, svc_b: 72 },
    ],
    config: {
      title: 'Maturité des services',
      series: [
        { data: { x: field('dim'), y: field('svc_a') }, name: 'Service A' },
        { data: { x: field('dim'), y: field('svc_b') }, name: 'Service B' },
      ],
    },
  },

  areasplineExample: {
    data: [
      { jour: 'Lun', visites: 1200, sessions: 800 },
      { jour: 'Mar', visites: 1350, sessions: 920 },
      { jour: 'Mer', visites: 1280, sessions: 870 },
      { jour: 'Jeu', visites: 1500, sessions: 1010 },
      { jour: 'Ven', visites: 1720, sessions: 1190 },
      { jour: 'Sam', visites: 980, sessions: 640 },
      { jour: 'Dim', visites: 860, sessions: 560 },
    ],
    config: {
      title: 'Trafic hebdomadaire',
      series: [
        { data: { x: field('jour'), y: field('visites') }, name: 'Visites' },
        { data: { x: field('jour'), y: field('sessions') }, name: 'Sessions' },
      ],
    },
  },

  columnrangeExample: {
    data: [
      { mois: 'Jan', min: -2, max: 8 },
      { mois: 'Fév', min: -1, max: 10 },
      { mois: 'Mar', min: 3, max: 15 },
      { mois: 'Avr', min: 6, max: 19 },
      { mois: 'Mai', min: 10, max: 23 },
      { mois: 'Jun', min: 14, max: 27 },
    ],
    config: {
      title: 'Températures mensuelles (°C)',
      series: [{ data: { x: field('mois'), y: rangeFields('min', 'max') }, name: 'Température', unit: '°C' }],
    },
  },

  arearangeExample: {
    data: [
      { heure: '00h', min: 110, max: 180 },
      { heure: '04h', min: 95, max: 150 },
      { heure: '08h', min: 160, max: 310 },
      { heure: '12h', min: 180, max: 360 },
      { heure: '16h', min: 170, max: 330 },
      { heure: '20h', min: 130, max: 240 },
    ],
    config: {
      title: 'Plage de latence sur la journée (ms)',
      series: [{ data: { x: field('heure'), y: rangeFields('min', 'max') }, name: 'Latence' }],
    },
  },

  areasplinerangeExample: {
    data: [
      { semaine: 'S1', min: 40, max: 210 },
      { semaine: 'S2', min: 45, max: 240 },
      { semaine: 'S3', min: 38, max: 190 },
      { semaine: 'S4', min: 52, max: 260 },
      { semaine: 'S5', min: 47, max: 225 },
      { semaine: 'S6', min: 55, max: 280 },
    ],
    config: {
      title: 'Temps de réponse : enveloppe min/max',
      series: [{ data: { x: field('semaine'), y: rangeFields('min', 'max') }, name: 'Temps de réponse' }],
    },
  },

  rangeAreaExample: {
    data: [
      { semaine: 'S1', p5: 60, p95: 340 },
      { semaine: 'S2', p5: 72, p95: 390 },
      { semaine: 'S3', p5: 55, p95: 310 },
      { semaine: 'S4', p5: 68, p95: 370 },
      { semaine: 'S5', p5: 50, p95: 300 },
      { semaine: 'S6', p5: 80, p95: 420 },
    ],
    config: {
      title: 'Temps de réponse : P5 à P95 (ms)',
      series: [{ data: { x: field('semaine'), y: rangeFields('p5', 'p95') }, name: 'P5–P95' }],
    },
  },

  heatmapExample: {
    data: [
      { heure: '00h', jour: 'Lun', val: 12 },
      { heure: '08h', jour: 'Lun', val: 42 },
      { heure: '16h', jour: 'Lun', val: 35 },
      { heure: '00h', jour: 'Mar', val: 10 },
      { heure: '08h', jour: 'Mar', val: 45 },
      { heure: '16h', jour: 'Mar', val: 38 },
      { heure: '00h', jour: 'Mer', val: 8  },
      { heure: '08h', jour: 'Mer', val: 50 },
      { heure: '16h', jour: 'Mer', val: 40 },
      { heure: '00h', jour: 'Jeu', val: 7  },
      { heure: '08h', jour: 'Jeu', val: 48 },
      { heure: '16h', jour: 'Jeu', val: 39 },
      { heure: '00h', jour: 'Ven', val: 9  },
      { heure: '08h', jour: 'Ven', val: 46 },
      { heure: '16h', jour: 'Ven', val: 36 },
    ],
    config: {
      title: 'Trafic hebdomadaire',
      series: [{ data: { x: field('heure'), y: field('val') }, name: field('jour') }],
    },
  },

  treemapExample: {
    data: [
      { label: 'Auth', count: 320 },
      { label: 'Payment', count: 210 },
      { label: 'Catalog', count: 180 },
      { label: 'Cart', count: 150 },
      { label: 'Search', count: 130 },
      { label: 'Profile', count: 90  },
      { label: 'Notif', count: 60  },
    ],
    config: {
      title: 'Appels par micro-service',
      series: [{ data: { x: field('label'), y: field('count') } }],
    },
  },

  funnelExample: {
    data: [
      { etape: 'Visites', count: 10000 },
      { etape: 'Inscriptions', count: 4200  },
      { etape: 'Activation', count: 2100  },
      { etape: 'Rétention', count: 900   },
      { etape: 'Conversion', count: 320   },
    ],
    config: {
      title: 'Funnel de conversion produit',
      series: [{ data: { x: field('etape'), y: field('count') } }],
    },
  },

  pyramidExample: {
    data: [
      { tranche: '18-24', count: 1200 },
      { tranche: '25-34', count: 2800 },
      { tranche: '35-44', count: 3400 },
      { tranche: '45-54', count: 2600 },
      { tranche: '55+', count: 1800 },
    ],
    config: {
      title: 'Pyramide démographique utilisateurs',
      series: [{ data: { x: field('tranche'), y: field('count') } }],
    },
  },

  radarExample: {
    data: [
      { dim: 'Performance', svc_a: 80, svc_b: 65 },
      { dim: 'Fiabilité', svc_a: 92, svc_b: 88 },
      { dim: 'Sécurité', svc_a: 75, svc_b: 90 },
      { dim: 'Scalabilité', svc_a: 70, svc_b: 60 },
      { dim: 'UX', svc_a: 85, svc_b: 72 },
    ],
    config: {
      title: 'Comparaison services',
      series: [
        { data: { x: field('dim'), y: field('svc_a') }, name: 'Service A' },
        { data: { x: field('dim'), y: field('svc_b') }, name: 'Service B' },
      ],
    },
  },

  rangeBarExample: {
    data: [
      { tache: 'Design', debut: 1, fin: 3 },
      { tache: 'Développement', debut: 2, fin: 7 },
      { tache: 'Tests', debut: 6, fin: 9 },
      { tache: 'Déploiement', debut: 8, fin: 10 },
    ],
    config: {
      title: 'Planning projet (Gantt)',
      subtitle: 'En semaines',
      series: [{ data: { x: field('tache'), y: rangeFields('debut', 'fin') } }],
    },
  },

  rangeColumnExample: {
    data: [
      { mois: 'Jan', min: 96.1, max: 99.2 },
      { mois: 'Fév', min: 96.8, max: 99.4 },
      { mois: 'Mar', min: 95.6, max: 99.0 },
      { mois: 'Avr', min: 97.2, max: 99.6 },
      { mois: 'Mai', min: 97.8, max: 99.7 },
    ],
    config: {
      title: 'SLA : plage de disponibilité (%)',
      series: [{ data: { x: field('mois'), y: rangeFields('min', 'max') }, name: 'Uptime' }],
    },
  },

  multiSeriesExample: {
    data: [
      { date: '19 nov', authorized: 0.21, unauthorized: 0.12, trend: 0.15 },
      { date: '20 nov', authorized: 0.20, unauthorized: 0.13, trend: 0.18 },
      { date: '21 nov', authorized: 0.23, unauthorized: 0.18, trend: 0.22 },
      { date: '22 nov', authorized: 0.28, unauthorized: 0.12, trend: 0.25 },
      { date: '23 nov', authorized: 0.17, unauthorized: 0.10, trend: 0.20 },
    ],
    config: {
      title: 'Production multi-séries',
      xtitle: 'Date',
      ytitle: 'Production (MWh)',
      series: [
        { data: { x: field('date'), y: field('authorized') }, name: 'Autorisé', type: 'column', stack: 'production' },
        { data: { x: field('date'), y: field('unauthorized') }, name: 'Effectif', type: 'column', stack: 'production' },
        { data: { x: field('date'), y: field('trend') }, name: 'Tendance', type: 'line' },
      ],
    },
  },

  dualAxisExample: {
    data: [
      { mois: 'Jan', production: 420, temperature: 8   },
      { mois: 'Fév', production: 390, temperature: 10  },
      { mois: 'Mar', production: 450, temperature: 14  },
      { mois: 'Avr', production: 480, temperature: 18  },
      { mois: 'Mai', production: 520, temperature: 22  },
      { mois: 'Jun', production: 580, temperature: 26  },
      { mois: 'Jul', production: 620, temperature: 28  },
      { mois: 'Aoû', production: 610, temperature: 27  },
      { mois: 'Sep', production: 550, temperature: 24  },
      { mois: 'Oct', production: 480, temperature: 18  },
      { mois: 'Nov', production: 420, temperature: 12  },
      { mois: 'Déc', production: 380, temperature: 6   },
    ],
    config: {
      title: 'Production solaire vs température',
      series: [
        { data: { x: field('mois'), y: field('production') }, name: 'Production', type: 'column', unit: 'MWh', yAxisIndex: 0 },
        { data: { x: field('mois'), y: field('temperature') }, name: 'Température', type: 'line', unit: '°C', yAxisIndex: 1 },
      ],
    },
  },

  customAxisExample: {
    data: [
      { mois: 'Jan', production: 420, temperature: 8 },
      { mois: 'Fév', production: 390, temperature: 10 },
      { mois: 'Mar', production: 450, temperature: 14 },
      { mois: 'Avr', production: 480, temperature: 18 },
      { mois: 'Mai', production: 520, temperature: 22 },
      { mois: 'Jun', production: 580, temperature: 26 },
    ],
    config: {
      title: 'Axes Y personnalisés',
      ytitle: ['Production (MWh)', 'Température (°C)'],
      series: [
        {
          data: { x: field('mois'), y: field('production') },
          name: 'Production',
          type: 'column',
          unit: 'MWh',
          yAxisIndex: 0,
          yAxisConfig: {
            min: 0,
            splitNumber: 4,
            axisLine: { lineStyle: { color: '#4f6fd8' } },
            axisLabel: { formatter: (value: number) => `${value} MWh` },
          },
        },
        {
          data: { x: field('mois'), y: field('temperature') },
          name: 'Température',
          type: 'line',
          unit: '°C',
          yAxisIndex: 1,
          yAxisConfig: {
            min: 0,
            max: 40,
            splitNumber: 4,
            axisLine: { lineStyle: { color: '#9dcc18' } },
            axisLabel: { formatter: (value: number) => `${value} °C` },
          },
        },
      ],
    },
  },

  mixedCategoryExample: {
    data: [
      { trimestre: 'T1', produit: 120, service: 80, objectif: 180 },
      { trimestre: 'T2', produit: 150, service: 95, objectif: 210 },
      { trimestre: 'T3', produit: 135, service: 110, objectif: 230 },
      { trimestre: 'T4', produit: 180, service: 125, objectif: 250 },
    ],
    config: {
      title: 'Colonnes empilées et ligne objectif',
      ytitle: ['Chiffre d’affaires (k€)', 'Objectif (k€)'],
      series: [
        {
          data: { x: field('trimestre'), y: field('produit') },
          name: 'Produit',
          type: 'column',
          stack: 'ca',
          yAxisIndex: 0,
        },
        {
          data: { x: field('trimestre'), y: field('service') },
          name: 'Service',
          type: 'column',
          stack: 'ca',
          yAxisIndex: 0,
        },
        {
          data: { x: field('trimestre'), y: field('objectif') },
          name: 'Objectif',
          type: 'line',
          yAxisIndex: 1,
          yAxisConfig: {
            min: 0,
            splitNumber: 5,
            alignTicks: false,
            axisLine: { lineStyle: { color: '#555b82' } },
          },
        },
      ],
    },
  },

  pivotRowsExample: {
    data: PIVOT_ROWS_RESULT,
    config: {
      title: 'Pivot de donnees longues vers donnees larges',
      xtitle: 'Type d usage',
      ytitle: 'Consommation',
      series: [
        {
          data: { x: field('usage_type'), y: field('consumption_beneficiaire') },
          name: 'Beneficiaire',
          type: 'column',
        },
        {
          data: { x: field('usage_type'), y: field('consumption_titulaire') },
          name: 'Titulaire',
          type: 'column',
        },
        {
          data: { x: field('usage_type'), y: field('consumption_absent') },
          name: 'Categorie absente',
          type: 'line',
          color: '#9aa4b2',
        },
      ],
    },
    code: `import { field, pivotRows } from '@oneteme/jquery-core';
import { ChartProvider } from '@oneteme/jquery-core';

// Données longues : une ligne par usage et par catégorie.
const source = [
  { usage_type: 'Eclairage Public', authorization_type: 'beneficiaire', consumption: 120 },
  { usage_type: 'Eclairage Public', authorization_type: 'beneficiaire', consumption: 30 },
  { usage_type: 'Eclairage Public', authorization_type: 'titulaire', consumption: 80 },
  { usage_type: 'Industrie', authorization_type: 'beneficiaire', consumption: 240 },
  { usage_type: 'Industrie', authorization_type: 'titulaire', consumption: 160 },
];

// Le pivot crée une colonne par catégorie et remplit les absences avec 0.
const data = pivotRows(source, {
  index: 'usage_type',
  columns: 'authorization_type',
  values: ['consumption'],
  columnValues: ['beneficiaire', 'titulaire', 'absent'],
  aggregate: 'sum',
  fill: 0,
});

const config: ChartProvider<string, number> = {
  title: 'Pivot de donnees longues vers donnees larges',
  xtitle: 'Type d usage',
  ytitle: 'Consommation',
  series: [
    { data: { x: field('usage_type'), y: field('consumption_beneficiaire') }, name: 'Beneficiaire', type: 'column' },
    { data: { x: field('usage_type'), y: field('consumption_titulaire') }, name: 'Titulaire', type: 'column' },
    { data: { x: field('usage_type'), y: field('consumption_absent') }, name: 'Categorie absente', type: 'line', color: '#9aa4b2' }
  ]
};

// Template Angular
<chart type="mixed" [config]="config" [data]="data"></chart>`
  },
};
