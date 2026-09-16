import Image from 'next/image';

import Sidebar from '~/core/ui/SideBarComponent';
import email from 'public/assets/svg/mail.svg';
import x from 'public/assets/svg/x.svg';
import useContactForm from '~/lib/contact/use-contact-form';

import toaster from 'react-hot-toast';
import { useRouter } from 'next/router';

export default function ContactSidebar({
  setShowSidebar,
  organization,
  currentUser,
}: any) {
  const { trigger: sendEmail } = useContactForm();

  const onSubmit = async (e: any) => {
    e.preventDefault();

    const form = e.target;

    const body = {
      fullName: e.target.fullName.value,
      email: e.target.email.value,
      company: e.target.company.value,
      subject: e.target.subject.value,
      message: e.target.message.value,
      organizationId: organization.id,
      organizationName: organization.name,
      internalEmail: currentUser.email ? currentUser.email : 'anonymous',
    };
    const promise = sendEmail(body)
      .then((res: any) => {
        if (res.success) {
          form.reset();
        }
      })
      .catch((e: any) => {
        console.error('ERROR onSubmit form', e);
      });

    await toaster.promise(promise, {
      loading: 'Sending contact form',
      success: 'Email has been sent!',
      error: 'Error sending form',
    });
  };
  const router = useRouter();
  const handleCloseSidebar = () => {
    setShowSidebar(false);

    if (window.location.hash === '#contactus') {
      router.replace(window.location.pathname, undefined, { shallow: true });
    }
  };

  return (
    <Sidebar>
      <div className="w-full md:w-[600px] print:w-full z-50 bg-white h-full shadow-md border-l fixed top-0 right-0 print:overflow-hidden overflow-y-auto">
        <div className="sticky bg-white top-0 z-20 p-6">
          <div className="bg-white print:hidden flex justify-end">
            <Image
              className="h-6 w-6 cursor-pointer"
              src={x}
              alt="x"
              onClick={handleCloseSidebar}
            ></Image>
          </div>
          <div
            className={`flex flex-col justify-center space-y-2 ${'text-left sticky bg-white top-0 z-20'}`}
          >
            <div className="space-y-2">
              <p className="text-orange-500 text-lg">CONTACT US</p>
              <p className="text-2xl font-black">Get in touch today!</p>
              <p className="text-md text-[#828aa5]">
                Fill out the contact form and send us a message and we will get
                back to you as soon as we possible
              </p>
            </div>
            <form
              onSubmit={onSubmit}
              className="bg-white p-5 rounded-lg border"
            >
              <div className="mb-6">
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  id="fullName"
                  name="fullName"
                  placeholder="What’s your name?"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  id="email"
                  name="email"
                  placeholder="What’s your email?"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="mb-6">
                <label
                  htmlFor="company"
                  className="block text-sm font-medium text-gray-700"
                >
                  Company
                </label>
                <input
                  required
                  type="text"
                  id="company"
                  name="company"
                  placeholder="What’s your company?"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="mb-6">
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700"
                >
                  Subject
                </label>
                <input
                  required
                  type="text"
                  id="subject"
                  name="subject"
                  placeholder="How can we help?"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="mb-6">
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700"
                >
                  Message
                </label>
                <textarea
                  required
                  id="message"
                  name="message"
                  placeholder="Hello there, I would like to talk about how to..."
                  className="mt-1 block w-full px-3 py-2  min-h-[100px] border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-400 text-white font-bold  py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  Send Message
                </button>
              </div>
            </form>
            <div className="text-center space-y-2">
              <p className="mt-6 text-xl font-black">
                Want to reach out directly?
              </p>
              <p className="mb-8 text-md text-[#828aa5]">
                Send us a message via email
              </p>
              <div className="w-fit m-auto hover:border-orange-500 border p-6 rounded-md flex justify-between">
                <div className="bg-orange-500 h-8 w-8 flex items-center rounded-full">
                  <Image
                    className="h-6 w-6 cursor-pointer m-auto"
                    src={email}
                    alt="email"
                  ></Image>
                </div>

                <div className="mx-6 text-left">
                  <p className="font-semibold">Send us an email</p>
                  <p className="text-red-500">hello@retroteam.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
