import { useState, useRef } from "react";
import { FileUp, File, Trash2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  InsuranceDocument,
  uploadInsuranceDocument,
  deleteInsuranceDocument,
  getDocumentDownloadUrl,
} from "@/lib/insuranceDocuments";

interface InsuranceDocumentUploadProps {
  contractId: string | null;
  documents: InsuranceDocument[];
  onDocumentsChange: () => void;
}

const InsuranceDocumentUpload = ({
  contractId,
  documents,
  onDocumentsChange,
}: InsuranceDocumentUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !contractId) return;

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Check file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximum est de 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(30);

    const result = await uploadInsuranceDocument(contractId, file);
    
    setUploadProgress(100);

    if (result.success) {
      toast({
        title: "Document uploadé",
        description: `${file.name} a été ajouté avec succès.`,
      });
      onDocumentsChange();
    } else {
      toast({
        title: "Erreur d'upload",
        description: result.error || "Impossible d'uploader le fichier.",
        variant: "destructive",
      });
    }

    setUploading(false);
    setUploadProgress(0);
  };

  const handleDelete = async (doc: InsuranceDocument) => {
    const result = await deleteInsuranceDocument(doc.id, doc.file_path);
    
    if (result.success) {
      toast({
        title: "Document supprimé",
        description: `${doc.file_name} a été supprimé.`,
      });
      onDocumentsChange();
    } else {
      toast({
        title: "Erreur",
        description: result.error || "Impossible de supprimer le document.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (doc: InsuranceDocument) => {
    setDownloadingId(doc.id);
    
    const url = await getDocumentDownloadUrl(doc.file_path);
    
    if (url) {
      window.open(url, '_blank');
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le document.",
        variant: "destructive",
      });
    }
    
    setDownloadingId(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!contractId) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        Sélectionnez un contrat pour gérer ses documents
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
          disabled={uploading}
        />
        <Button
          variant="outline"
          className="w-full h-24 border-dashed border-2 hover:border-primary/50"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Upload en cours...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <FileUp className="h-6 w-6" />
              <span className="text-sm">Ajouter un document</span>
              <span className="text-xs text-muted-foreground">PDF, images, documents (max 10MB)</span>
            </div>
          )}
        </Button>
        
        {uploading && uploadProgress > 0 && (
          <Progress value={uploadProgress} className="mt-2" />
        )}
      </div>

      {/* Documents list */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Documents ({documents.length})
          </h4>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-2 p-2 rounded-lg border bg-card text-sm"
            >
              <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{doc.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(doc.file_size)}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                >
                  {downloadingId === doc.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer le document</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer "{doc.file_name}" ? Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(doc)}>
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      {documents.length === 0 && !uploading && (
        <p className="text-xs text-muted-foreground text-center">
          Aucun document pour ce contrat
        </p>
      )}
    </div>
  );
};

export default InsuranceDocumentUpload;
