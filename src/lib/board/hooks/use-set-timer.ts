import { useFirestore } from 'reactfire';
import { collection, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { useCallback } from 'react';
import {
    ORGANIZATIONS_COLLECTION,
    RETROSPECTIVES_COLLECTION,
} from '~/lib/firestore-collections';

export function useSetTimer() {
    const firestore = useFirestore();

    return useCallback(
        async (
            organizationId: string,
            retrospectiveId: string,
            minute: string,
            second: string,
            play: boolean,
            pause: boolean,
            showTimerModal: boolean,
            sound: string
        ) => {
            if (organizationId && retrospectiveId) {
                const timerCollection = collection(
                    firestore,
                    ORGANIZATIONS_COLLECTION,
                    organizationId,
                    RETROSPECTIVES_COLLECTION,
                    retrospectiveId,
                    'timer'
                );

                const timerDocRef = doc(timerCollection, 'firstTimer');
                const querySnapshot = await getDoc(timerDocRef);

                if (querySnapshot.exists()) {
                    await updateDoc(timerDocRef, {
                        minute: minute,
                        second: second,
                        play: play,
                        pause: pause,
                        showTimerModal: showTimerModal,
                        sound: sound
                    });
                    return { success: true, message: 'Timer updated/created successfully' };
                } else {
                    await setDoc(timerDocRef, {
                        minute: minute,
                        second: second,
                        play: play,
                        pause: pause,
                        showTimerModal: showTimerModal,
                        sound: sound
                    });
                    return { success: true, message: 'Timer updated/created successfully' };
                }
            }
        },
        [firestore],
    );
}
