import withBundleAnalyzer from '@next/bundle-analyzer';
import i18nConfig from './next-i18next.config.js';

const analyzeBundleEnabled = process.env.ANALYZE === 'true';
const isProduction = process.env.NODE_ENV === 'production';

const MS_PER_SECOND = 1000;
const SECONDS_PER_DAY = 86400;

/**
 * @type {import("next").NextConfig}
 */
const config = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  // SWC minification is the default in Next.js 14+
  // please disable if too verbose while developing. No judgment
  reactStrictMode: true,
  images: {
    remotePatterns: getConfiguredRemotePatterns(),
    unoptimized: true,
  },
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: SECONDS_PER_DAY * MS_PER_SECOND,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 100,
  },
  // Add redirects for malicious routes
  async redirects() {
    return [
      // Registration was removed: people sign in with Google, anonymously, or
      // with an existing email/password account. Old links must not 404.
      {
        source: '/auth/sign-up',
        destination: '/auth/sign-in',
        permanent: false,
      },
      // Redirect attempts to access sensitive files
      {
        source: '/.env',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/backend/.env',
        destination: '/404',
        permanent: false,
      },  
      {
        source: '/api/.env',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/env.backup',
        destination: '/404',
        permanent: false,
      },
      // Redirect attempts to detect PHP
      {
        source: '/info.php',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/phpinfo',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/_profiler/phpinfo',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/infophp.php',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/index.php',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/index.php/phpinfo',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/config/config.php',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/secured/phpinfo.php',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/app/etc/env.php',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/app_dev.php/_profiler/phpinfo',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/php.php',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/php-info.php',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/config.php',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/test.php',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/phpinfo.php',
        destination: '/404',
        permanent: false,
      },
      // Redirect attempts to access environment files
      {
        source: '/.env.dev',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/.env.prod',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/.env.local',
        destination: '/404',
        permanent: false,
      },
      // Redirect attempts to access Laravel Telescope
      {
        source: '/telescope/requests',
        destination: '/404',
        permanent: false,
      },
      // Redirect attempts to access configuration files
      {
        source: '/config.json',
        destination: '/404',
        permanent: false,
      },
      // Redirect attempts to access Git files
      {
        source: '/.git/config',
        destination: '/404',
        permanent: false,
      },
      // Redirect attempts to access system files
      {
        source: '/.DS_Store',
        destination: '/404',
        permanent: false,
      },
      // Redirect attempts to access database endpoints
      {
        source: '/_all_dbs',
        destination: '/404',
        permanent: false,
      },
      // Redirect attempts to access Jira
      {
        source: '/login.action',
        destination: '/404',
        permanent: false,
      },
      // Redirect attempts to access server status
      {
        source: '/server-status',
        destination: '/404',
        permanent: false,
      },
      {
        source: '/server',
        destination: '/404',
        permanent: false,
      },
      // Redirect attempts to access Exchange
      {
        source: '/ecp/Current/exporttool/microsoft.exchange.ediscovery.exporttool.application',
        destination: '/404',
        permanent: false,
      },
      // Redirect attempts to access Docker registry
      {
        source: '/v2/_catalog',
        destination: '/404',
        permanent: false,
      },
      // Redirect attempts to access debug endpoints
      {
        source: '/debug/default/view',
        destination: '/404',
        permanent: false,
      },
      // Redirect attempts to access VS Code config
      {
        source: '/.vscode/sftp.json',
        destination: '/404',
        permanent: false,
      },
      // Redirect attempts to access Spring Boot actuator
      {
        source: '/actuator/env',
        destination: '/404',
        permanent: false,
      },
      // Redirect attempts to access Vite
      {
        source: '/@vite/env',
        destination: '/404',
        permanent: false,
      },
      // Redirect attempts to access non-existent static files
      {
        source: '/index.html',
        destination: '/404',
        permanent: false,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }

    // we remove unnecessary Firebase packages
    // only in production due to tree shaking
    if (isProduction) {
      decorateConfigWithFirebaseExternals(config);
    }

    return config;
  },
  i18n: i18nConfig.i18n,
};

export default withBundleAnalyzer({
  enabled: analyzeBundleEnabled,
})(config);

/**
 * @description Returns remotePatterns for Next Image's component
 * Uses Firebase Storage bucket in production, localhost otherwise
 * Check: https://nextjs.org/docs/messages/next-image-unconfigured-host
 */
function getConfiguredRemotePatterns() {
  const firebaseStorageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const hostname = isProduction ? firebaseStorageBucket : 'localhost';

  if (!hostname) return [];

  return [
    {
      protocol: isProduction ? 'https' : 'http',
      hostname,
    },
  ];
}

/**
 * @description We work around a bug in Reactfire that cause the bundle to
 * be mich bigger that it needs to be.
 *
 * If you need any of the below Firebase packages, please remove it from the
 * list.
 *
 * Bug: https://github.com/FirebaseExtended/reactfire/issues/489
 * @param config
 */
function decorateConfigWithFirebaseExternals(config) {
  config.externals = [
    ...(config.externals ?? []),
    {
      'firebase/functions': 'root Math',
      'firebase/database': 'root Math',
      'firebase/performance': 'root Math',
      'firebase/remote-config': 'root Math',
    },
  ];
}
