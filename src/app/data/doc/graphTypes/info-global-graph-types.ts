export const infoGlobalGraphTypes = {
  basic: {
    code: `<span class="blue strong">interface</span> <span class="no-green">ChartCompatibility</span> {
  <span class="no-orange strong">circular</span>: <span class="red strong">'pie'</span> | <span class="red strong">'donut'</span>;                                     <i>// Données proportionnelles</i>
  <span class="no-orange strong">polar</span>: <span class="red strong">'polar'</span> | <span class="red strong">'radar'</span> | <span class="red strong">'radialBar'</span>;  <i>// Radial & polaire</i>
  <span class="no-orange strong">bars</span>: <span class="red strong">'bar'</span> | <span class="red strong">'column'</span>;                                        <i>// Comparaisons catégorielles</i>
  <span class="no-orange strong">lines</span>: <span class="red strong">'line'</span> | <span class="red strong">'area'</span> | <span class="red strong">'spline'</span> | <span class="red strong">'areaspline'</span>;   <i>// Évolutions temporelles</i>
  <span class="no-orange strong">scatter</span>: <span class="red strong">'scatter'</span> | <span class="red strong">'bubble'</span>;                                  <i>// Corrélations & dispersion</i>
  <span class="no-orange strong">matrix</span>: <span class="red strong">'treemap'</span> | <span class="red strong">'heatmap'</span>;                                 <i>// Données hiérarchiques/intensités</i>
  <span class="no-orange strong">ranges</span>: <span class="red strong">'columnrange'</span> | <span class="red strong">'arearange'</span> | <span class="red strong">'areasplinerange'</span>; <i>// Plages de valeurs</i>
  <span class="no-orange strong">process</span>: <span class="red strong">'funnel'</span> | <span class="red strong">'pyramid'</span>;                                 <i>// Processus séquentiels</i>
  <span class="no-orange strong">map</span>: <span class="red strong">'map'</span>;                                                       <i>// Données géographiques</i>
}`,
  },
};
