// fontkit não publica tipos; só usamos a medição de texto (lib/pdf/audit-report.tsx).
declare module "fontkit" {
  export interface Font {
    unitsPerEm: number;
    layout(text: string): { advanceWidth: number };
  }
  export function create(buffer: Buffer): Font;
}
