import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, Upload, FileText, Trash2, Download, Eye, Search, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_at: string;
  category: string;
  subcategory: string | null;
  extracted_data?: any;
  extraction_status?: string;
  extraction_date?: string;
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
      { value: "1er_pilier_avs_ai", label: "1er pilier AVS-AI" },
      { value: "2eme_pilier_lpp", label: "2ème pilier LPP" },
      { value: "3eme_pilier_ab", label: "3ème pilier A/B" },
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
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<Category>('assurance');
  const [showAuthAlert, setShowAuthAlert] = useState(false);
  const [openSubcategories, setOpenSubcategories] = useState<Record<string, boolean>>({});
  const [verifyingDocument, setVerifyingDocument] = useState<Document | null>(null);
  const [editableData, setEditableData] = useState<any>(null);
  const [savingData, setSavingData] = useState(false);
  const [activeVerifyTab, setActiveVerifyTab] = useState<'avoir' | 'vieillesse' | 'invalidite' | 'deces'>('avoir');
  const [analyzingDocuments, setAnalyzingDocuments] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

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

  const handleAddDocumentToSubcategory = (subcategoryValue: string) => {
    if (!user) {
      setShowAuthAlert(true);
      return;
    }
    setSelectedSubcategory(subcategoryValue);
    // Trigger file input
    const fileInput = document.getElementById('file-upload-direct') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!activeTab) {
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
        category: activeTab,
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

  const handleAnalyzeCertificate = async (doc: Document) => {
    if (!user) return;

    setAnalyzingDocuments(prev => ({ ...prev, [doc.id]: true }));

    try {
      const { data, error } = await supabase.functions.invoke('parse-lpp-certificate', {
        body: { documentId: doc.id }
      });

      if (error) throw error;

      toast({
        title: "✅ Analyse terminée !",
        description: "Les données ont été extraites avec succès",
      });

      fetchDocuments();
    } catch (error: any) {
      console.error('Analyze error:', error);
      toast({
        variant: "destructive",
        title: "Erreur d'analyse",
        description: error.message || "Impossible d'analyser le document",
      });
    } finally {
      setAnalyzingDocuments(prev => ({ ...prev, [doc.id]: false }));
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    const numValue = parseFloat(value.replace(/['\s]/g, '')) || 0;
    const updates: any = { [field]: numValue };
    
    // Auto-calculs
    if (field === 'rente_mensuelle_projetee') {
      updates.rente_annuelle_projetee = numValue * 12;
    } else if (field === 'rente_annuelle_projetee') {
      updates.rente_mensuelle_projetee = numValue / 12;
    } else if (field === 'rente_invalidite_mensuelle') {
      updates.rente_invalidite_annuelle = numValue * 12;
    } else if (field === 'rente_invalidite_annuelle') {
      updates.rente_invalidite_mensuelle = numValue / 12;
    }
    
    setEditableData(prev => ({ ...prev, ...updates }));
  };

  const handleSaveLppData = async () => {
    if (!user || !verifyingDocument) return;
    
    setSavingData(true);
    
    try {
      // Préparer les données à sauvegarder
      const dataToSave = {
        user_id: user.id,
        lpp_avoir_vieillesse: editableData.avoir_vieillesse || 0,
        lpp_capital_projete_65: editableData.capital_projete_65 || 0,
        lpp_rente_mensuelle_projetee: editableData.rente_mensuelle_projetee || 0,
        lpp_rente_annuelle_projetee: editableData.rente_annuelle_projetee || 0,
        lpp_rente_invalidite_mensuelle: editableData.rente_invalidite_mensuelle || 0,
        lpp_rente_invalidite_annuelle: editableData.rente_invalidite_annuelle || 0,
        lpp_capital_invalidite: editableData.capital_invalidite || 0,
        lpp_rente_conjoint_survivant: editableData.rente_conjoint_survivant || 0,
        lpp_rente_orphelins: editableData.rente_orphelins || 0,
        lpp_capital_deces: editableData.capital_deces || 0,
        lpp_derniere_maj: editableData.date_certificat || new Date().toISOString().split('T')[0],
      };
      
      // Upsert dans prevoyance_data
      const { error } = await supabase
        .from('prevoyance_data')
        .upsert(dataToSave);
      
      if (error) throw error;
      
      toast({
        title: "✅ Données sauvegardées !",
        description: "Les données LPP ont été enregistrées dans votre profil",
      });
      
      setVerifyingDocument(null);
      setEditableData(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur de sauvegarde",
        description: error.message,
      });
    } finally {
      setSavingData(false);
    }
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
              {docs.map((doc) => {
                const isLppCertificate = doc.subcategory === '2eme_pilier_lpp';
                const isAnalyzing = analyzingDocuments[doc.id];
                const hasExtractedData = doc.extraction_status === 'completed' && doc.extracted_data;

                return (
                  <div
                    key={doc.id}
                    className="bg-card rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
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
                        {isLppCertificate && !hasExtractedData && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAnalyzeCertificate(doc)}
                            disabled={isAnalyzing}
                            title="Analyser le certificat"
                          >
                            {isAnalyzing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                          </Button>
                        )}
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

                    {/* Extraction status and data display for LPP certificates */}
                    {isLppCertificate && (
                      <div className="mt-3 pt-3 border-t">
                        {doc.extraction_status === 'pending' && (
                          <p className="text-sm text-muted-foreground">
                            ⚙️ Pas encore analysé
                          </p>
                        )}
                        {doc.extraction_status === 'processing' && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analyse en cours...
                          </p>
                        )}
                        {doc.extraction_status === 'failed' && (
                          <p className="text-sm text-destructive">
                            ⚠️ Échec de l'extraction - Réessayez ou complétez manuellement
                          </p>
                        )}
                        {hasExtractedData && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <p className="text-sm font-medium text-green-600">
                                Données extraites le {new Date(doc.extraction_date!).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                            <div className="bg-muted/50 rounded-md p-3 space-y-1 text-sm">
                              <p className="font-semibold text-foreground mb-2">📊 Données détectées:</p>
                              {doc.extracted_data.avoir_vieillesse && (
                                <p className="text-muted-foreground">
                                  • Avoir vieillesse: CHF {doc.extracted_data.avoir_vieillesse?.toLocaleString('fr-CH')}
                                </p>
                              )}
                              {doc.extracted_data.rente_mensuelle_projetee && (
                                <p className="text-muted-foreground">
                                  • Rente projetée: CHF {doc.extracted_data.rente_mensuelle_projetee?.toLocaleString('fr-CH')}/mois
                                </p>
                              )}
                              {doc.extracted_data.capital_invalidite && (
                                <p className="text-muted-foreground">
                                  • Capital invalidité: CHF {doc.extracted_data.capital_invalidite?.toLocaleString('fr-CH')}
                                </p>
                              )}
                              {Object.keys(doc.extracted_data).filter(k => doc.extracted_data[k] !== null).length > 3 && (
                                <p className="text-muted-foreground">
                                  ... et {Object.keys(doc.extracted_data).filter(k => doc.extracted_data[k] !== null).length - 3} autres valeurs
                                </p>
                              )}
                            </div>
                            <Button
                              variant="default"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                setVerifyingDocument(doc);
                                setEditableData({ ...doc.extracted_data });
                                setActiveVerifyTab('avoir');
                              }}
                            >
                              🔍 Vérifier les données
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (authLoading) {
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

            <TabsContent value="prevoyance_retraite" className="space-y-4">
              <div className="space-y-4">
                {categories.prevoyance_retraite.subcategories.map((subcategory) => {
                  const subcategoryDocs = documents.filter(
                    doc => doc.category === 'prevoyance_retraite' && doc.subcategory === subcategory.value
                  );
                  const isOpen = openSubcategories[subcategory.value] || false;

                  return (
                    <Card key={subcategory.value}>
                      <Collapsible 
                        open={isOpen}
                        onOpenChange={(open) => setOpenSubcategories(prev => ({ ...prev, [subcategory.value]: open }))}
                      >
                        <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <ChevronDown 
                                  className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                                />
                                <div className="text-left">
                                  <CardTitle className="text-lg">{subcategory.label}</CardTitle>
                                  <CardDescription>
                                    {subcategoryDocs.length} document{subcategoryDocs.length !== 1 ? 's' : ''}
                                  </CardDescription>
                                </div>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                        </CardHeader>
                        <CollapsibleContent>
                          <CardContent>
                            {subcategoryDocs.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-8 px-4">
                                <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                                <p className="text-muted-foreground mb-4 text-center">
                                  Aucun document dans cette catégorie
                                </p>
                                <Button
                                  onClick={() => handleAddDocumentToSubcategory(subcategory.value)}
                                  variant="default"
                                  className="gap-2"
                                >
                                  <Upload className="h-4 w-4" />
                                  Ajouter un document
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {subcategoryDocs.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                                  >
                                    <div 
                                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                                      onClick={() => handleView(doc)}
                                    >
                                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium truncate hover:underline">{doc.file_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')} • {formatFileSize(doc.file_size)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
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
                            )}
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="impots">
              {renderDocumentsList(getDocumentsByCategory('impots'))}
            </TabsContent>

            <TabsContent value="autres">
              {renderDocumentsList(getDocumentsByCategory('autres'))}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hidden file input for direct upload */}
      <input
        id="file-upload-direct"
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

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

      <Dialog open={!!verifyingDocument} onOpenChange={() => {
        setVerifyingDocument(null);
        setEditableData(null);
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vérifier et modifier les données LPP</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Certificat: {verifyingDocument?.file_name}
            </p>
          </DialogHeader>
          
          <Tabs value={activeVerifyTab} onValueChange={(v) => setActiveVerifyTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="avoir">Avoir actuel</TabsTrigger>
              <TabsTrigger value="vieillesse">Vieillesse</TabsTrigger>
              <TabsTrigger value="invalidite">Invalidité</TabsTrigger>
              <TabsTrigger value="deces">Décès</TabsTrigger>
            </TabsList>
            
            <TabsContent value="avoir" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="avoir_vieillesse">Avoir de vieillesse (CHF)</Label>
                  <Input
                    id="avoir_vieillesse"
                    type="text"
                    value={editableData?.avoir_vieillesse?.toLocaleString('fr-CH') || ''}
                    onChange={(e) => handleFieldChange('avoir_vieillesse', e.target.value)}
                    placeholder="125'000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_certificat">Date du certificat</Label>
                  <Input
                    id="date_certificat"
                    type="date"
                    value={editableData?.date_certificat || ''}
                    onChange={(e) => setEditableData(prev => ({ ...prev, date_certificat: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="vieillesse" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="capital_projete_65">Capital projeté à 65 ans (CHF)</Label>
                  <Input
                    id="capital_projete_65"
                    type="text"
                    value={editableData?.capital_projete_65?.toLocaleString('fr-CH') || ''}
                    onChange={(e) => handleFieldChange('capital_projete_65', e.target.value)}
                    placeholder="450'000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rente_mensuelle_projetee">Rente mensuelle (CHF/mois)</Label>
                    <Input
                      id="rente_mensuelle_projetee"
                      type="text"
                      value={editableData?.rente_mensuelle_projetee?.toLocaleString('fr-CH') || ''}
                      onChange={(e) => handleFieldChange('rente_mensuelle_projetee', e.target.value)}
                      placeholder="2'500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rente_annuelle_projetee">Rente annuelle (CHF/an)</Label>
                    <Input
                      id="rente_annuelle_projetee"
                      type="text"
                      value={editableData?.rente_annuelle_projetee?.toLocaleString('fr-CH') || ''}
                      onChange={(e) => handleFieldChange('rente_annuelle_projetee', e.target.value)}
                      placeholder="30'000"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Les montants mensuels et annuels sont automatiquement synchronisés
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="invalidite" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rente_invalidite_mensuelle">Rente mensuelle (CHF/mois)</Label>
                    <Input
                      id="rente_invalidite_mensuelle"
                      type="text"
                      value={editableData?.rente_invalidite_mensuelle?.toLocaleString('fr-CH') || ''}
                      onChange={(e) => handleFieldChange('rente_invalidite_mensuelle', e.target.value)}
                      placeholder="3'200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rente_invalidite_annuelle">Rente annuelle (CHF/an)</Label>
                    <Input
                      id="rente_invalidite_annuelle"
                      type="text"
                      value={editableData?.rente_invalidite_annuelle?.toLocaleString('fr-CH') || ''}
                      onChange={(e) => handleFieldChange('rente_invalidite_annuelle', e.target.value)}
                      placeholder="38'400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capital_invalidite">Capital invalidité (CHF)</Label>
                  <Input
                    id="capital_invalidite"
                    type="text"
                    value={editableData?.capital_invalidite?.toLocaleString('fr-CH') || ''}
                    onChange={(e) => handleFieldChange('capital_invalidite', e.target.value)}
                    placeholder="180'000"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Les montants mensuels et annuels sont automatiquement synchronisés
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="deces" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rente_conjoint_survivant">Rente conjoint survivant (CHF/mois)</Label>
                  <Input
                    id="rente_conjoint_survivant"
                    type="text"
                    value={editableData?.rente_conjoint_survivant?.toLocaleString('fr-CH') || ''}
                    onChange={(e) => handleFieldChange('rente_conjoint_survivant', e.target.value)}
                    placeholder="2'000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rente_orphelins">Rente orphelins (CHF/mois)</Label>
                  <Input
                    id="rente_orphelins"
                    type="text"
                    value={editableData?.rente_orphelins?.toLocaleString('fr-CH') || ''}
                    onChange={(e) => handleFieldChange('rente_orphelins', e.target.value)}
                    placeholder="800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capital_deces">Capital décès (CHF)</Label>
                  <Input
                    id="capital_deces"
                    type="text"
                    value={editableData?.capital_deces?.toLocaleString('fr-CH') || ''}
                    onChange={(e) => handleFieldChange('capital_deces', e.target.value)}
                    placeholder="180'000"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setVerifyingDocument(null);
                setEditableData(null);
              }}
              disabled={savingData}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSaveLppData}
              disabled={savingData}
            >
              {savingData ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                '💾 Sauvegarder dans mon profil'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showAuthAlert} onOpenChange={setShowAuthAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Créer un compte</AlertDialogTitle>
            <AlertDialogDescription>
              Pour ajouter des documents, vous devez d'abord créer un compte. Cela ne prend que quelques instants !
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => navigate("/auth")}>
              Créer un compte
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </>
  );
};

export default AccountDocuments;
