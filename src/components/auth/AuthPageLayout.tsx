import Layout from '~/core/ui/Layout';

import Heading from '~/core/ui/Heading';

const AuthPageLayout: React.FCC<{
  heading: string | React.ReactNode;
}> = ({ children, heading }) => {
  return (
    <Layout>
      <div
        className={
          'flex h-screen flex-col items-center justify-center space-y-4' +
          ' md:space-y-16'
        }
      >
        <div
          className={`flex w-full max-w-sm flex-col items-center space-y-4 rounded-xl border-transparent px-2 py-1 md:border md:px-8 md:py-6 lg:px-6`}
        >
          <div>
            <Heading type={4}>{heading}</Heading>
          </div>

          {children}
        </div>
      </div>
    </Layout>
  );
};

export default AuthPageLayout;
