import { NextApiRequest, NextApiResponse } from 'next/types';
import finishRetrospectives from '~/lib/server/cronJobs/finish-retrospective';
import configuration from '~/configuration';

type Data = {
  data?: any;
  success: boolean;
  error?: string;
};

export default async function hanlder(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  const authHeader = req.headers['authorization'];
  const CRON_SECRET = process.env.CRON_SECRET;

  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    if (req.query.key !== configuration.firebase.apiKey) {
      res.status(401).send({ success: false, error: 'Unauthorized' });
      return;
    }
  }

  try {
    const result = await finishRetrospectives();
    if (result.success) {
      res.send({ success: true, data: result.data });
    } else {
      res.send({ success: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, error: 'Internal Server Error' });
  }
}
