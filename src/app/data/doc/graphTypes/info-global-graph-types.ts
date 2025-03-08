export const infoGlobalGraphTypes = {
  basic: {
    code: `<span class="blue strong">interface</span> <span class="no-green">ChartCompatibility</span> {
  <span class="no-orange strong">circular</span>: <span class="red strong">'pie'</span> | <span class="red strong">'donut'</span> | <span class="red strong">'polar'</span> | <span class="red strong">'radar'</span>;     <i>// Données proportionnelles</i>
  <span class="no-orange strong">bars</span>: <span class="red strong">'bar'</span> | <span class="red strong">'column'</span>;                            <i>// Comparaisons catégorielles</i>
  <span class="no-orange strong">lines</span>: <span class="red strong">'line'</span> | <span class="red strong">'area'</span>;                            <i>// Évolutions temporelles</i>
  <span class="no-orange strong">matrix</span>: <span class="red strong">'treemap'</span> | <span class="red strong">'heatmap'</span>;                     <i>// Données hiérarchiques/intensités</i>
  <span class="no-orange strong">ranges</span>: <span class="red strong">'rangeArea'</span> | <span class="red strong">'rangeBar'</span>;                  <i>// Plages de valeurs</i>
  <span class="no-orange strong">process</span>: <span class="red strong">'funnel'</span> | <span class="red strong">'pyramid'</span>;                     <i>// Processus séquentiels</i>
}`,
  },
};
