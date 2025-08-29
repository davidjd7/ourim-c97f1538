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

        // For now, simulate role based on email since tables aren't ready
        const email = user.email;
        let role: UserRole = 'lecteur';
        
        if (email === 'd.dahan@h-dr.fr') {
          role = 'admin';
        } else if (email === 'a.dahan@h-dr.fr') {
          role = 'analyste';
        } else {
          role = 'lecteur';
        }

        setUserRole(role);
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