import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, Upload, FileText, Trash2, Download, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_at: string;
  category: string;
  subcategory: string | null;
}

type Category = 'assurance' | 'prevoyance_retraite' | 'impots' | 'autres';

const categories: Record<Category, { label: string; subcategories: { value: string; label: string }[] }> = {
  assurance: {
    label: "Assurance",
    subcategories: [
      { value: "assurance_maladie", label: "Assurance maladie" },
      { value: "assurance_vehicule", label: "Assurance véhicule" },
      { value: "assurance_moto", label: "Assurance moto" },
      { value: "protection_juridique", label: "Protection juridique" },
      { value: "inventaire_menage_rc", label: "Inventaire ménage & RC" },
      { value: "assurance_voyage", label: "Assurance voyage" },
      { value: "assurance_animal", label: "Assurance animal" },
    ],
  },
  prevoyance_retraite: {
    label: "Prévoyance Retraite",
    subcategories: [
      { value: "1er_pilier", label: "1er Pilier (AVS)" },
      { value: "2eme_pilier", label: "2ème Pilier (LPP)" },
      { value: "3eme_pilier", label: "3ème Pilier (3a/3b)" },
    ],
  },
  impots: {
    label: "Impôts",
    subcategories: [
      { value: "declaration", label: "Déclaration d'impôts" },
      { value: "attestation", label: "Attestations fiscales" },
      { value: "autre_impot", label: "Autre document fiscal" },
    ],
  },
  autres: {
    label: "Autres",
    subcategories: [],
  },
};

