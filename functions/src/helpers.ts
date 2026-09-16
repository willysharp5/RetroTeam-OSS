import * as admin from 'firebase-admin';
export const formatTimestamp = (timestamp: any) => {
    return timestamp && timestamp.toMillis ? timestamp.toMillis() : 0;
};

export const formatDate = (date: any) => {
    if (date instanceof admin.firestore.Timestamp) {
        const dateV = date as any
        if (date.seconds && date.nanoseconds) {
            return new Date(date.seconds * 1000 + date.nanoseconds / 1000000).getTime();
        } else {
            return new Date(dateV._seconds * 1000 + dateV._nanoseconds / 1000000).getTime();
        }

    } else if (typeof date === 'string') {
        return date !== '' ? new Date(date).getTime() : 0;
    }
    return 0;
};

