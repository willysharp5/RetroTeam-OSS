export const dayPassed = (timestamp: {
  seconds: number;
  nanoseconds: number;
}) => {
  const timestampDate = new Date(
    timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000,
  );
  const currentDate = new Date();

  const timeDifference = currentDate.getTime() - timestampDate.getTime();

  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

  return days;
};
