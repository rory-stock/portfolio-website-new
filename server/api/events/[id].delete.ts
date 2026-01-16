import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import { deleteEvent } from "~~/server/utils/mutations";

export default defineEventHandler(
  async (event): Promise<{ success: boolean }> => {
    await requireAuth(event);

    const db = useDB(event);
    const id = Number(getRouterParam(event, "id"));

    if (!id || isNaN(id)) {
      throw createError({
        statusCode: 400,
        message: "Invalid event ID",
      });
    }

    await deleteEvent(db, id);

    return { success: true };
  }
);
