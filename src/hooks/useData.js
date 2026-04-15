import useSWR, { useSWRConfig } from 'swr';

// Dropdown data: long cache, shared across pages, rarely changes
const DROPDOWN_OPTIONS = {
  revalidateOnFocus: false,
  dedupingInterval: 60000,
  revalidateIfStale: false,
};

// ===== Shared dropdown data hooks =====

export function useScents() {
  const { data, error, isLoading } = useSWR('/scents?all=true', DROPDOWN_OPTIONS);
  return { scents: data || [], isLoading, error };
}

export function useActiveDeviceTypes() {
  const { data, error, isLoading } = useSWR('/device-types?isActive=true&all=true', DROPDOWN_OPTIONS);
  return { deviceTypes: data || [], isLoading, error };
}

export function useAllDeviceTypes() {
  const { data, error, isLoading } = useSWR('/device-types?all=true', DROPDOWN_OPTIONS);
  return { deviceTypes: data || [], isLoading, error };
}

export function useBranches() {
  const { data, error, isLoading } = useSWR('/branches?all=true', DROPDOWN_OPTIONS);
  return { branches: data || [], isLoading, error };
}

export function useAllCustomers() {
  const { data, error, isLoading } = useSWR('/customers?all=true', DROPDOWN_OPTIONS);
  return { customers: data || [], isLoading, error };
}

export function useAllDevices() {
  const { data, error, isLoading } = useSWR('/devices?all=true', DROPDOWN_OPTIONS);
  return { devices: data || [], isLoading, error };
}

export function useTechnicians() {
  const { data, error, isLoading } = useSWR('/users?role=technician', DROPDOWN_OPTIONS);
  return { technicians: data?.data || data || [], isLoading, error };
}

// ===== Dashboard =====

export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR('/admin/stats', {
    dedupingInterval: 30000,
  });
  return {
    data: data?.success ? data.data : null,
    isLoading,
    error: error || (data && !data.success ? new Error(data.message) : null),
    refresh: mutate,
  };
}

// ===== Cache invalidation =====

export function useInvalidate() {
  const { mutate } = useSWRConfig();

  const invalidate = (prefix) => mutate(
    key => typeof key === 'string' && key.startsWith(prefix),
    undefined,
    { revalidate: true }
  );

  return {
    invalidateDevices: () => invalidate('/devices'),
    invalidateScents: () => invalidate('/scents'),
    invalidateBranches: () => invalidate('/branches'),
    invalidateCustomers: () => invalidate('/customers'),
    invalidateServiceLogs: () => invalidate('/service-logs'),
    invalidateDeviceTypes: () => invalidate('/device-types'),
    invalidateWorkOrders: () => invalidate('/work-orders'),
    invalidateDashboard: () => invalidate('/admin'),
    invalidateUsers: () => invalidate('/users'),
    invalidateAll: () => mutate(() => true, undefined, { revalidate: true }),
  };
}
