import Link from 'next/link';
import { CreateRetrospectiveComponent } from './CreateRetrospectiveComponent';
import { TemplatesComponent } from './Templastes';

export default function CreateRetrospective() {
  return (
    <>
      <div className={'space-y-6'}>
        <div className="px-8 pt-6 tv:px-36 flex justify-between items-center">
          <h1 className="text-3xl font-semibold">Create new retrospective</h1>
          <Link
            href={'/retrospectives'}
            className="px-4 py-2 rounded-[5px] w-[150px] mt-1 bg-[#DC2626] hover:bg-red-400 text-white text-sm flex justify-center"
          >
            Cancel
          </Link>
        </div>

        <CreateRetrospectiveComponent />
        <TemplatesComponent />
      </div>
    </>
  );
}
