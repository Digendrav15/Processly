import { useState, useEffect } from 'react';
import { getInvData, initInventorySeedData } from '../services/inventoryStorageService';

export function useInventoryStorage(storageKey, defaultValue = []) {
  const [data, setDataState] = useState(() => {
    initInventorySeedData();
    return getInvData(storageKey, defaultValue);
  });

  useEffect(() => {
    const handleUpdate = (e) => {
      if (!e.detail || e.detail.key === storageKey || e.detail.key === 'ALL') {
        setDataState(getInvData(storageKey, defaultValue));
      }
    };

    window.addEventListener('inventory_storage_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('inventory_storage_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [storageKey, defaultValue]);

  return data;
}
