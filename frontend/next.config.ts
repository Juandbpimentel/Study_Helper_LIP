import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   async rewrites() {
//     return [
//       {
//         // Toda vez que o front chamar /api-proxy/..., o Next redireciona para o Render
//         source: "/api-proxy/:path*",
//         destination: "https://study-helper-lip.onrender.com/:path*",
//       },
//     ];
//   },
// };

// export default nextConfig;