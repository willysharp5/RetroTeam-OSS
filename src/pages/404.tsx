import Head from 'next/head';
import { Trans } from 'next-i18next';

import configuration from '~/configuration';

import Button from '~/core/ui/Button';
import Heading from '~/core/ui/Heading';

import { withTranslationProps } from '~/lib/props/with-translation-props';

import RouteShell from '~/components/RouteShell';

const NotFoundPage = () => {
  return (
    <>
      <RouteShell title="404">
        <Head>
          <title key="title">{`Page not found - ${configuration.site.name}`}</title>
        </Head>

        <div
          className={
            'm-auto flex min-h-[50vh] w-full items-center justify-center'
          }
        >
          <div className={'flex flex-col space-y-8'}>
            <div className={'flex flex-col md:flex-row text-center justify-center space-x-8 divide-x divide-gray-100'}>
              <div>
                <Heading type={1}>
                  <span
                    data-cy={'catch-route-status-code'}
                    className={'text-primary-500'}
                  >
                    404
                  </span>
                </Heading>
              </div>

              <div className={'flex flex-col space-y-4 pl-8'}>
                <div className={'flex flex-col space-y-2'}>
                  <div>
                    <Heading type={1}>
                      <Trans i18nKey={'common:pageNotFound'} />
                    </Heading>
                  </div>

                  <p className={'text-gray-500 dark:text-gray-300'}>
                    <Trans i18nKey={'common:pageNotFoundSubHeading'} />
                  </p>
                </div>

                <div className={'flex space-x-4'}>
                  <Button color={'secondary'} href={process.env.NEXT_PUBLIC_404_CONTACT_BUTTON_HREF}>
                    <Trans i18nKey={'common:contactUs'} />
                  </Button>

                  <Button href={process.env.NEXT_PUBLIC_404_HOME_BUTTON_HREF}>
                    <Trans i18nKey={'common:backToHomePage'} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RouteShell>
    </>
  );
};

export async function getStaticProps() {
  const { props } = await withTranslationProps();

  return {
    props,
  };
}

export default NotFoundPage;
