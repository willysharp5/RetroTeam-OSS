import { getOrganizationsCollection } from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import { ORGANIZATIONS_COLLECTION } from '~/lib/firestore-collections';
import { Tag } from '~/lib/board/types/types';

interface Params {
  id: string;
  name: string;
  organization: string;
  retrospectiveId: string;
  comments?: any[];
  status: string;
  votes: any;
  voters: any;
  aiGroup?: boolean;
  tags: Tag[]
}

/**
 * @name groupComments
 * @description Hook to group a comment
 */

export async function groupComments({
  id,
  name,
  organization,
  retrospectiveId,
  comments,
  status,
  votes,
  voters,
  aiGroup,
  tags
}: Params) {
  const firestore = getRestFirestore();
  const batch = firestore.batch();
  const groupRef = getOrganizationsCollection()
    .doc(organization)
    .collection('board')
    .doc(retrospectiveId)
    .collection('groups')
    .doc(id);

  const commentsRefs: any[] | undefined = comments?.map((comment) => {
    if (comment.group !== '') {
      const commentPath = `/${ORGANIZATIONS_COLLECTION}/${organization}/${'board'}/${retrospectiveId}/${'comments'}/${comment.id
        }`;

      return {
        ref: firestore.doc(commentPath),
        id: comment.id,
      };
    }
  }).filter(Boolean);

  try {
    batch.create(groupRef, {
      id,
      name,
      status,
      comments: commentsRefs?.reduce((map, comment) => {
        map[comment.id] = { ref: comment.ref, id: comment.id };
        return map;
      }, {}),
      order: -1,
      votes,
      created: new Date(),
      voters,
      aiGroup,
      tags: tags ?? []
    });

    commentsRefs?.forEach((comment) => {
      batch.update(comment.ref, { group: id });
    });

    await batch.commit();

    const snapshot = await groupRef.get();
    const newData = snapshot.data();

    return newData;
  } catch (error) {
    console.error('Error creating grouping:', error);
    throw error;
  }
}
