import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A fonte dos relatórios em PDF é lida do disco em tempo de execução
  // (lib/pdf/*.tsx); sem isto ela não vai para o deploy.
  outputFileTracingIncludes: {
    "/api/auditorias/**": ["./lib/pdf/fonts/*.ttf"],
    "/api/historico/**": ["./lib/pdf/fonts/*.ttf"],
    "/api/requisicoes/**": ["./lib/pdf/fonts/*.ttf"],
  },
  // O endereço antigo (checklist-kenkyo.vercel.app) leva ao domínio da empresa,
  // mantendo o caminho. Só esse host: as prévias de cada deploy (*.vercel.app
  // com outro nome) e o desenvolvimento local seguem como estão. Temporário
  // (307) para não ficar preso no navegador se o domínio mudar um dia.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "checklist-kenkyo.vercel.app" }],
        destination: "https://checklist.kenkyo.com.br/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
