import { supabase } from "@/integrations/supabase/client";

export interface InsuranceDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_at: string;
  contract_id: string | null;
  category: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadInsuranceDocument(
  contractId: string,
  file: File
): Promise<{ success: boolean; error?: string; data?: InsuranceDocument }> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: "Le fichier dépasse la limite de 10MB" };
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Non authentifié" };
    }

    // Get profile to verify ownership
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return { success: false, error: "Profil non trouvé" };
    }

    // Verify contract belongs to user
    const { data: contract } = await supabase
      .from('insurance_contracts')
      .select('id, profile_id')
      .eq('id', contractId)
      .eq('profile_id', profile.id)
      .single();

    if (!contract) {
      return { success: false, error: "Contrat non trouvé ou accès refusé" };
    }

    // Sanitize filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `insurance/${profile.id}/${contractId}/${timestamp}_${sanitizedName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: "Erreur lors de l'upload du fichier" };
    }

    // Insert document record
    const { data: document, error: insertError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        contract_id: contractId,
        category: 'assurance',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      // Try to clean up the uploaded file
      await supabase.storage.from('documents').remove([filePath]);
      return { success: false, error: "Erreur lors de l'enregistrement du document" };
    }

    return { success: true, data: document as InsuranceDocument };
  } catch (error) {
    console.error('Upload insurance document error:', error);
    return { success: false, error: "Une erreur inattendue s'est produite" };
  }
}

export async function loadContractDocuments(
  contractId: string
): Promise<InsuranceDocument[]> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('contract_id', contractId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Load documents error:', error);
      return [];
    }

    return data as InsuranceDocument[];
  } catch (error) {
    console.error('Load contract documents error:', error);
    return [];
  }
}

export async function deleteInsuranceDocument(
  documentId: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete from storage first
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([filePath]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue to delete record anyway
    }

    // Delete document record
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return { success: false, error: "Erreur lors de la suppression" };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete insurance document error:', error);
    return { success: false, error: "Une erreur inattendue s'est produite" };
  }
}

export async function getDocumentDownloadUrl(
  filePath: string
): Promise<string | null> {
  try {
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    return data?.signedUrl || null;
  } catch (error) {
    console.error('Get download URL error:', error);
    return null;
  }
}
