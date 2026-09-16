import Tile from '~/core/ui/Tile';
import DatePickerRange from '../shared/datepickerRange';
import { BarChart } from '@tremor/react';
import usersIcon from '/public/assets/svg/users.svg';
import schoolIcon from '/public/assets/svg/school.svg';

import Image from 'next/image';
import AdminSidebar from './AdminSidebar';
import { Fragment, useEffect, useState } from 'react';
import { useGetAdminStats } from '~/lib/admin/hooks/use-get-admin-stats';
import If from '~/core/ui/If';
import LoadingMembersSpinner from '../organizations/LoadingMembersSpinner';

interface Data {
  usersCount: number;
  organizationsCount: number;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_COLORS = MONTHS.map(() => 'lime' as const);

function AdminDashboard({
  data,
}: React.PropsWithChildren<{
  data: Data;
}>) {
  const formatDate = (date: any) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [dateRange, setDateRange] = useState({
    startDate: formatDate(new Date()),
    endDate: formatDate(new Date()),
  });
  const handleValueChange = (newValue: any) => {
    setDateRange(newValue);
  };

  const {
    customers,
    organizations,
    loading,
    totalcustomers,
    totalorganizations,
  } = useGetAdminStats(dateRange);

  const [customersData, setCustomers] = useState<any>([]);
  const [organizationsData, setOrganizations] = useState<any>([]);

  useEffect(() => {
    setCustomers(customers);
    setOrganizations(organizations);
  }, [customers, organizations]);

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (dateRange?.startDate) {
      const dateUTC = new Date(dateRange.startDate);
      const year = dateUTC.getUTCFullYear();
      setCurrentYear(year);
    } else {
      const filteredYearDate = new Date().getFullYear();
      setCurrentYear(filteredYearDate);
    }
  }, [dateRange]);

  return (
    <Fragment>
      <div className="flex flex-1 w-full">
        <AdminSidebar />
        <div className="px-6 space-y-6 w-full">
          <div className="space-y-2">
            <p className="text-[#71717A] text-sm">Filter by Date (server)</p>
            <div className="w-full flex justify-start space-x-6">
              <DatePickerRange
                value={dateRange}
                handleValueChange={handleValueChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl">Admin</h1>
            <p className="text-[#71717A] text-sm">Yearly Total Stats</p>
          </div>
          {loading ? (
            <div className="flex justify-center">
              <LoadingMembersSpinner />
            </div>
          ) : (
            <div
              data-cy={'admin-dashboard'}
              className={
                'grid  grid-cols-1 md:grid-cols-2' +
                ' space-y-6 md:space-y-0 md:gap-4'
              }
            >
              <Tile>
                <div className="flex justify-between items-center">
                  <Tile.Heading>Total Users</Tile.Heading>
                  <Image
                    className="w-4 h-4"
                    src={usersIcon}
                    alt="users"
                  ></Image>
                </div>

                <Tile.Body>
                  <div className={'flex justify-between'}>
                    <Tile.Figure>{totalcustomers}</Tile.Figure>
                  </div>
                </Tile.Body>
              </Tile>

              <Tile>
                <div className="flex justify-between items-center">
                  <Tile.Heading>All Organizations</Tile.Heading>
                  <Image
                    className="w-4 h-4"
                    src={schoolIcon}
                    alt="schoolIcon"
                  ></Image>
                </div>

                <Tile.Body>
                  <div className={'flex justify-between'}>
                    <Tile.Figure>{totalorganizations}</Tile.Figure>
                  </div>
                </Tile.Body>
              </Tile>
            </div>
          )}
        </div>
      </div>
      <p className="mt-6 md:mt-0 text-[#71717A] text-sm mx-6">
        Break down by month <br /> If the filter by year, the results are
        grouped by months
      </p>
      {!loading && (
        <div className="md:p-6 py-6 grid md:grid-cols-2 gap-2">
          <If condition={customersData.length > 0}>
            <div className="border rounded-md shadow-md p-4">
              <p className="p-4 px-6 font-semibold">
                Monthly Users {customersData.length <= 1 && currentYear}{' '}
              </p>
              {customersData.length > 1 ? (
                <BarChart
                  data={customersData}
                  index={'name'}
                  showLegend={false}
                  categories={MONTHS}
                  colors={MONTH_COLORS}
                  yAxisWidth={40}
                />
              ) : (
                <BarChart
                  data={Object.keys(customersData[0] || {})
                    .filter((key) => key !== 'name')
                    .map((month) => ({
                      name: month,
                      value: customersData[0][month],
                    }))}
                  index={'name'}
                  showLegend={false}
                  categories={['value']}
                  colors={['lime']}
                  yAxisWidth={40}
                />
              )}
            </div>
          </If>
          <If condition={organizationsData.length > 0}>
            <div className="border rounded-md shadow-md p-4">
              <p className="p-4 px-6 font-semibold">
                Monthly Organizations {customersData.length <= 1 && currentYear}
              </p>
              {organizationsData.length > 1 ? (
                <BarChart
                  data={organizationsData}
                  index={'name'}
                  showLegend={false}
                  categories={MONTHS}
                  colors={MONTH_COLORS}
                  yAxisWidth={40}
                />
              ) : (
                <BarChart
                  data={Object.keys(organizationsData[0] || {})
                    .filter((key) => key !== 'name')
                    .map((month) => ({
                      name: month,
                      value: organizationsData[0][month],
                    }))}
                  index={'name'}
                  showLegend={false}
                  categories={['value']}
                  colors={['lime']}
                  yAxisWidth={40}
                />
              )}
            </div>
          </If>
        </div>
      )}
    </Fragment>
  );
}

export default AdminDashboard;
