import AppLayout from "@/components/AppLayout";

const Synthese = () => {
  return (
    <AppLayout title="Synthèse" subtitle="Résumé des diverses catégories">
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-xl text-muted-foreground">
          Résumé des diverses catégories
        </p>
      </div>
    </AppLayout>
  );
};

export default Synthese;
