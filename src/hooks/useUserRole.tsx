import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = "admin" | "moderator" | "user";

interface UseUserRoleReturn {
  roles: UserRole[];
  isAdmin: boolean;
  isModerator: boolean;
  loading: boolean;
}

export const useUserRole = (): UseUserRoleReturn => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching user roles:", error);
          setRoles([]);
        } else {
          setRoles(data?.map((r) => r.role as UserRole) || []);
        }
      } catch (error) {
        console.error("Error fetching user roles:", error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user]);

  return {
    roles,
    isAdmin: roles.includes("admin"),
    isModerator: roles.includes("moderator"),
    loading,
  };
};
