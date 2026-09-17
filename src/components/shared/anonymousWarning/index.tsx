import plus from 'public/assets/svg/plus-circled.svg';

import Image from 'next/image';

import Link from 'next/link';
import configuration from '~/configuration';
import useFetchRules from '~/lib/server/rules/get-rules';
import { useEffect, useState } from 'react';

const AnonymousWarning = () => {
  const { data: rules } = useFetchRules('users');

  const [expiredDays, setExpiredDay] = useState(14);

  useEffect(() => {
    if (rules) {
      setExpiredDay(rules.expireAnonymousAccounts);
    }
  }, [rules]);

  return (
    <div className="bg-[#E3F3894D] p-2.5 rounded-md space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-xl font-medium">You Cannot Access these Features</p>
        <Link
          href={configuration.paths.signIn}
          className="bg-orange-500 text-white py-2 px-4 rounded-md flex space-x-2 items-center hover:bg-orange-400"
        >
          <Image src={plus} alt="plus" />
          <p className="text-sm font-medium">Sign in</p>
        </Link>
      </div>
      <div className="text-sm">
        <p className="font-medium  font-semibold">
          As an <span className="text-red-700"> Anonymous user</span>
        </p>

        <ul className="max-w-md space-y-1 text-[#71717A] list-disc list-inside ">
          <li>
            Your account and <b>data</b> will be <b>deleted</b> after{' '}
            <b>{expiredDays} days</b>
          </li>
          <li>
            <b>Sign up</b> with an <b>email</b> to keep your data
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AnonymousWarning;
