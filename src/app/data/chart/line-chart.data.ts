import { field, joinFields } from '@oneteme/jquery-core';
import { ChartDataCollection, LineChartData } from '../../core/models/chart.model';

export const LINE_CHART_DATA: ChartDataCollection<LineChartData> = {
  lineExample: {
    data: [
      { date: '01-2023', count_2xx: 110, count_4xx: 90, count_5xx: 30 },
      { date: '02-2023', count_2xx: 125, count_4xx: 65, count_5xx: 45 },
      { date: '03-2023', count_2xx: 150, count_4xx: 80, count_5xx: 60 },
      { date: '04-2023', count_2xx: 160, count_4xx: 100, count_5xx: 40 },
      { date: '05-2023', count_2xx: 180, count_4xx: 110, count_5xx: 20 },
    ],
    config: {
      title: 'Évolution des codes HTTP',
      subtitle: 'Tendance sur 5 mois',
      showToolbar: true,
      series: [
        {
          data: { x: field('date'), y: field('count_2xx') },
          name: 'Succès',
          color: '#4CAF50',
        },
        {
          data: { x: field('date'), y: field('count_4xx') },
          name: 'Erreur client',
          color: '#FF9800',
        },
        {
          data: { x: field('date'), y: field('count_5xx') },
          name: 'Erreur serveur',
          color: '#F44336',
        },
      ],
      height: 250,
      options: {
        chart: {
          dropShadow: {
            enabled: true,
            top: 2,
            left: 1,
            blur: 5,
            opacity: 0.15,
          },
        },
        stroke: {
          curve: 'smooth',
          width: [4, 4, 4],
        },
        markers: {
          size: 5,
          strokeWidth: 0,
          hover: {
            size: 8,
          },
        },
        xaxis: {
          labels: {
            style: {
              fontWeight: 'bold',
              colors: ['#333'],
            },
            format: 'YY MMM',
          },
          axisBorder: {
            show: true,
            color: '#78909c',
            height: 1,
          },
        },
        yaxis: {
          title: {
            text: "Nombre d'appels",
            style: {
              fontSize: '12px',
              fontWeight: 'bold',
            },
          },
          labels: {
            formatter: function (val) {
              return val.toFixed(0);
            },
          },
        },
        tooltip: {
          shared: true,
          intersect: false,
          theme: 'light',
          y: {
            formatter: function (val) {
              return val + ' requêtes';
            },
          },
        },
        grid: {
          borderColor: '#f1f1f1',
          row: {
            colors: ['#f8f8f8', 'transparent'],
            opacity: 0.5,
          },
        },
        legend: {
          position: 'top',
          horizontalAlign: 'right',
          floating: true,
          offsetY: -25,
          offsetX: -5,
        },
        dataLabels: {
          enabled: false,
        },
      },
    },
  },

  lineExample2: {
    data: [
      { count: 110, field: '2xx' },
      { count: 160, field: '4xx' },
      { count: 80, field: '5xx' },
    ],
    config: {
      title: 'Répartition simple',
      subtitle: 'Vue par code de statut',
      series: [
        {
          data: { x: field('field'), y: field('count') },
          name: "Nombre d'appels",
          color: '#CA3C66',
        },
      ],
      height: 250,
      options: {
        colors: ['#CA3C66', '#DB6A8F', '#E8AABE'],
        chart: {
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
            animateGradually: {
              enabled: true,
              delay: 150,
            },
            dynamicAnimation: {
              enabled: true,
              speed: 350,
            },
          },
        },
        stroke: {
          width: 5,
          curve: 'smooth',
        },
        markers: {
          size: 6,
          colors: ['#fff'],
          strokeColors: '#CA3C66',
          strokeWidth: 3,
          hover: {
            size: 8,
          },
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'dark',
            type: 'vertical',
            shadeIntensity: 0.5,
            gradientToColors: ['#DB6A8F'],
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 0.8,
            stops: [0, 100],
          },
        },
        dataLabels: {
          enabled: true,
          background: {
            enabled: true,
            foreColor: '#fff',
            borderRadius: 2,
            padding: 4,
            opacity: 0.9,
          },
          style: {
            fontSize: '12px',
          },
        },
        tooltip: {
          theme: 'dark',
          x: {
            show: false,
          },
          y: {
            title: {
              formatter: () => 'Requêtes:',
            },
            formatter: (val) => `${val} requêtes`,
          },
        },
        grid: {
          row: {
            colors: ['#f3f3f3', 'transparent'],
            opacity: 0.5,
          },
        },
      },
    },
  },

  lineExample3: {
    data: [
      { count: 80, field: 'Api 1', subField: '2xx' },
      { count: 20, field: 'Api 2', subField: '2xx' },
      { count: 10, field: 'Api 3', subField: '2xx' },
      { count: 50, field: 'Api 1', subField: '4xx' },
      { count: 60, field: 'Api 2', subField: '4xx' },
      { count: 50, field: 'Api 3', subField: '4xx' },
      { count: 10, field: 'Api 1', subField: '5xx' },
      { count: 20, field: 'Api 2', subField: '5xx' },
      { count: 50, field: 'Api 3', subField: '5xx' },
    ],
    config: {
      title: 'Regroupement par statut HTTP',
      subtitle: 'Analyse des tendances par API',
      series: [
        {
          data: { x: field('field'), y: field('count') },
          name: field('subField'),
        },
      ],
      height: 250,
      options: {
        colors: ['#77021D', '#F6B339', '#DA7B27'],
        stroke: {
          width: 3,
          curve: 'smooth',
        },
        markers: {
          size: 4,
          hover: {
            size: 6,
          },
        },
        xaxis: {
          categories: ['Api 1', 'Api 2', 'Api 3'],
          title: {
            text: 'APIs',
          },
        },
        yaxis: {
          title: {
            text: "Nombre d'appels",
          },
          min: 0,
          max: 100,
        },
        legend: {
          position: 'top',
          horizontalAlign: 'right',
          floating: true,
          offsetY: -25,
          offsetX: -5,
        },
        tooltip: {
          y: {
            formatter: function (value) {
              return value + ' requêtes';
            },
          },
        },
      },
    },
  },

  lineExample4: {
    data: [
      { count: 80, field: 'Api 1', subField: '2xx' },
      { count: 20, field: 'Api 2', subField: '2xx' },
      { count: 10, field: 'Api 3', subField: '2xx' },
      { count: 50, field: 'Api 1', subField: '4xx' },
      { count: 60, field: 'Api 2', subField: '4xx' },
      { count: 50, field: 'Api 3', subField: '4xx' },
      { count: 10, field: 'Api 1', subField: '5xx' },
      { count: 20, field: 'Api 2', subField: '5xx' },
      { count: 50, field: 'Api 3', subField: '5xx' },
    ],
    config: {
      title: 'Analyse croisée API/Status',
      subtitle: 'Utilisation de joinFields pour les étiquettes',
      series: [
        {
          data: { x: joinFields('_', 'field', 'subField'), y: field('count') },
          name: 'Appels API',
        },
      ],
      height: 250,
      options: {
        colors: ['#137C8B'],
        chart: {
          type: 'line',
          dropShadow: {
            enabled: true,
            color: '#000',
            top: 3,
            left: 2,
            blur: 4,
            opacity: 0.1,
          },
        },
        dataLabels: {
          enabled: true,
          offsetY: -10,
          style: {
            fontSize: '12px',
            colors: ['#304758'],
          },
          background: {
            enabled: true,
            foreColor: '#fff',
            padding: 4,
            borderRadius: 2,
            borderWidth: 1,
            borderColor: '#137C8B',
            opacity: 0.9,
          },
        },
        stroke: {
          curve: 'stepline',
          width: 3,
        },
        grid: {
          row: {
            colors: ['#f3f3f3', 'transparent'],
            opacity: 0.5,
          },
        },
        markers: {
          size: 6,
          colors: ['#fff'],
          strokeColors: '#137C8B',
          strokeWidth: 2,
        },
        xaxis: {
          categories: [
            'Api 1_2xx',
            'Api 2_2xx',
            'Api 3_2xx',
            'Api 1_4xx',
            'Api 2_4xx',
            'Api 3_4xx',
            'Api 1_5xx',
            'Api 2_5xx',
            'Api 3_5xx',
          ],
          labels: {
            rotate: -45,
            style: {
              fontSize: '11px',
              colors: Array(9).fill('#5c5c5c'),
            },
          },
          axisBorder: {
            show: true,
            color: '#78909c',
            height: 1,
          },
          title: {
            text: 'API et code',
            style: {
              fontSize: '12px',
              fontWeight: 600,
            },
          },
        },
        yaxis: {
          title: {
            text: "Nombre d'appels",
            style: {
              fontSize: '12px',
              fontWeight: 600,
            },
          },
          min: 0,
          labels: {
            formatter: function (val) {
              return val.toFixed(0);
            },
          },
        },
        annotations: {
          points: [
            {
              x: 'Api 2_4xx',
              y: 60,
              marker: {
                size: 8,
                fillColor: '#fff',
                strokeColor: '#FF4560',
                radius: 2,
              },
              label: {
                borderColor: '#FF4560',
                offsetY: 0,
                style: {
                  color: '#fff',
                  background: '#FF4560',
                },
                text: 'Point critique',
              },
            },
          ],
          yaxis: [
            {
              y: 50,
              strokeDashArray: 5,
              borderColor: '#00E396',
              label: {
                borderColor: '#00E396',
                style: {
                  color: '#fff',
                  background: '#00E396',
                },
                text: "Seuil d'alerte",
              },
            },
          ],
        },
        tooltip: {
          fixed: {
            enabled: true,
            position: 'topRight',
            offsetY: 30,
          },
          y: {
            formatter: function (val) {
              return val + ' requêtes';
            },
          },
        },
      },
    },
  },

  lineExample5: {
    data: [
      { count: 80, field: 'Api 1', subField: '2xx' },
      { count: 20, field: 'Api 2', subField: '2xx' },
      { count: 10, field: 'Api 3', subField: '2xx' },
      { count: 50, field: 'Api 1', subField: '4xx' },
      { count: 60, field: 'Api 2', subField: '4xx' },
      { count: 50, field: 'Api 3', subField: '4xx' },
      { count: 10, field: 'Api 1', subField: '5xx' },
      { count: 20, field: 'Api 2', subField: '5xx' },
      { count: 50, field: 'Api 3', subField: '5xx' },
    ],
    config: {
      title: 'Regroupement par statut HTTP',
      subtitle: 'Analyse des tendances par API',
      series: [
        {
          data: { x: field('field'), y: field('count') },
          name: field('subField'),
        },
      ],
      height: 250,
      options: {
        colors: ['#77021D', '#F6B339', '#DA7B27'],
        chart: {
          toolbar: {
            show: true,
            tools: {
              download: true,
            },
          },
          dropShadow: {
            enabled: true,
            top: 0,
            left: 0,
            blur: 3,
            opacity: 0.2,
          },
        },
        stroke: {
          width: 4,
          curve: 'smooth',
          lineCap: 'round',
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            type: 'vertical',
            shadeIntensity: 0.3,
            opacityFrom: 0.7,
            opacityTo: 0.4,
            stops: [0, 100],
          },
        },
        markers: {
          size: 6,
          strokeWidth: 0,
          hover: {
            size: 9,
            sizeOffset: 3,
          },
        },
        xaxis: {
          categories: ['Api 1', 'Api 2', 'Api 3'],
          title: {
            text: 'APIs',
            style: {
              fontSize: '12px',
              fontWeight: 600,
            },
          },
          labels: {
            style: {
              fontWeight: '500',
              colors: ['#3e4045', '#3e4045', '#3e4045'],
            },
          },
        },
        yaxis: {
          title: {
            text: "Nombre d'appels",
            style: {
              fontSize: '12px',
              fontWeight: 600,
            },
          },
          min: 0,
          max: 100,
          tickAmount: 5,
          labels: {
            formatter: function (val) {
              return val.toFixed(0);
            },
          },
        },
        legend: {
          position: 'top',
          horizontalAlign: 'right',
          floating: true,
          offsetY: -25,
          offsetX: -5,
          markers: {
            width: 12,
            height: 12,
            strokeWidth: 0,
            radius: 12,
            offsetX: -3,
          },
          itemMargin: {
            horizontal: 10,
            vertical: 8,
          },
        },
        tooltip: {
          shared: true,
          intersect: false,
          custom: function ({ series, seriesIndex, dataPointIndex, w }) {
            const status = w.globals.seriesNames[seriesIndex];
            const api = w.globals.categoryLabels[dataPointIndex];
            const value = series[seriesIndex][dataPointIndex];
            return `
              <div class="apexcharts-tooltip-title" style="font-weight: bold; margin-bottom: 3px">
                ${api} - ${status}
              </div>
              <div class="apexcharts-tooltip-series-group" style="padding-bottom: 0px">
                <span class="apexcharts-tooltip-marker" style="background-color: ${w.globals.colors[seriesIndex]}"></span>
                <div class="apexcharts-tooltip-text">
                  <div>Requêtes: ${value}</div>
                </div>
              </div>
            `;
          },
        },
        grid: {
          borderColor: '#e0e6ed',
          strokeDashArray: 5,
          xaxis: {
            lines: {
              show: true,
            },
          },
          yaxis: {
            lines: {
              show: true,
            },
          },
          padding: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 10,
          },
        },
        dataLabels: {
          enabled: true,
          formatter: function (val) {
            return val;
          },
          background: {
            enabled: true,
            foreColor: '#fff',
            borderRadius: 2,
            padding: 3,
            opacity: 0.7,
          },
        },
      },
    },
  },

  lineExample6: {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      title: 'Vue par API',
      subtitle: 'Comparaison des codes de statut',
      series: [
        {
          data: { x: field('field'), y: field('count_2xx') },
          name: 'Succès (2xx)',
          color: '#4CAF50',
        },
        {
          data: { x: field('field'), y: field('count_4xx') },
          name: 'Erreur client (4xx)',
          color: '#FF9800',
        },
        {
          data: { x: field('field'), y: field('count_5xx') },
          name: 'Erreur serveur (5xx)',
          color: '#F44336',
        },
      ],
      height: 250,
      options: {
        chart: {
          dropShadow: {
            enabled: true,
            opacity: 0.2,
            blur: 5,
          },
        },
        stroke: {
          curve: 'smooth',
          width: 3,
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            type: 'vertical',
            shadeIntensity: 0.25,
            gradientToColors: undefined,
            inverseColors: true,
            opacityFrom: 0.85,
            opacityTo: 0.95,
            stops: [0, 100],
          },
        },
        xaxis: {
          categories: ['Api 1', 'Api 2', 'Api 3'],
          title: {
            text: 'APIs',
          },
        },
        yaxis: {
          title: {
            text: "Nombre d'appels",
          },
        },
        markers: {
          size: 6,
          strokeWidth: 0,
          hover: {
            size: 9,
          },
        },
        grid: {
          show: true,
          borderColor: '#90A4AE',
          strokeDashArray: 0,
          position: 'back',
          xaxis: {
            lines: {
              show: false,
            },
          },
          yaxis: {
            lines: {
              show: true,
            },
          },
        },
        tooltip: {
          shared: true,
          intersect: false,
          y: {
            formatter: function (val) {
              return val + ' requêtes';
            },
          },
        },
      },
    },
  },

  lineExample7: {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      title: 'Données empilées (ordre croissant)',
      subtitle: 'Visualisation des proportions',
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' },
      ],
      height: 250,
      stacked: true,
      xorder: 'asc',
      options: {
        colors: [
          '#8E44AD',
          '#16A085',
          '#F39C12',
          '#2980B9',
          '#C0392B',
          '#27AE60',
        ],
        chart: {
          toolbar: {
            show: true,
          },
        },
        dataLabels: {
          enabled: true,
          formatter: function (val) {
            return val;
          },
        },
        stroke: {
          curve: 'straight',
          width: 2,
        },
        fill: {
          type: 'solid',
          opacity: 1,
        },
        markers: {
          size: 0,
        },
        xaxis: {
          categories: ['Api 3', 'Api 2', 'Api 1'],
          title: {
            text: 'APIs (triées)',
          },
        },
        yaxis: {
          title: {
            text: 'Requêtes cumulées',
          },
          labels: {
            formatter: function (val) {
              return val.toFixed(0);
            },
          },
        },
        legend: {
          position: 'top',
          horizontalAlign: 'right',
        },
        tooltip: {
          shared: true,
          intersect: false,
          y: {
            formatter: function (val) {
              return val + ' requêtes';
            },
          },
        },
      },
    },
  },

  lineExample8: {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      series: [
        {
          data: { x: field('field'), y: field('count_2xx') },
          name: 'Succès (2xx)',
          color: '#8E44AD',
        },
        {
          data: { x: field('field'), y: field('count_4xx') },
          name: 'Erreur client (4xx)',
          color: '#16A085',
        },
        {
          data: { x: field('field'), y: field('count_5xx') },
          name: 'Erreur serveur (5xx)',
          color: '#F39C12',
        },
      ],
      height: 250,
      xorder: 'desc',
      options: {
        dataLabels: {
          enabled: false,
        },
        stroke: {
          curve: 'stepline',
          width: [3, 3, 3],
          dashArray: [0, 5, 10],
        },
        markers: {
          size: 5,
          shape: ['circle', 'square', 'triangle'],
          hover: {
            size: 7,
            sizeOffset: 3,
          },
        },
        xaxis: {
          categories: ['Api 1', 'Api 2', 'Api 3'],
          title: {
            text: 'APIs (triées)',
            style: {
              fontSize: '12px',
              fontWeight: 600,
            },
          },
          labels: {
            style: {
              colors: ['#2E294E', '#2E294E', '#2E294E'],
              fontSize: '12px',
            },
          },
          axisBorder: {
            show: true,
            color: '#78909c',
          },
          axisTicks: {
            show: true,
            color: '#78909c',
          },
        },
        yaxis: {
          title: {
            text: "Nombre d'appels",
            style: {
              fontSize: '12px',
              fontWeight: 600,
            },
          },
          min: 0,
          max: 100,
          tickAmount: 5,
          labels: {
            formatter: function (val) {
              return val.toFixed(0);
            },
            style: {
              colors: ['#555'],
            },
          },
        },
        grid: {
          borderColor: '#e0e0e0',
          strokeDashArray: 5,
          row: {
            colors: ['#f5f5f5', 'transparent'],
            opacity: 0.5,
          },
          column: {
            colors: ['#f5f5f5', 'transparent'],
          },
        },
        tooltip: {
          shared: true,
          intersect: false,
          theme: 'light',
          style: {
            fontSize: '12px',
          },
          marker: {
            show: true,
          },
          x: {
            show: true,
            format: 'dd MMM',
          },
          y: {
            formatter: function (val) {
              return val + ' requêtes';
            },
          },
        },
      },
    },
  },

  lineExample9: {
    data: [
      { count_2xx: 80, count_4xx: 50, count_5xx: 10, field: 'Api 1' },
      { count_2xx: 20, count_4xx: 60, count_5xx: 20, field: 'Api 2' },
      { count_2xx: 10, count_4xx: 50, count_5xx: 50, field: 'Api 3' },
    ],
    config: {
      title: 'Mode continu',
      subtitle: 'Visualisation des tendances',
      series: [
        { data: { x: field('field'), y: field('count_2xx') }, name: '2xx' },
        { data: { x: field('field'), y: field('count_4xx') }, name: '4xx' },
        { data: { x: field('field'), y: field('count_5xx') }, name: '5xx' },
      ],
      height: 250,
      continue: true,
      options: {
        colors: ['#77021D', '#F6B339', '#DA7B27'],
        chart: {
          toolbar: {
            show: true,
          },
          sparkline: {
            enabled: true,
          }
        },
        markers: {
          size: 5,
          shape: 'circle',
          hover: {
            size: 6,
          },
        },
        tooltip: {
          shared: true,
          intersect: false,
          y: {
            formatter: function (y, { series, seriesIndex, dataPointIndex }) {
              if (typeof y !== 'undefined') {
                return y + ' requêtes';
              }
              return y;
            },
          },
        },
        annotations: {
          yaxis: [
            {
              y: 50,
              borderColor: '#999',
              label: {
                text: 'SEUIL MOYEN',
                offsetY: -5,
                style: {
                  color: '#fff',
                  background: '#A7001E',
                },
              },
            },
          ],
        },
      },
    },
  },
};
