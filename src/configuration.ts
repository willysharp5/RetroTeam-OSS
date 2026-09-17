import { LayoutStyle } from '~/core/layout-style';
import { GoogleAuthProvider } from 'firebase/auth';

enum Themes {
  Light = 'light',
  Dark = 'dark',
}

const configuration = {
  site: {
    name: 'RetroTeam | Online Retrospective Tool',
    description:
      'Streamline Your Retrospectives: Elevate teamwork with our online retrospective tool. Using Ai effortlessly capture insights, foster collaboration, and drive continuous improvement',
    demoName: 'RetroTeam : Demo',
    demoDescription: 'RetroTeam Demo showing a retro board with capture, automatic Ai grouping, vote, and ai generated action stage.',
    themeColor: '#ffffff',
    themeColorDark: '#0a0a0a',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL as string,
    siteName: 'RetroTeam',
    twitterHandle: '',
    githubHandle: '',
    language: 'en',
    convertKitFormId: '',
    locale: process.env.DEFAULT_LOCALE,
  },
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    googleApplicationCredentials: process.env
      .GOOGLE_APPLICATION_CREDENTIALS as string,
  },
  ai: {
    apiKey: process.env.AI_API_KEY || '',
  },
  auth: {
    // Enable MFA. You must upgrade to GCP Identity Platform to use it.
    // see: https://cloud.google.com/identity-platform/docs/product-comparison
    enableMultiFactorAuth: false,
    // When enabled, users will be required to verify their email address
    // before being able to access the app
    requireEmailVerification:
      process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION === 'true',
    // NB: Enable the providers below in the Firebase Console
    // in your production project
    providers: {
      emailPassword: true,
      phoneNumber: false,
      emailLink: false,
      oAuth: [GoogleAuthProvider],
    },
  },
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
  emulatorHost: process.env.NEXT_PUBLIC_EMULATOR_HOST,
  emulator: process.env.NEXT_PUBLIC_EMULATOR === 'true',
  production: process.env.NODE_ENV === 'production',
  enableThemeSwitcher: false,
  theme: Themes.Light,
  paths: {
    signIn: '/auth/sign-in',
    demo: '/demo',
    emailLinkSignIn: '/auth/link',
    onboarding: `/onboarding`,
    appHome: '/dashboard',
    retrospectives: '/retrospectives',
    createRetrospective: '/create-retrospective',
    actions: '/actions',
    teams: '/teams',
    settings: {
      profile: '/settings/profile',
      teams: '/settings/teams',
      authentication: '/settings/profile/authentication',
      email: '/settings/profile/email',
      password: '/settings/profile/password',
    },
    admin: {
      admin: '/admin',
      users: '/admin/users',
      organizations: '/admin/organizations',
    },
    search: {
      retrospectives: '/search/retrospectives',
      actions: '/search/actions',
    },
    authLogo: process.env.NEXT_PUBLIC_AUTH_LOGO_HREF,
    searchIndex: `/public/search-index`,
  },
  navigation: {
    style: LayoutStyle.Sidebar,
  },
  appCheckSiteKey: process.env.NEXT_PUBLIC_APPCHECK_KEY,
  email: {
    // Shown as the "contact us" address and used as the default SMTP sender.
    contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  },
  // Optional. Outbound email is sent over SMTP by
  // `~/lib/server/email/send-email`, which reads SMTP_HOST, SMTP_PORT,
  // SMTP_USER, SMTP_PASSWORD, SMTP_SECURE and EMAIL_SENDER directly. Leave
  // them unset and the app runs fine — emails are logged instead of sent.
  //
  // Optional analytics. Both are off unless you set the env vars, and nothing
  // in the app depends on them.
  googleAnalytics: {
    measurementId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID,
    tagId: process.env.NEXT_PUBLIC_GOOGLE_TAG_ID,
  },
};

export default configuration;
