import { useEffect, useState } from 'react';
import { useFirestore, useFirestoreCollectionData } from 'reactfire';
import { collection, query, where } from 'firebase/firestore';
import { Rules } from '~/lib/rules/types';
import { DEFAULT_RULES } from '~/lib/rules/defaults';

function useFetchRules(section: string) {
  const firestore = useFirestore();
  const rulesCollectionPath = 'rules';

  // Firestore where() does not accept undefined; use sentinel so query never matches when section is missing
  const sectionValue =
    section != null && section !== '' ? section : '__no_section__';

  const rulesQuery = query(
    collection(firestore, rulesCollectionPath),
    where('section', '==', sectionValue),
  );

  const { data, status: rulesStatus } = useFirestoreCollectionData(rulesQuery);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    if (rulesStatus === 'loading') {
      setLoading(true);
    } else if (rulesStatus === 'error') {
      setError('Error fetching documents');
      setLoading(false);
    } else if (rulesStatus === 'success') {
      setLoading(false);
    }
  }, [rulesStatus]);

  // The `rules` collection is optional: a fresh self-hosted install has no
  // documents in it. Merge whatever Firestore returns on top of the permissive
  // defaults so every rule always resolves to a usable value.
  const rules: Rules = {
    ...DEFAULT_RULES,
    section: sectionValue,
    ...((data?.[0] as Partial<Rules>) ?? {}),
  };

  return { loading, data: rules, error };
}

export default useFetchRules;
