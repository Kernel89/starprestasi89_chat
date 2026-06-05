import { LetterRecord, SchoolProfile } from '../types';
import { syncTableToCloud } from '../syncService';

const toRoman = (num: number): string => {
  const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return roman[num] || num.toString();
};

const getSchoolCode = (name: string): string => {
  if (!name) return 'SCHOOL';
  return name.split(' ').map(w => w.length > 2 || /\d/.test(w) ? w : '').join('').substring(0, 10).toUpperCase();
};

const getDocumentCode = (type: LetterRecord['documentType']): string => {
  switch (type) {
    case 'HomeVisit': return 'HV';
    case 'Referral': return 'RF';
    case 'SKKB': return 'SKKB';
    case 'SKL': return 'SKL';
    default: return 'DOC';
  }
};

export const generateLetterNumber = async (
  type: LetterRecord['documentType'],
  documentId: string,
  schoolProfile: SchoolProfile
): Promise<string> => {
  try {
    const res = await fetch(`/api/sync?table=star_letter_records`);
    const existingRecords: LetterRecord[] = res.ok ? await res.json() : [];
    
    const existing = existingRecords.find(r => r.documentType === type && r.documentId === documentId);
    if (existing) {
       return existing.noSurat;
    }

    const currentTypeRecords = existingRecords.filter(r => r.documentType === type);
    const nextSequence = currentTypeRecords.length + 1;
    const seqString = nextSequence.toString().padStart(3, '0');

    const now = new Date();
    const romanMonth = toRoman(now.getMonth() + 1);
    const year = now.getFullYear().toString();
    const docCode = getDocumentCode(type);
    
    let schoolCode = 'SMAN1';
    if (schoolProfile && schoolProfile.name) {
      schoolCode = getSchoolCode(schoolProfile.name);
      if (schoolCode.length < 2) schoolCode = 'SCHOOL';
    }

    const noSurat = `${seqString}/${docCode}/${schoolCode}/${romanMonth}/${year}`;

    const newRecord: LetterRecord = {
      id: `${type}_${documentId}_${Date.now()}`,
      documentType: type,
      documentId: documentId,
      noSurat: noSurat,
      updated_at: new Date().toISOString()
    };

    existingRecords.push(newRecord);
    syncTableToCloud('star_letter_records', existingRecords);

    return noSurat;
  } catch (error) {
    console.error("Error generating letter number:", error);
    return `TMP/${getDocumentCode(type)}/${Date.now()}`;
  }
};

export const generateLetterNumbersBatch = async (
  type: LetterRecord['documentType'],
  documentIds: string[],
  schoolProfile: SchoolProfile
): Promise<Record<string, string>> => {
  try {
    const res = await fetch(`/api/sync?table=star_letter_records`);
    const existingRecords: LetterRecord[] = res.ok ? await res.json() : [];
    
    const typeRecords = existingRecords.filter(r => r.documentType === type);
    
    const resultMap: Record<string, string> = {};
    const newRecords: LetterRecord[] = [];
    
    let currentMaxSeq = typeRecords.length;

    const now = new Date();
    const romanMonth = toRoman(now.getMonth() + 1);
    const year = now.getFullYear().toString();
    const docCode = getDocumentCode(type);
    
    let schoolCode = 'SMAN1';
    if (schoolProfile && schoolProfile.name) {
      schoolCode = getSchoolCode(schoolProfile.name);
      if (schoolCode.length < 2) schoolCode = 'SCHOOL';
    }

    for (const docId of documentIds) {
      const existing = typeRecords.find(r => r.documentId === docId);
      if (existing) {
        resultMap[docId] = existing.noSurat;
      } else {
        currentMaxSeq++;
        const seqString = currentMaxSeq.toString().padStart(3, '0');
        const noSurat = `${seqString}/${docCode}/${schoolCode}/${romanMonth}/${year}`;
        resultMap[docId] = noSurat;
        
        newRecords.push({
          id: `${type}_${docId}_${Date.now()}_${currentMaxSeq}`,
          documentType: type,
          documentId: docId,
          noSurat: noSurat,
          updated_at: new Date().toISOString()
        });
      }
    }

    if (newRecords.length > 0) {
      const updatedRecords = [...existingRecords, ...newRecords];
      syncTableToCloud('star_letter_records', updatedRecords);
    }

    return resultMap;
  } catch (error) {
    console.error("Error generating batch letter numbers:", error);
    const fallback: Record<string, string> = {};
    documentIds.forEach((id, i) => {
      fallback[id] = `TMP/${getDocumentCode(type)}/${Date.now()}_${i}`;
    });
    return fallback;
  }
};
