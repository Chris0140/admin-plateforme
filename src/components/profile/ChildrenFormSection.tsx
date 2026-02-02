import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ChildData {
  id?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
}

interface ChildrenFormSectionProps {
  profileId: string | null;
  childrenCount: number;
  onChildrenChange: (children: ChildData[]) => void;
  isEditing: boolean;
}

const ChildrenFormSection = ({
  profileId,
  childrenCount,
  onChildrenChange,
  isEditing,
}: ChildrenFormSectionProps) => {
  const [children, setChildren] = useState<ChildData[]>([]);
  const { toast } = useToast();

  // Charger les enfants existants
  useEffect(() => {
    if (profileId) {
      fetchChildren();
    }
  }, [profileId]);

  // Synchroniser le nombre d'enfants avec le tableau
  useEffect(() => {
    if (childrenCount !== children.length) {
      handleChildrenCountChange(childrenCount);
    }
  }, [childrenCount]);

  // Notifier le parent des changements
  useEffect(() => {
    onChildrenChange(children);
  }, [children]);

  const fetchChildren = async () => {
    if (!profileId) return;

    try {
      const { data: dependants, error } = await supabase
        .from("dependants")
        .select("*")
        .eq("profile_id", profileId)
        .eq("relationship", "enfant");

      if (error) throw error;

      if (dependants && dependants.length > 0) {
        setChildren(
          dependants.map((d) => ({
            id: d.id,
            first_name: d.first_name,
            last_name: d.last_name,
            date_of_birth: d.date_of_birth,
          }))
        );
      }
    } catch (error) {
      console.error("Erreur chargement enfants:", error);
    }
  };

  const handleChildrenCountChange = (count: number) => {
    const newCount = Math.max(0, Math.min(20, count));

    setChildren((prev) => {
      if (newCount > prev.length) {
        const newChildren = [...prev];
        for (let i = prev.length; i < newCount; i++) {
          newChildren.push({ first_name: "", last_name: "", date_of_birth: "" });
        }
        return newChildren;
      } else {
        return prev.slice(0, newCount);
      }
    });
  };

  const updateChild = (index: number, field: keyof ChildData, value: string) => {
    setChildren((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  if (children.length === 0) {
    return null;
  }

  if (!isEditing) {
    // Mode lecture
    return (
      <div className="space-y-4 mt-4">
        <h4 className="text-sm font-medium text-muted-foreground">Enfants</h4>
        <div className="space-y-3">
          {children.map((child, index) => (
            <div
              key={child.id || index}
              className="p-3 rounded-lg bg-muted/30 text-sm"
            >
              <p className="font-medium">
                {child.first_name} {child.last_name}
              </p>
              {child.date_of_birth && (
                <p className="text-muted-foreground">
                  Né(e) le{" "}
                  {new Date(child.date_of_birth).toLocaleDateString("fr-CH")}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Mode édition
  return (
    <div className="space-y-6 mt-6 p-4 border rounded-lg bg-muted/20">
      <h4 className="font-medium">Informations sur les enfants</h4>
      {children.map((child, index) => (
        <div
          key={child.id || index}
          className="space-y-4 p-4 border rounded-lg bg-background"
        >
          <p className="text-sm font-medium text-muted-foreground">
            Enfant {index + 1}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Prénom</Label>
              <Input
                value={child.first_name}
                onChange={(e) => updateChild(index, "first_name", e.target.value)}
                placeholder="Prénom de l'enfant"
              />
            </div>
            <div>
              <Label>Nom</Label>
              <Input
                value={child.last_name}
                onChange={(e) => updateChild(index, "last_name", e.target.value)}
                placeholder="Nom de l'enfant"
              />
            </div>
          </div>
          <div>
            <Label>Date de naissance</Label>
            <Input
              type="date"
              value={child.date_of_birth}
              onChange={(e) => updateChild(index, "date_of_birth", e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChildrenFormSection;

export type { ChildData };
