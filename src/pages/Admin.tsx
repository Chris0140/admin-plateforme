import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserCheck, Shield, Search, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  nom: string;
  prenom: string;
  canton: string;
  localite: string;
  date_naissance: string;
  created_at: string;
  phone_verified: boolean;
  roles?: string[];
}

interface Stats {
  totalUsers: number;
  newUsersThisMonth: number;
  verifiedUsers: number;
  adminUsers: number;
}

const Admin = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    newUsersThisMonth: 0,
    verifiedUsers: 0,
    adminUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all profiles with user roles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles (role)
        `)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const usersWithRoles = profilesData?.map((profile: any) => ({
        ...profile,
        roles: profile.user_roles?.map((ur: any) => ur.role) || [],
      })) || [];

      setUsers(usersWithRoles);

      // Calculate stats
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalUsers = usersWithRoles.length;
      const newUsersThisMonth = usersWithRoles.filter(
        (u) => new Date(u.created_at) >= firstDayOfMonth
      ).length;
      const verifiedUsers = usersWithRoles.filter((u) => u.phone_verified).length;
      const adminUsers = usersWithRoles.filter((u) => u.roles?.includes("admin")).length;

      setStats({
        totalUsers,
        newUsersThisMonth,
        verifiedUsers,
        adminUsers,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId: string, role: "admin" | "moderator" | "user", hasRole: boolean) => {
    try {
      if (hasRole) {
        // Remove role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);

        if (error) throw error;
        toast.success(`Rôle ${role} retiré`);
      } else {
        // Add role
        const { error } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role }]);

        if (error) throw error;
        toast.success(`Rôle ${role} ajouté`);
      }

      await fetchData();
    } catch (error) {
      console.error("Error toggling role:", error);
      toast.error("Erreur lors de la modification du rôle");
    }
  };

  const filteredUsers = users.filter((user) =>
    searchTerm
      ? user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Administration</h1>
          <p className="text-muted-foreground">
            Gestion des utilisateurs et statistiques de la plateforme
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nouveaux ce mois</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.newUsersThisMonth}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Vérifié</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.verifiedUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalUsers > 0
                  ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100)
                  : 0}
                % du total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administrateurs</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.adminUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Gestion des utilisateurs</CardTitle>
            <CardDescription>
              Liste complète des utilisateurs avec accès aux données et gestion des rôles
            </CardDescription>
            <div className="flex items-center space-x-2 mt-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, prénom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Canton</TableHead>
                    <TableHead>Date Inscription</TableHead>
                    <TableHead>Rôles</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nom}</TableCell>
                      <TableCell>{user.prenom}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {user.canton}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString("fr-CH")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {user.roles?.includes("admin") && (
                            <Badge variant="destructive">Admin</Badge>
                          )}
                          {user.roles?.includes("moderator") && (
                            <Badge variant="secondary">Moderator</Badge>
                          )}
                          {!user.roles?.length && (
                            <Badge variant="outline">User</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={user.roles?.includes("admin") ? "destructive" : "outline"}
                            onClick={() =>
                              toggleRole(user.user_id, "admin", user.roles?.includes("admin") || false)
                            }
                          >
                            {user.roles?.includes("admin") ? "Retirer Admin" : "Ajouter Admin"}
                          </Button>
                          <Button
                            size="sm"
                            variant={user.roles?.includes("moderator") ? "secondary" : "outline"}
                            onClick={() =>
                              toggleRole(
                                user.user_id,
                                "moderator",
                                user.roles?.includes("moderator") || false
                              )
                            }
                          >
                            {user.roles?.includes("moderator") ? "Retirer Mod" : "Ajouter Mod"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
