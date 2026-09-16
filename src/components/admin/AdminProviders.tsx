import { useState } from 'react';
import { SidebarContext } from '~/core/contexts/sidebar';
import FirebaseFirestoreProvider from '~/core/firebase/components/FirebaseFirestoreProvider';

function AdminProviders(
  props: React.PropsWithChildren<{
    collapsed: boolean;
  }>,
) {
  const [collapsed, setCollapsed] = useState(props.collapsed);

  return (
    <FirebaseFirestoreProvider>
      <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
        {props.children}
      </SidebarContext.Provider>
    </FirebaseFirestoreProvider>
  );
}

export default AdminProviders;
