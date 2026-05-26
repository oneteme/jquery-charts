import { field, rangeFields } from '@oneteme/jquery-core';

// ──────────────────────────────────────────────────────────────────────────────
// Données d'exemples pour @oneteme/jquery-highcharts
// Tous les types supportés par la bibliothèque, avec config propre.
// ──────────────────────────────────────────────────────────────────────────────

export const HIGHCHARTS_EXAMPLES = {

  // ── Standard XY ────────────────────────────────────────────────────────────

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

  splineExample: {
    data: [
      { mois: 'Jan', backend: 245, frontend: 180, mobile: 95  },
      { mois: 'Fév', backend: 188, frontend: 210, mobile: 130 },
      { mois: 'Mar', backend: 320, frontend: 165, mobile: 210 },
      { mois: 'Avr', backend: 270, frontend: 290, mobile: 175 },
      { mois: 'Mai', backend: 410, frontend: 240, mobile: 310 },
      { mois: 'Jun', backend: 360, frontend: 380, mobile: 260 },
    ],
    config: {
      title: 'Incidents par équipe',
      subtitle: 'Courbes lissées (spline)',
      series: [
        { data: { x: field('mois'), y: field('backend')  }, name: 'Backend'  },
        { data: { x: field('mois'), y: field('frontend') }, name: 'Frontend' },
        { data: { x: field('mois'), y: field('mobile')   }, name: 'Mobile'   },
      ],
    },
  },

  areasplineExample: {
    data: [
      { heure: '00h', cpu: 18, memory: 42 },
      { heure: '04h', cpu: 12, memory: 38 },
      { heure: '08h', cpu: 55, memory: 61 },
      { heure: '12h', cpu: 78, memory: 74 },
      { heure: '16h', cpu: 65, memory: 68 },
      { heure: '20h', cpu: 40, memory: 55 },
    ],
    config: {
      title: 'Utilisation ressources serveur',
      subtitle: 'CPU vs Mémoire (%)',
      series: [
        { data: { x: field('heure'), y: field('cpu')    }, name: 'CPU %'     },
        { data: { x: field('heure'), y: field('memory') }, name: 'Mémoire %' },
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
      title: 'Volume de requêtes',
      subtitle: 'Zone remplie',
      series: [{ data: { x: field('heure'), y: field('req') }, name: 'Requêtes' }],
    },
  },

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

  scatterExample: {
    data: [
      { spend: 12, leads: 420, seg: 'Retail'     },
      { spend: 18, leads: 510, seg: 'Retail'     },
      { spend: 30, leads: 720, seg: 'Enterprise' },
      { spend: 38, leads: 860, seg: 'Enterprise' },
      { spend: 6,  leads: 210, seg: 'SMB'        },
      { spend: 9,  leads: 280, seg: 'SMB'        },
    ],
    config: {
      title: 'Marketing : budget vs leads',
      xtitle: 'Dépenses (k€)',
      ytitle: 'Leads',
      continue: true,
      series: [{ data: { x: field('spend'), y: field('leads') }, name: field('seg') }],
    },
  },

  // ── Simple (Pie / Donut / Funnel / Pyramid) ───────────────────────────────

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

  funnelExample: {
    data: [
      { etape: 'Visites',     count: 10000 },
      { etape: 'Inscriptions',count: 4200  },
      { etape: 'Activation',  count: 2100  },
      { etape: 'Rétention',   count: 900   },
      { etape: 'Conversion',  count: 320   },
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

  // ── Polar / Radar ─────────────────────────────────────────────────────────

  polarExample: {
    data: [
      { mois: 'Jan', val: 30 },
      { mois: 'Fév', val: 45 },
      { mois: 'Mar', val: 80 },
      { mois: 'Avr', val: 60 },
      { mois: 'Mai', val: 95 },
      { mois: 'Jun', val: 70 },
      { mois: 'Jul', val: 85 },
      { mois: 'Aoû', val: 75 },
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

  radarAreaExample: {
    data: [
      { critere: 'Perf',     score_a: 85, score_b: 70 },
      { critere: 'Sécu',     score_a: 72, score_b: 88 },
      { critere: 'Mainten.', score_a: 90, score_b: 65 },
      { critere: 'Tests',    score_a: 78, score_b: 82 },
      { critere: 'Docs',     score_a: 65, score_b: 91 },
    ],
    config: {
      title: 'Audit technique équipes',
      subtitle: 'Radar avec remplissage',
      series: [
        { data: { x: field('critere'), y: field('score_a') }, name: 'Équipe A' },
        { data: { x: field('critere'), y: field('score_b') }, name: 'Équipe B' },
      ],
    },
  },

  radialBarExample: {
    data: [
      { service: 'Auth',    uptime: 99.8 },
      { service: 'API GW',  uptime: 99.5 },
      { service: 'Payment', uptime: 98.9 },
      { service: 'Search',  uptime: 97.2 },
      { service: 'Notif',   uptime: 96.5 },
    ],
    config: {
      title: 'Uptime par service (%)',
      series: [{ data: { x: field('service'), y: field('uptime') }, name: 'Uptime' }],
    },
  },

  // ── Bubble ────────────────────────────────────────────────────────────────

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
      series: [{ data: { x: field('x'), y: field('y') }, name: field('name') }],
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
      { label: 'Auth',    count: 320 },
      { label: 'Payment', count: 210 },
      { label: 'Catalog', count: 180 },
      { label: 'Cart',    count: 150 },
      { label: 'Search',  count: 130 },
      { label: 'Profile', count: 90  },
      { label: 'Notif',   count: 60  },
    ],
    config: {
      title: 'Appels par micro-service',
      series: [{ data: { x: field('label'), y: field('count') } }],
    },
  },

  // ── Range charts ─────────────────────────────────────────────────────────

  columnrangeExample: {
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

  arearangeExample: {
    data: [
      { mois: 'Jan', tmin: 2,  tmax: 9  },
      { mois: 'Fév', tmin: 3,  tmax: 11 },
      { mois: 'Mar', tmin: 6,  tmax: 15 },
      { mois: 'Avr', tmin: 9,  tmax: 19 },
      { mois: 'Mai', tmin: 13, tmax: 23 },
      { mois: 'Jun', tmin: 16, tmax: 27 },
      { mois: 'Jul', tmin: 18, tmax: 30 },
      { mois: 'Aoû', tmin: 17, tmax: 29 },
    ],
    config: {
      title: 'Températures mensuelles (°C)',
      subtitle: 'Plage min/max — zone remplie',
      series: [{ data: { x: field('mois'), y: rangeFields('tmin', 'tmax') }, name: 'Température' }],
    },
  },

  areasplinerangeExample: {
    data: [
      { semaine: 'S1', low: 88, high: 94 },
      { semaine: 'S2', low: 90, high: 96 },
      { semaine: 'S3', low: 87, high: 93 },
      { semaine: 'S4', low: 92, high: 98 },
      { semaine: 'S5', low: 91, high: 97 },
      { semaine: 'S6', low: 89, high: 95 },
    ],
    config: {
      title: 'Score de qualité code (%)',
      subtitle: 'Plage lissée (areasplinerange)',
      series: [{ data: { x: field('semaine'), y: rangeFields('low', 'high') }, name: 'Score' }],
    },
  },
};
