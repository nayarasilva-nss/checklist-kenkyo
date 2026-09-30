import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A fonte dos relatórios em PDF é lida do disco em tempo de execução
  // (lib/pdf/*.tsx); sem isto ela não vai para o deploy.
  outputFileTracingIncludes: {
    "/api/auditorias/**": ["./lib/pdf/fonts/*.ttf"],
    "/api/historico/**": ["./lib/pdf/fonts/*.ttf"],
    "/api/requisicoes/**": ["./lib/pdf/fonts/*.ttf"],
  },
};

export default nextConfig;
