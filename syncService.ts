// Frontend Sync Service for Cloudflare D1
// Path: syncService.ts

import { idbGet, idbSet } from './useLocalStorage';

export const TABLES_MAP: Record<string, string> = {
  'star_students': 'star_students',
  'star_teachers': 'star_teachers',
  'star_rombels': 'star_rombels',
  'star_assignments': 'star_assignments',
  'star_submissions': 'star_submissions',
  'star_questionnaireSubmissions': 'star_questionnaireSubmissions',
  'star_eqSubmissions': 'star_eqSubmissions',
  'star_aqSubmissions': 'star_aqSubmissions',
  'star_sqSubmissions': 'star_sqSubmissions',
  'star_attendanceLogs': 'star_attendanceLogs',
  'star_classReports': 'star_classReports',
  'star_sessions': 'star_sessions',
  'star_homeVisits': 'star_homeVisits',
  'star_advocacies': 'star_advocacies',
  'star_conferences': 'star_conferences',
  'star_referrals': 'star_referrals',
  'star_starData': 'star_starData',
  'star_sociometrySessions': 'star_sociometrySessions',
  'star_forumPosts': 'star_forumPosts',
  'star_quotes': 'star_quotes',
  'star_materials': 'star_materials',
  'star_schedule': 'star_schedule',
  'star_universities': 'star_universities',
  'star_studyPrograms': 'star_studyPrograms',
  'star_appointments': 'star_appointments',
  'star_methodSteps': 'star_methodSteps',
  'star_counselorProfiles': 'star_counselorProfiles',
  'star_schoolProfile': 'star_schoolProfile',
  'star_appUsers': 'star_appUsers',
  'star_alumni': 'star_alumni',
  'star_messages': 'star_messages',
  'star_privateCounseling': 'star_privateCounseling',
  'star_mengenalProdi': 'star_mengenalProdi',
  'star_devBioData': 'star_devBioData'
};

