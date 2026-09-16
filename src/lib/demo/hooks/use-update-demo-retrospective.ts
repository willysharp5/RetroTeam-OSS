import { useFirestore } from 'reactfire';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useCallback } from 'react';

import {
    DEMO_COLLECTION,
} from '~/lib/firestore-collections';

export function useUpdateBoardDemoSettings() {
    const firestore = useFirestore();

    return useCallback(
        async (
            type: string,
            value: any,
            name: string,
        ) => {
            const demoCollection = collection(
                firestore,
                DEMO_COLLECTION,
            );

            const boardRef = doc(demoCollection, 'demo');

            const boardSnapshot = await getDoc(boardRef);

            if (boardSnapshot.exists()) {

                const searchableName = name.replace(/\s+/g, '').toLowerCase();

                const updateData = {
                    lock: { locked: value, name, searchableName },
                    access: { access: { type: value }, name, searchableName },
                    name: { name, searchableName },
                    ai: { groupWithAI: value, name, searchableName },
                    'ai-actions': { actionsWithAI: value, name, searchableName },
                    selectedColumns: { selectedColumns: value },
                    allowMembersViewComments: { allowMembersViewComments: value },
                    loadingAIGrouping: { loadingAIGrouping: value },
                    authors: { authors: value },
                    votes: { votes: value }
                } as any;

                const dataToUpdate = updateData[type];
                if (dataToUpdate) {
                    await updateDoc(boardRef, dataToUpdate);
                }
            } else {
                console.log('Retrospective document does not exist.');
            }
        },
        [firestore],
    );
}