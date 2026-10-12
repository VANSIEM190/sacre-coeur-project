import type {
  ArchiveDocument,
  ArchiveDocumentInput,
  ArchiveDocumentUpdateInput,
} from "@sacre-coeur/domain/types";
import { requireText, requireUuid } from "@sacre-coeur/domain/validation";
import { DomainError } from "@sacre-coeur/domain/errors";
import { supabase } from "../../supabase/supabaseClient";
import { nanoid } from "nanoid";

const BUCKET = "sacre-coeur-files-archives";

function archiveFields(values: ArchiveDocumentUpdateInput) {
  if (!Number.isInteger(values.year))
    throw new DomainError("L'année de l'archive doit être un entier.");
  return {
    title: requireText(values.title, "Titre"),
    year: values.year,
    category: values.category,
    description: values.description.trim(),
  };
}

async function uploadArchive(file: File): Promise<string> {
  if (!file.size) throw new DomainError("Le fichier est vide.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  const path =
    "archives/" +
    nanoid() +
    (extension ? "." + extension.replace(/[^a-z0-9]/g, "") : "");
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "1800", upsert: false });
  if (error) throw error;
  return data.path;
}

async function cleanStorage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error)
    console.error(
      "[ArchiveService] Fichier orphelin à nettoyer :",
      path,
      error,
    );
}

class ArchiveService {
  async getArchives(): Promise<ArchiveDocument[]> {
    const { data, error } = await supabase
      .from("archives")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async createArchive(values: ArchiveDocumentInput): Promise<string> {
    const fields = archiveFields(values);
    const path = await uploadArchive(values.file);
    try {
      const { data, error } = await supabase
        .from("archives")
        .insert({ ...fields, file: path })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    } catch (error) {
      await cleanStorage(path);
      throw error;
    }
  }

  async updateArchive(
    id: string,
    values: ArchiveDocumentUpdateInput,
  ): Promise<void> {
    requireUuid(id, "Identifiant de l'archive");
    const fields = archiveFields(values);
    const { data: existing, error: fetchError } = await supabase
      .from("archives")
      .select("file")
      .eq("id", id)
      .single();
    if (fetchError) throw fetchError;
    const path = values.file ? await uploadArchive(values.file) : null;
    const { error } = await supabase
      .from("archives")
      .update({ ...fields, ...(path ? { file: path } : {}) })
      .eq("id", id);
    if (error) {
      if (path) await cleanStorage(path);
      throw error;
    }
    if (path && existing.file) await cleanStorage(existing.file);
  }

  async deleteArchive(payload: {
    archiveId: string;
    filePath: string;
  }): Promise<void> {
    requireUuid(payload.archiveId, "Identifiant de l'archive");
    // Le chemin provient de la ligne en base, pas du champ modifiable fourni par l'interface.
    const { data: existing, error: fetchError } = await supabase
      .from("archives")
      .select("file")
      .eq("id", payload.archiveId)
      .single();
    if (fetchError) throw fetchError;
    const { error } = await supabase
      .from("archives")
      .delete()
      .eq("id", payload.archiveId);
    if (error) throw error;
    // Suppression DB d'abord : un échec de stockage laisse un fichier orphelin plutôt qu'une référence cassée.
    if (existing.file) await cleanStorage(existing.file);
  }
}

export const adminArchivesServices = new ArchiveService();
