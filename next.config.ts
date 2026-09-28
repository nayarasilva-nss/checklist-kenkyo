import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A fonte do PDF da auditoria é lida do disco em tempo de execução
  // (lib/pdf/audit-report.tsx); sem isto ela não vai para o deploy.
  outputFileTracingIncludes: {
    "/api/auditorias/**": ["./lib/pdf/fonts/*.ttf"],
  },
};

export default nextConfig;
