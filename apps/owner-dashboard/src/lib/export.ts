// Dependency-free CSV + PNG export helpers for owner charts/tables.

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const csvCell = (v: unknown): string => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Export an array of flat objects as CSV. Column order follows the first row's
// keys unless `columns` is given.
export function downloadCsv(
  filename: string,
  rows: Record<string, unknown>[],
  columns?: string[],
) {
  if (rows.length === 0) return;
  const cols = columns ?? Object.keys(rows[0]);
  const header = cols.map(csvCell).join(',');
  const body = rows
    .map((r) => cols.map((c) => csvCell(r[c])).join(','))
    .join('\n');
  const blob = new Blob([`${header}\n${body}`], {
    type: 'text/csv;charset=utf-8',
  });
  triggerDownload(
    blob,
    filename.endsWith('.csv') ? filename : `${filename}.csv`,
  );
}

// Copy resolved computed styles (fill/stroke/font/etc.) onto a cloned SVG so
// CSS-variable colours survive rasterisation, which loses the document context.
const INLINE_PROPS = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-opacity',
  'opacity',
  'color',
  'font-size',
  'font-family',
  'font-weight',
  'text-anchor',
];

function inlineStyles(src: Element, clone: Element) {
  const cs = window.getComputedStyle(src);
  let style = '';
  for (const p of INLINE_PROPS) {
    const v = cs.getPropertyValue(p);
    if (v) style += `${p}:${v};`;
  }
  clone.setAttribute('style', style);
  const srcKids = src.children;
  const cloneKids = clone.children;
  for (let i = 0; i < srcKids.length; i++) {
    if (cloneKids[i]) inlineStyles(srcKids[i], cloneKids[i]);
  }
}

// Rasterise the first <svg> inside `node` to a PNG download.
export async function downloadNodePng(node: HTMLElement, filename: string) {
  const svg = node.querySelector('svg');
  if (!svg) return;

  const rect = svg.getBoundingClientRect();
  const width = Math.ceil(rect.width) || 800;
  const height = Math.ceil(rect.height) || 400;

  const clone = svg.cloneNode(true) as SVGElement;
  inlineStyles(svg, clone);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const serialized = new XMLSerializer().serializeToString(clone);
  const svgUrl = URL.createObjectURL(
    new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' }),
  );

  try {
    const img = new Image();
    img.width = width;
    img.height = height;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('SVG render failed'));
      img.src = svgUrl;
    });

    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    await new Promise<void>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          triggerDownload(
            blob,
            filename.endsWith('.png') ? filename : `${filename}.png`,
          );
        }
        resolve();
      }, 'image/png');
    });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
