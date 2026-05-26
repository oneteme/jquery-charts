import { field, rangeFields } from '@oneteme/jquery-core';

// ──────────────────────────────────────────────────────────────────────────────
// Données d'exemples pour @oneteme/jquery-apexcharts
// Types supportés : pie, donut, polar, radar, radial,
//                   line, area, bar, column, heatmap, treemap,
//                   funnel, pyramid, rangeArea, rangeBar, rangeColumn
// ──────────────────────────────────────────────────────────────────────────────

export const APEXCHARTS_EXAMPLES = {

  // ── Pie / Donut ───────────────────────────────────────────────────────────

  pieExample: {
    data: [
      { segment: 'Enterprise', value: 42 },
      { segment: 'Mid-Market', value: 28 },
      { segment: 'SMB',        value: 18 },
      { segment: 'Public',     value: 12 },
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

  // ── Polar / Radar / Radial ────────────────────────────────────────────────

  polarExample: {
    data: [
      { mois: 'Jan', val: 30 },
      { mois: 'Fév', val: 45 },
      { mois: 'Mar', val: 80 },
      { mois: 'Avr', val: 60 },
      { mois: 'Mai', val: 95 },
      { mois: 'Jun', val: 70 },
    ],
    config: {
      title: 'Activité mensuelle',
      subtitle: 'Graphique polaire',
      series: [{ data: { x: field('mois'), y: field('val') }, name: 'Activité' }],
    },
  },

  radarExample: {
    data: [
      { dim: 'Performance', svc_a: 80, svc_b: 65 },
      { dim: 'Fiabilité',   svc_a: 92, svc_b: 88 },
      { dim: 'Sécurité',    svc_a: 75, svc_b: 90 },
      { dim: 'Scalabilité', svc_a: 70, svc_b: 60 },
      { dim: 'UX',          svc_a: 85, svc_b: 72 },
    ],
    config: {
      title: 'Comparaison services',
      series: [
        { data: { x: field('dim'), y: field('svc_a') }, name: 'Service A' },
        { data: { x: field('dim'), y: field('svc_b') }, name: 'Service B' },
      ],
    },
  },

  radialExample: {
    data: [
      { service: 'Auth',    uptime: 99 },
      { service: 'API GW',  uptime: 97 },
      { service: 'Payment', uptime: 95 },
      { service: 'Search',  uptime: 91 },
    ],
    config: {
      title: 'Uptime par service (%)',
      series: [{ data: { x: field('service'), y: field('uptime') }, name: 'Uptime' }],
    },
  },

  // ── Line / Area ────────────────────────────────────────────────────────────

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
      subtitle: 'P50 vs P95 (ms)',
      series: [
        { data: { x: field('semaine'), y: field('p50') }, name: 'P50' },
        { data: { x: field('semaine'), y: field('p95') }, name: 'P95' },
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

  // ── Bar / Column ──────────────────────────────────────────────────────────

  barExample: {
    data: [
      { palier: 'P1 Critique', count: 42  },
      { palier: 'P2 Élevé',    count: 68  },
      { palier: 'P3 Moyen',    count: 96  },
      { palier: 'P4 Faible',   count: 124 },
    ],
    config: {
      title: 'Tickets par priorité',
      subtitle: '30 derniers jours',
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
        { data: { x: field('mois'), y: field('stg')  }, name: 'Staging'    },
        { data: { x: field('mois'), y: field('dev')  }, name: 'Dev'        },
      ],
    },
  },

  // ── Heatmap / Treemap ─────────────────────────────────────────────────────

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
    ],
    config: {
      title: 'Trafic hebdomadaire',
      series: [{ data: { x: field('heure'), y: field('val') }, name: field('jour') }],
    },
  },

  treemapExample: {
    data: [
      { label: 'Auth',    count: 320 },
      { label: 'Payment', count: 210 },
      { label: 'Catalog', count: 180 },
      { label: 'Cart',    count: 150 },
      { label: 'Search',  count: 130 },
      { label: 'Profile', count: 90  },
    ],
    config: {
      title: 'Appels par micro-service',
      series: [{ data: { x: field('label'), y: field('count') } }],
    },
  },

  // ── Funnel / Pyramid ──────────────────────────────────────────────────────

  funnelExample: {
    data: [
      { etape: 'Visites',      count: 10000 },
      { etape: 'Inscriptions', count: 4200  },
      { etape: 'Activation',   count: 2100  },
      { etape: 'Rétention',    count: 900   },
      { etape: 'Conversion',   count: 320   },
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
      { tranche: '55+',   count: 1800 },
    ],
    config: {
      title: 'Pyramide démographique utilisateurs',
      series: [{ data: { x: field('tranche'), y: field('count') } }],
    },
  },

  // ── Range charts ─────────────────────────────────────────────────────────

  rangeBarExample: {
    data: [
      { tache: 'Design',       debut: 1, fin: 3  },
      { tache: 'Développement',debut: 2, fin: 7  },
      { tache: 'Tests',        debut: 6, fin: 9  },
      { tache: 'Déploiement',  debut: 8, fin: 10 },
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
      subtitle: 'Colonnes min/max',
      series: [{ data: { x: field('mois'), y: rangeFields('min', 'max') }, name: 'Uptime' }],
    },
  },

  rangeAreaExample: {
    data: [
      { mois: 'Jan', tmin: 2,  tmax: 9  },
      { mois: 'Fév', tmin: 3,  tmax: 11 },
      { mois: 'Mar', tmin: 6,  tmax: 15 },
      { mois: 'Avr', tmin: 9,  tmax: 19 },
      { mois: 'Mai', tmin: 13, tmax: 23 },
      { mois: 'Jun', tmin: 16, tmax: 27 },
    ],
    config: {
      title: 'Températures mensuelles (°C)',
      subtitle: 'Zone min/max',
      series: [{ data: { x: field('mois'), y: rangeFields('tmin', 'tmax') }, name: 'Température' }],
    },
  },
};
