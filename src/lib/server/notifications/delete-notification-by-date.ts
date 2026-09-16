import { firestore } from 'firebase-admin';
import { getOrganizationsCollection } from '../collections';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';

interface Params {
  organizationId: string;
  email: string;
  section: string;
}

export async function deleteNotificationsByDate({
  organizationId,
  email,
  section,
}: Params) {
  try {
    let startDate;
    let endDate;

    switch (section) {
      case 'today': {
        const today = new Date();
        startDate = startOfDay(today);
        endDate = endOfDay(today);
        break;
      }
      case 'thisWeek': {
        startDate = startOfWeek(new Date());
        endDate = subDays(new Date(), 1);
        break;
      }
      case 'lastWeek': {
        startDate = startOfWeek(subWeeks(new Date(), 1));
        endDate = endOfWeek(subWeeks(new Date(), 1));
        break;
      }
      case 'lastMonth': {
        const startOfThisMonth = startOfMonth(new Date());

        startDate = startOfMonth(subMonths(startOfThisMonth, 1));
        endDate = endOfMonth(subMonths(startOfThisMonth, 1));
        break;
      }
      case 'lastYear': {
        startDate = startOfYear(subYears(new Date(), 1));
        endDate = endOfYear(subYears(new Date(), 1));
        break;
      }
      case 'currentYear': {
        startDate = startOfYear(new Date());
        endDate = endOfYear(new Date());
        break;
      }
      case 'restYears': {
        startDate = undefined;
        endDate = endOfYear(subYears(new Date(), 2));
        break;
      }
    }

    let notificationsRef = getOrganizationsCollection()
      .doc(organizationId)
      .collection('notifications')
      .where('email', '==', email);

    if (startDate) {
      notificationsRef = notificationsRef.where('created', '>=', startDate);
    }
    notificationsRef = notificationsRef.where('created', '<=', endDate);

    const querySnapshot = await notificationsRef.get();
    const batch = firestore().batch();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.category === 'invite') {
        if (data.accept) {
          batch.delete(doc.ref);
        }
      } else {
        batch.delete(doc.ref);
      }
    });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error', error);
    return {
      success: false,
      message: 'An error occurred while deleting the notifications.',
    };
  }
}
