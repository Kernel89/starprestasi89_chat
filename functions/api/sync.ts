// Cloudflare Pages Function for D1 Synchronization
// Path: functions/api/sync.ts

// Define missing Cloudflare types for TypeScript compiler
interface D1Database {
  prepare(query: string): any;
  batch(queries: any[]): Promise<any>;
}
type PagesFunction<T = any> = (context: any) => Promise<Response>;
 
interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const table: string | null = url.searchParams.get("table");

  if (!table) {
    return new Response("Table name required", { status: 400 });
  }

  // Handle GET - Pull Data from Cloud
  if (request.method === "GET") {
    try {
      const userId = url.searchParams.get("userId");
      const role = url.searchParams.get("role");
      let query = `SELECT * FROM ${table}`;

      const sensitiveTables = [
          'star_submissions', 'star_questionnaireSubmissions', 'star_eqSubmissions',
          'star_aqSubmissions', 'star_sqSubmissions', 'star_attendanceLogs',
          'star_homeVisits', 'star_advocacies', 'star_conferences', 'star_referrals',
          'star_starData', 'star_privateCounseling', 'star_studentJournals',
          'star_forumPosts', 'star_messages'
      ];

      // Role-Based Access Control Filtering
      if (role === 'student' && userId) {
        if (table === 'star_students') {
          query += ` WHERE id = '${userId}'`;
        } else if (sensitiveTables.includes(table)) {
          // messages and forumPosts use userId instead of studentId
          if (table === 'star_messages') {
             // ChatPage.tsx is a global public chat room (Angkatan & Konselor QA). No strict userId filter needed.
             // We do not append any WHERE clause here, so students can see all public messages.
          } else if (table === 'star_forumPosts') {
             // For forum posts, students can see their own posts (private or public) AND everyone else's public posts
             query += ` WHERE (userId = '${userId}' OR isPrivate = 0 OR isPrivate = 'false' OR isPrivate IS NULL)`;
          } else {
             query += ` WHERE studentId = '${userId}'`;
          }
        }
      } else if (!role || role === 'null' || role === '') {
        // If not logged in, BLOCK sensitive tables entirely to prevent data leaks on the login screen
        if (sensitiveTables.includes(table)) {
          query += ` WHERE 1=0`; // Returns empty array safely
        }
      }

      const { results } = await env.DB.prepare(query).all();
      return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(err.message, { status: 500 });
    }
  }

  // Handle POST - Push/Sync Data to Cloud
  if (request.method === "POST") {
    try {
      let data: any = await request.json();
      
      if (!Array.isArray(data)) {
          // Special handling for known map/object tables
          if (table === 'star_counselorProfiles') {
              // Convert Map to Array and inject the map key as the 'id'
              data = Object.keys(data).map(key => ({
                  id: key,
                  ...data[key]
              }));
          } else if (table === 'star_schoolProfile' || table === 'star_devBioData') {
              data.id = 1; // Force ID 1 for constraint
              data = [data]; // Treat as array of 1 for unified logic
          } else {
              data = [data]; // Generic fallback: treat single object as array of 1
          }
      }

      // Special logic to prevent data loss in star_forumPosts comments and likes
      if (table === 'star_forumPosts' && data.length > 0) {
          const incomingIds = data.map((d: any) => d.id).filter(Boolean);
          const existingMap: any = {};
          
          if (incomingIds.length > 0) {
              const CHUNK_SIZE = 100;
              for (let i = 0; i < incomingIds.length; i += CHUNK_SIZE) {
                  const chunkIds = incomingIds.slice(i, i + CHUNK_SIZE);
                  const placeholders = chunkIds.map(() => '?').join(',');
                  const existingRows = await env.DB.prepare(`SELECT id, comments, likes FROM star_forumPosts WHERE id IN (${placeholders})`).bind(...chunkIds).all();
                  
                  if (existingRows && existingRows.results) {
                      for (const row of existingRows.results) {
                          existingMap[row.id] = row;
                      }
                  }
              }
              
              for (let item of data) {
                  const exist = existingMap[item.id];
                  if (exist) {
                      // Merge Comments (append new ones that don't exist yet, preserving deletions is hard without tombstones so we prioritize preventing accidental data loss)
                      if (exist.comments) {
                          try {
                              const existingComments = typeof exist.comments === 'string' ? JSON.parse(exist.comments) : exist.comments;
                              let incomingComments = item.comments;
                              if (typeof incomingComments === 'string') incomingComments = JSON.parse(incomingComments);
                              
                              if (Array.isArray(existingComments) && Array.isArray(incomingComments)) {
                                  const commentMap: any = {};
                                  for (const c of existingComments) {
                                      commentMap[c.id] = c;
                                  }
                                  for (const c of incomingComments) {
                                      // Preserve deletion flag from D1 if another client tries to undelete it due to stale state
                                      if (commentMap[c.id] && commentMap[c.id].isDeleted && !c.isDeleted) {
                                          c.isDeleted = true;
                                      }
                                      commentMap[c.id] = c;
                                  }
                                  item.comments = Object.values(commentMap).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                              }
                          } catch(e) {}
                      }
                      
                      // Merge Likes (Take max to prevent dropping likes if out of sync)
                      if (exist.likes !== undefined && item.likes !== undefined) {
                          item.likes = Math.max(Number(exist.likes) || 0, Number(item.likes) || 0);
                      }
                  }
              }
          }
      }

      // Prepare queries
      // We no longer use DELETE FROM ${table} to avoid data loss.
      // Instead, we use UPSERT (INSERT ... ON CONFLICT) with updated_at comparison.
      const queries: any[] = [];
      
      if (data.length > 0) {
          data.forEach((item: any) => {
              if (!item || typeof item !== 'object') return; // Skip invalid items
              
              const keys: string[] = Object.keys(item);
              const values: any[] = Object.values(item).map((v: any) => typeof v === 'object' ? JSON.stringify(v) : v);
              const placeholders: string = keys.map(() => "?").join(",");
              const columns: string = keys.join(",");
              
              // We use ON CONFLICT(id) DO UPDATE to implement the "Upsert" logic.
              // We also add a WHERE clause to only update if the incoming data is newer.
              let query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) `;
              
              if ('id' in item) {
                  const updates: string = keys
                      .filter((k: string) => k !== 'id')
                      .map((k: string) => `${k} = excluded.${k}`)
                      .join(", ");
                  
                  if (updates) {
                      query += `ON CONFLICT(id) DO UPDATE SET ${updates} `;
                      
                      if (keys.includes('updated_at')) {
                          // Note: In DO UPDATE SET, we refer to the existing row's columns directly.
                          query += `WHERE excluded.updated_at > updated_at OR updated_at IS NULL`;
                      }
                  } else {
                      // If only 'id' is present, we can just use INSERT OR IGNORE
                      query = `INSERT OR IGNORE INTO ${table} (${columns}) VALUES (${placeholders}) `;
                  }
              }

              queries.push(env.DB.prepare(query).bind(...values));
          });
      }

      if (queries.length > 0) {
          const CHUNK_SIZE = 50;
          for (let i = 0; i < queries.length; i += CHUNK_SIZE) {
              const chunk = queries.slice(i, i + CHUNK_SIZE);
              await env.DB.batch(chunk);
          }
      }

      return new Response(JSON.stringify({ success: true, count: data.length }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      console.error(`Sync error for ${table}:`, err);
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  // Handle DELETE - Remove Data from Cloud
  if (request.method === "DELETE") {
    try {
      const id = url.searchParams.get("id");
      const userId = url.searchParams.get("userId");
      const role = url.searchParams.get("role");
      if (!id) return new Response("ID required", { status: 400 });

      const sensitiveTables = [
          'star_submissions', 'star_questionnaireSubmissions', 'star_eqSubmissions',
          'star_aqSubmissions', 'star_sqSubmissions', 'star_attendanceLogs',
          'star_homeVisits', 'star_advocacies', 'star_conferences', 'star_referrals',
          'star_starData', 'star_privateCounseling', 'star_studentJournals',
          'star_forumPosts', 'star_messages'
      ];

      let query = `DELETE FROM ${table} WHERE id = ?`;
      const bindArgs: any[] = [id];

      // Enforce RBAC for students to prevent mass-delete bugs or unauthorized deletions
      if (role === 'student' && userId && sensitiveTables.includes(table)) {
          let idColumn = 'studentId';
          if (table === 'star_messages' || table === 'star_forumPosts') {
              idColumn = 'userId';
          }
          query += ` AND ${idColumn} = ?`;
          bindArgs.push(userId);
      }

      const result = await env.DB.prepare(query).bind(...bindArgs).run();
      
      return new Response(JSON.stringify({ success: true, changes: result.meta?.changes || 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(err.message, { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};