const AccountDocuments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>('assurance');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<Category>('assurance');
  const [uploadSectionOpen, setUploadSectionOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/signup");
      return;
    }

    fetchDocuments();
  }, [user, authLoading, navigate]);

  const fetchDocuments = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger vos documents",
      });
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!selectedCategory) {
      toast({
        variant: "destructive",
        title: "Catégorie requise",
        description: "Veuillez sélectionner une catégorie pour le document",
      });
      return;
    }

    // Verify file type
    if (file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Format invalide",
        description: "Seuls les fichiers PDF sont acceptés",
      });
      return;
    }

    // Verify file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Fichier trop volumineux",
        description: "La taille maximale est de 10 MB",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload to storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save to database
      const { error: dbError } = await supabase.from("documents").insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        category: selectedCategory,
        subcategory: selectedSubcategory || null,
      });

      if (dbError) throw dbError;

      toast({
        title: "Document ajouté !",
        description: "Votre document a été téléchargé avec succès",
      });

      fetchDocuments();
      setSelectedSubcategory('');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleView = async (doc: Document) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .download(doc.file_path);

    if (error || !data) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'ouvrir le document",
      });
      return;
    }

    // Forcer le type MIME en PDF pour une meilleure compatibilité d'affichage
    const pdfBlob = data.type === "application/pdf" ? data : new Blob([data], { type: "application/pdf" });
    const url = URL.createObjectURL(pdfBlob);
    setDocumentUrl(url);
    setViewingDocument(doc);
  };

  const handleDownload = async (doc: Document) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .download(doc.file_path);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de télécharger le document",
      });
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;

    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès",
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getDocumentsByCategory = (category: Category) => {
    return documents.filter(doc => doc.category === category);
  };

  const renderDocumentsList = (categoryDocs: Document[]) => {
    if (categoryDocs.length === 0) {
      return (
        <div className="bg-card rounded-lg border p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Aucun document dans cette catégorie
          </p>
        </div>
      );
    }

    const groupedBySubcategory = categoryDocs.reduce((acc, doc) => {
      const sub = doc.subcategory || 'non_classé';
      if (!acc[sub]) acc[sub] = [];
      acc[sub].push(doc);
      return acc;
    }, {} as Record<string, Document[]>);

    return (
      <div className="space-y-6">
        {Object.entries(groupedBySubcategory).map(([subcategory, docs]) => (
          <div key={subcategory}>
            {subcategory !== 'non_classé' && (
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                {categories[docs[0].category as Category]?.subcategories.find(s => s.value === subcategory)?.label || subcategory}
              </h3>
            )}
            <div className="space-y-2">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-card rounded-lg border p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                >
                  <div 
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleView(doc)}
                  >
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate hover:underline">
                        {doc.file_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(doc.file_size)} •{" "}
                        {new Date(doc.uploaded_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(doc)}
                      title="Visualiser"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      title="Télécharger"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="text-destructive hover:text-destructive"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link to="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour à l'accueil
              </Button>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Mes Documents
            </h1>
            <p className="text-muted-foreground">
              Organisez vos documents par catégorie
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Category)} className="space-y-6">
            {/* Menu déroulant pour mobile/tablette */}
            <div className="lg:hidden">
              <Select value={activeTab} onValueChange={(value) => setActiveTab(value as Category)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assurance">
                    Assurance ({getDocumentsByCategory('assurance').length})
                  </SelectItem>
                  <SelectItem value="prevoyance_retraite">
                    Prévoyance ({getDocumentsByCategory('prevoyance_retraite').length})
                  </SelectItem>
                  <SelectItem value="impots">
                    Impôts ({getDocumentsByCategory('impots').length})
                  </SelectItem>
                  <SelectItem value="autres">
                    Autres ({getDocumentsByCategory('autres').length})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Onglets pour desktop */}
            <TabsList className="hidden lg:grid w-full grid-cols-4">
              <TabsTrigger value="assurance">
                Assurance
                <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                  {getDocumentsByCategory('assurance').length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="prevoyance_retraite">
                Prévoyance
                <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                  {getDocumentsByCategory('prevoyance_retraite').length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="impots">
                Impôts
                <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                  {getDocumentsByCategory('impots').length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="autres">
                Autres
                <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                  {getDocumentsByCategory('autres').length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assurance">
              {renderDocumentsList(getDocumentsByCategory('assurance'))}
            </TabsContent>

            <TabsContent value="prevoyance_retraite">
              {renderDocumentsList(getDocumentsByCategory('prevoyance_retraite'))}
            </TabsContent>

            <TabsContent value="impots">
              {renderDocumentsList(getDocumentsByCategory('impots'))}
            </TabsContent>

            <TabsContent value="autres">
              {renderDocumentsList(getDocumentsByCategory('autres'))}
            </TabsContent>
          </Tabs>

          <Collapsible open={uploadSectionOpen} onOpenChange={setUploadSectionOpen} className="mt-6">
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Ajouter un document
                    </CardTitle>
                    <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${uploadSectionOpen ? 'rotate-180' : ''}`} />
                  </div>
                  <CardDescription>
                    Sélectionnez une catégorie et téléchargez votre document (PDF, max 10 MB)
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Catégorie</Label>
                      <Select value={selectedCategory} onValueChange={(value) => {
                        setSelectedCategory(value as Category);
                        setSelectedSubcategory('');
                      }}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(categories).map(([key, { label }]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {categories[selectedCategory]?.subcategories.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="subcategory">Sous-catégorie</Label>
                        <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                          <SelectTrigger id="subcategory">
                            <SelectValue placeholder="Sélectionner (optionnel)" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories[selectedCategory].subcategories.map((sub) => (
                              <SelectItem key={sub.value} value={sub.value}>
                                {sub.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2 sm:col-span-2 lg:col-span-1 flex items-end">
                      <Button 
                        disabled={uploading} 
                        className="w-full"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        {uploading ? "Téléchargement..." : "Choisir un fichier"}
                      </Button>
                      <input
                        id="file-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>

      <Dialog open={!!viewingDocument} onOpenChange={() => {
        if (documentUrl) {
          URL.revokeObjectURL(documentUrl);
        }
        setViewingDocument(null);
        setDocumentUrl('');
      }}>
        <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] p-0">
          <DialogHeader className="px-4 py-2">
            <DialogTitle>{viewingDocument?.file_name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full h-[calc(100vh-56px)]">
            {documentUrl && (
              <iframe
                src={documentUrl}
                className="w-full h-full rounded-none border-0"
                title={viewingDocument?.file_name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  );
};

export default AccountDocuments;
