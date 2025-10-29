import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'analyste' | 'lecteur';

export function useUserRole() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setUserRole(null);
          setIsLoading(false);
          return;
        }

        // Fetch user role from the user_roles table
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole('lecteur'); // Default to reader role
        } else {
          setUserRole(data.role as UserRole);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('lecteur'); // Default to reader role
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserRole();
  }, []);

  const canEdit = userRole === 'admin' || userRole === 'analyste';
  const canViewAll = userRole === 'admin';

  return {
    userRole,
    isLoading,
    canEdit,
    canViewAll
  };
}