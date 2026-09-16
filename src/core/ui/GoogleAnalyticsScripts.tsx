import Script from 'next/script';

import configuration from '~/configuration';

/**
 * @name GoogleAnalyticsScripts
 * @description Optional Google Analytics. Renders nothing unless
 * NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID is set, so a self-hosted install
 * ships no third-party tracking by default.
 */
const GoogleAnalyticsScripts: React.FC = () => {
  const measurementId = configuration.googleAnalytics.measurementId;

  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />

      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');`}
      </Script>
    </>
  );
};

export default GoogleAnalyticsScripts;
