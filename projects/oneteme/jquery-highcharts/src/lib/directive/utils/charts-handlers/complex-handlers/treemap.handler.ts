import { ChartProvider, XaxisType, YaxisType } from '@oneteme/jquery-core';
import { ChartHandler } from './base-handler.interface';
import { validateSpecialChartData } from '../../chart-utils';

export class TreemapHandler<X extends XaxisType = XaxisType>
  implements ChartHandler<X>
{
  handle(
    data: any[],
    chartConfig: ChartProvider<X, YaxisType>,
    debug = false
  ): any {
    try {
      debug && console.log('Traitement des données treemap:', data);

      if (!validateSpecialChartData(data, 'treemap')) {
        debug &&
          console.log(
            'Données non optimales pour treemap, adaptation en cours...'
          );

        const treemapPoints = data.map((item: any, index: number) => {
          const pointName =
            item.category || item.month || item.name || `Item ${index + 1}`;
          const pointValue = Math.abs(
            typeof item.value === 'number' ? item.value : item.y || 0
          );

          return {
            name: pointName,
            value: pointValue,
            colorValue: item.value || item.y || pointValue,
          };
        });

        debug && console.log('Données treemap adaptées:', treemapPoints);

        return {
          series: [
            {
              type: 'treemap',
              name: chartConfig.title ?? 'Données',
              data: treemapPoints,
              layoutAlgorithm: 'squarified',
            },
          ],
          shouldRedraw: true,
        };
      } else {
        const treemapPoints = data.map((item: any, index: number) => ({
          name: item.month ?? item.category ?? item.name ?? `Item ${index + 1}`,
          value: Math.abs(item.value),
          colorValue: item.value,
          team: item.team ?? 'Groupe principal',
        }));

        const groupedPoints = this.groupTreemapData(treemapPoints);

        debug && console.log('Données treemap formatées:', groupedPoints);

        return {
          series: [
            {
              type: 'treemap',
              name: chartConfig.title ?? 'Données',
              data: groupedPoints,
              layoutAlgorithm: 'squarified',
            },
          ],
          shouldRedraw: true,
        };
      }
    } catch (error) {
      console.error('Erreur lors du traitement des données treemap:', error);
      return { series: [] };
    }
  }

  private groupTreemapData(points: any[]): any[] {
    const teams = [...new Set(points.map((p: any) => p.team))];
    const grouped: any[] = [];
    let id = 1;

    teams.forEach((team: any) => {
      const teamPoints = points.filter((p: any) => p.team === team);
      const teamValue = teamPoints.reduce((sum, p) => sum + p.value, 0);

      grouped.push({
        id: `team_${id}`,
        name: team,
        value: teamValue,
        color: this.getTeamColor(team),
      });

      teamPoints.forEach((point: any) => {
        grouped.push({
          name: point.name,
          parent: `team_${id}`,
          value: point.value,
          colorValue: point.colorValue,
        });
      });

      id++;
    });

    return grouped;
  }

  private getTeamColor(team: string): string {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E9',
    ];
    const hash = team.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }
}
