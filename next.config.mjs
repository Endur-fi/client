/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false, // Disable SWC minification to use Terser instead
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "lucide-react",
      "framer-motion",
    ],
    webpackBuildWorker: true,
  },
  output: "standalone",
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Simplified chunk splitting to prevent conflicts
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: 10,
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: "react-vendor",
            chunks: "all",
            priority: 20,
          },
        },
      };

      // Add chunk filename template to prevent naming conflicts
      config.output.chunkFilename = "[name].[chunkhash].js";

      // Configure Terser to prevent variable name conflicts
      config.optimization.minimizer.forEach((minimizer) => {
        if (minimizer.constructor.name === "TerserPlugin") {
          minimizer.options.terserOptions = {
            ...minimizer.options.terserOptions,
            mangle: {
              keep_fnames: true,
              reserved: [
                "e",
                "t",
                "n",
                "r",
                "o",
                "i",
                "a",
                "s",
                "u",
                "c",
                "l",
                "f",
                "p",
                "d",
                "h",
                "v",
                "m",
                "g",
                "y",
                "b",
                "w",
                "k",
                "x",
                "z",
                "j",
                "q",
              ],
            },
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          };
        }
      });
    }
    return config;
  },
  compiler:
    process.env.NODE_ENV === "development"
      ? {}
      : {
          removeConsole: {
            exclude: ["error"],
          },
        },
  async redirects() {
    return [
      {
        source: "/devcon",
        destination: "https://bit.ly/4flfFVg",
        permanent: true,
      },
      {
        source: "/audit",
        destination:
          "https://drive.google.com/file/d/1EufZmcW9k5yq5Jivek1MjTCVnft5WRER/view?usp=sharing",
        permanent: true,
      },
      {
        source: "/early",
        destination: "/leaderboard",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
