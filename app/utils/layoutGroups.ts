// import type { DrizzleD1Database } from "drizzle-orm/d1";
// import { images } from "~~/server/db/schema";
// import { desc, isNotNull } from "drizzle-orm";
// import type * as schema from "../../server/db/schema";
//
// /**
//  * Generate next available layout_group_id
//  */
// export async function getNextLayoutGroupId(
//   db: DrizzleD1Database<typeof schema>
// ) {
//   const highestGroup = await db
//     .select({ id: images.layout_group_id })
//     .from(images)
//     .where(isNotNull(images.layout_group_id))
//     .orderBy(desc(images.layout_group_id))
//     .limit(1)
//     .get();
//
//   return (highestGroup?.id ?? 0) + 1;
// }
