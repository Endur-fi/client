/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.minimizer.forEach((minimizer) => {
        if (minimizer.constructor.name === "TerserPlugin") {
          minimizer.options.terserOptions = {
            ...minimizer.options.terserOptions,
            mangle: {
              keep_fnames: true,
            },
            nameCache: {},
          };
        }
      });

      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: "all",
        maxSize: 244000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: "react-vendor",
            chunks: "all",
            priority: 10,
          },
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
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
        source: "/telegram",
        destination: "https://t.me/+O75VPjXyg18zN2Q1",
        permanent: true,
      },
      {
        source: "/tg",
        destination: "https://t.me/+O75VPjXyg18zN2Q1",
        permanent: true,
      },
      {
        source: "/early",
        destination: "/leaderboard",
        permanent: true,
      },
      {
        source: "/x",
        destination: "https://x.com/endurfi",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/strkfarm/:path*",
        destination: "https://app.strkfarm.com/:path*",
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