export async function pushToCloud(notify: (msg: string, type?: any) => void) {
  notify("Memulai sinkronisasi ke awan...", "info");
  let successCount = 0;
  const failures: string[] = [];

  for (const [lsKey, dbTable] of Object.entries(TABLES_MAP)) {
    try {
      let idbVal = await idbGet(lsKey);
      let localDataStr = "";
      if (idbVal !== null && idbVal !== undefined) {
        localDataStr = JSON.stringify(idbVal);
      } else {
        const lsVal = localStorage.getItem(lsKey);
        if (!lsVal) continue;
        localDataStr = lsVal;
      }

      if (!localDataStr || localDataStr === "[]" || localDataStr === "{}") continue;

      let payload = localDataStr;
      
      // Special handling for Counselor Profiles Map -> Array conversion
      if (lsKey === 'star_counselorProfiles') {
          const map = JSON.parse(localDataStr);
          const array = Object.keys(map).map(key => ({ id: key, ...map[key] }));
          payload = JSON.stringify(array);
      }

      const response = await fetch(`/api/sync?table=${dbTable}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload
      });

      if (response.ok) {
        successCount++;
      } else {
        const errorText = await response.text();
        console.error(`Failed to push ${lsKey}:`, errorText);
        failures.push(`${lsKey} (${errorText})`);
      }
    } catch (err: any) {
      console.error(`Error pushing ${lsKey}:`, err);
      failures.push(`${lsKey} (${err.message})`);
    }
  }

  if (failures.length === 0) {
    notify(`Sinkronisasi berhasil! ${successCount} tabel diperbarui di Cloud.`, "success");
  } else {
    notify(`Sinkronisasi selesai. Berhasil: ${successCount}, Gagal: ${failures.length}. Tabel gagal: ${failures.join(", ")}`, "error");
  }
}

export async function pullFromCloud(notify: (msg: string, type?: any) => void) {
  notify("Mengambil data terbaru dari awan...", "info");
  
  try { sessionStorage.setItem('sync_in_progress', 'true'); } catch (e) {}
  
  let successCount = 0;
  let failCount = 0;

  // Get current user context
  let userQuery = '';
  try {
    const userStr = localStorage.getItem('star_currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.role && user.id) {
        userQuery = `&userId=${user.id}&role=${user.role}`;
      }
    }
  } catch (e) {}

  for (const [lsKey, dbTable] of Object.entries(TABLES_MAP)) {
    try {
      const response = await fetch(`/api/sync?table=${dbTable}${userQuery}&_t=${Date.now()}`);
      if (response.ok) {
        const cloudData = await response.json();
        
        // Parse JSON strings back to objects for fields that were stringified in SQL
        const parsedData = cloudData.map((item: any) => {
            const newItem = { ...item };
            for (const key in newItem) {
                if (typeof newItem[key] === 'string' && (newItem[key].startsWith('[') || newItem[key].startsWith('{'))) {
                    try {
                        newItem[key] = JSON.parse(newItem[key]);
                    } catch (e) {
                        // Not actually JSON, keep as string
                    }
                }
                // Handle booleans (SQLite stores as 0/1)
                if (key === 'isLocked' || key === 'hasGuardian' || key === 'isKM' || key === 'isQuestionnaire') {
                    newItem[key] = !!newItem[key];
                }
            }
            return newItem;
        });

        // School Profile and other single objects might need special handling if they are returned as an array of 1
        if (lsKey === 'star_schoolProfile' || lsKey === 'star_counselorProfiles' || lsKey === 'star_devBioData') {
            if (lsKey === 'star_schoolProfile' || lsKey === 'star_devBioData') {
                const val = parsedData[0] || {};
                await idbSet(lsKey, val);
            } else {
                 const profileMap: any = {};
                 parsedData.forEach((p: any) => { profileMap[p.id] = p; });
                 await idbSet(lsKey, profileMap);
            }
        } else {
            await idbSet(lsKey, parsedData);
        }
        
        // Dispatch custom event so useLocalStorage hooks update without reload
        window.dispatchEvent(new CustomEvent('local-storage-update', { detail: { key: lsKey } }));
        
        successCount++;
      } else {
        failCount++;
      }
    } catch (err) {
      console.error(`Error pulling ${lsKey}:`, err);
      failCount++;
    }
  }

  if (failCount === 0) {
    notify(`Data berhasil disinkronkan dari Cloud!`, "success");
  } else {
    notify(`Sinkronisasi selesai dengan beberapa kendala. Berhasil: ${successCount}, Gagal: ${failCount}.`, "error");
  }
  
  setTimeout(() => {
      try { sessionStorage.removeItem('sync_in_progress'); } catch (e) {}
  }, 2000);
}

export async function syncTableToCloud(lsKey: string, data: any) {
  const dbTable = TABLES_MAP[lsKey];
  if (!dbTable) return;
  // Disable giant global auto-sync for star_forumPosts to prevent CPU timeouts.
  // star_forumPosts now uses explicit targeted syncs for individual posts.
  if (lsKey === 'star_forumPosts') return;

  let payload = JSON.stringify(data);
  
  // Special handling for Counselor Profiles Map -> Array conversion
  if (lsKey === 'star_counselorProfiles') {
      const array = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      payload = JSON.stringify(array);
  }

  try {
    const response = await fetch(`/api/sync?table=${dbTable}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload
    });
    
    if (!response.ok) {
        console.error(`Auto-sync failed for ${lsKey}:`, await response.text());
    } else {
        console.log(`Auto-sync success for ${lsKey}`);
    }
  } catch (err) {
    console.error(`Auto-sync error for ${lsKey}:`, err);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('sync-to-cloud', (e: any) => {
    const { key, value } = e.detail;
    syncTableToCloud(key, value);
  });
}

export async function deleteFromCloud(lsKey: string, id: string) {
    const dbTable = TABLES_MAP[lsKey];
    if (!dbTable) return;
    
    let userQuery = '';
    try {
        const userStr = localStorage.getItem('star_currentUser');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user && user.role && user.id) {
                userQuery = `&userId=${user.id}&role=${user.role}`;
            }
        }
    } catch (e) {}

    try {
        const response = await fetch(`/api/sync?table=${dbTable}&id=${id}${userQuery}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            console.error(`Failed to delete ${id} from ${dbTable}:`, await response.text());
        } else {
            console.log(`Successfully deleted ${id} from ${dbTable}`);
        }
    } catch (err) {
        console.error(`Error deleting ${id} from ${dbTable}:`, err);
    }
}

// Tambahan: Fungsi untuk menarik spesifik satu tabel
export async function pullTableFromCloud(lsKey: string) {
  const dbTable = TABLES_MAP[lsKey];
  if (!dbTable) return;
  
  let userParam = "";
  try {
      const u = localStorage.getItem('star_currentUser');
      if (u) {
          const parsed = JSON.parse(u);
          if (parsed && parsed.id) {
              userParam = `&userId=${parsed.id}&role=${parsed.role || ''}`;
          }
      }
  } catch (e) {}
  
  try {
    // Add custom polling param
    const response = await fetch(`/api/sync?table=${dbTable}${userParam}&_t=${Date.now()}`);
    if (response.ok) {
      const cloudData = await response.json();
      
      // Mencegah penimpaan (overwrite) data lokal jika user baru saja melakukan perubahan lokal (kurang dari 6 detik yang lalu).
      // Ini menyelesaikan masalah "komentar hilang tiba-tiba" karena tarikan data lama menimpa state lokal sebelum push selesai.
      let lastActionTime = 0;
      try {
          const actionStr = sessionStorage.getItem(`last_action_${lsKey}`);
          if (actionStr) lastActionTime = parseInt(actionStr, 10);
      } catch (e) {}

      if (Date.now() - lastActionTime < 6000) {
          console.log(`[pullTableFromCloud] Aborted saving ${lsKey} because a local action was performed recently.`);
          return; // Abort saving old data
      }

      const parsedData = cloudData.map((item: any) => {
          const newItem = { ...item };
          for (const key in newItem) {
              if (typeof newItem[key] === 'string' && (newItem[key].startsWith('[') || newItem[key].startsWith('{'))) {
                  try { newItem[key] = JSON.parse(newItem[key]); } catch (e) {}
              }
              if (key === 'isLocked' || key === 'hasGuardian' || key === 'isKM' || key === 'isQuestionnaire') {
                  newItem[key] = !!newItem[key];
              }
          }
          return newItem;
      });
      // Import idbSet dynamically or assume it's in scope since this file imports it.
      // Wait, idbSet is defined in this file!
      await idbSet(lsKey, parsedData);
      window.dispatchEvent(new CustomEvent('local-storage-update', { detail: { key: lsKey } }));
    }
  } catch (err) {
    console.error(`Error pulling table ${dbTable}:`, err);
  }
}
