const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/** Un <svg> écrit sans xmlns (valide en HTML inline) est parsé sans namespace. */
function isSvgNamespace(ns: string | null): boolean {
  return ns === SVG_NAMESPACE || ns === null;
}

const ALLOWED_ELEMENTS = new Set([
  'svg', 'g', 'path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect', 'title',
]);

const ALLOWED_ATTRIBUTES = new Set([
  'xmlns', 'viewBox', 'width', 'height', 'preserveAspectRatio',
  'fill', 'fill-rule', 'fill-opacity', 'opacity',
  'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit',
  'stroke-dasharray', 'stroke-dashoffset', 'stroke-opacity',
  'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'points', 'transform',
  'role', 'aria-hidden',
]);

/**
 * Nettoie un markup SVG avec une liste blanche d'éléments et d'attributs
 * (les handlers on*, href, style, script, foreignObject, use, image... sont retirés).
 * Renvoie une chaîne vide si le markup n'est pas un document SVG valide.
 */
export function sanitizeSvgMarkup(markup: string | null | undefined): string {
  if (!markup || typeof DOMParser === 'undefined') return '';
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const root = doc.documentElement;
  if (!root || !isSvgNamespace(root.namespaceURI) || root.localName !== 'svg') return '';
  if (doc.getElementsByTagName('parsererror').length > 0) return '';
  sanitizeSvgElement(root);
  return new XMLSerializer().serializeToString(root);
}

function sanitizeSvgElement(el: Element): void {
  for (const attr of Array.from(el.attributes)) {
    if (!ALLOWED_ATTRIBUTES.has(attr.name)) el.removeAttributeNode(attr);
  }
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) continue;
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      isSvgNamespace((node as Element).namespaceURI) &&
      ALLOWED_ELEMENTS.has((node as Element).localName)
    ) {
      sanitizeSvgElement(node as Element);
    } else {
      el.removeChild(node);
    }
  }
}
