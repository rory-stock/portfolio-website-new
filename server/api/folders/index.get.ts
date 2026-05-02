import { asc } from "drizzle-orm";
import { useDB } from "~~/server/db/client";
import * as schema from "~~/server/db/schema";
import { requireAuth } from "~~/server/utils/requireAuth";

interface FolderWithDepth {
  id: number;
  name: string;
  slug: string;
  parent_folder_id: number | null;
  folder_type: string;
  image_count: number;
  depth: number;
}

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const db = useDB(event);
  const query = getQuery(event);
  const folderType = query.folder_type as string | undefined;

  // Get all folders
  let allFolders = await db
    .select()
    .from(schema.imageFolders)
    .orderBy(asc(schema.imageFolders.name));

  // Filter by type if specified
  if (folderType) {
    allFolders = allFolders.filter((f) => f.folderType === folderType);
  }

  // Build a tree structure with depth for display
  const result: FolderWithDepth[] = [];

  function addChildren(parentId: number | null, depth: number) {
    const children = allFolders
      .filter((f) =>
        parentId === null
          ? f.parentFolderId === null
          : f.parentFolderId === parentId
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const folder of children) {
      result.push({
        id: folder.id,
        name: folder.name,
        slug: folder.slug,
        parent_folder_id: folder.parentFolderId,
        folder_type: folder.folderType,
        image_count: folder.imageCount,
        depth,
      });

      // Recurse into children
      addChildren(folder.id, depth + 1);
    }
  }

  addChildren(null, 0);

  return { folders: result };
});
