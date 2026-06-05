const fs = require('fs');

let content = fs.readFileSync('pages/SchoolProfile.tsx', 'utf8');

// 1. Add graduationInfo, setGraduationInfo, and activeAcademicYear to SchoolProfileProps
content = content.replace(
  /  userRole\?: string;\n\}/,
  \  userRole?: string;\n  graduationInfo?: Record<string, GraduationInfo>;\n  setGraduationInfo?: React.Dispatch<React.SetStateAction<Record<string, GraduationInfo>>>;\n  activeAcademicYear?: string;\n}\
);

// 2. Add them to the component arguments
content = content.replace(
  /const SchoolProfilePage: React\.FC<SchoolProfileProps> = \(\{ profile, setProfile, notify, userRole \}\) => \{/,
  \const SchoolProfilePage: React.FC<SchoolProfileProps> = ({ profile, setProfile, notify, userRole, graduationInfo = {}, setGraduationInfo, activeAcademicYear }) => {\
);

// 3. Add gradData state
content = content.replace(
  /  const \[newAcademicYear, setNewAcademicYear\] = useState\(''\);/,
  \  const [newAcademicYear, setNewAcademicYear] = useState('');\n  const [gradData, setGradData] = useState<Record<string, GraduationInfo>>(graduationInfo);\
);

// 4. Update handleSave
content = content.replace(
  /    setProfile\(updatedProfile\);\n    setIsEditMode\(false\);/,
  \    setProfile(updatedProfile);\n    if (setGraduationInfo) setGraduationInfo(gradData);\n    setIsEditMode(false);\
);

// 5. Add Principal Rank and Grade inputs
const principalInputs = \                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-300 uppercase">Pangkat Kepala Sekolah</label>
                      <input
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold"
                        value={formData.principalRank || ''}
                        onChange={e => setFormData({ ...formData, principalRank: e.target.value })}
                        placeholder="Contoh: Pembina Tk. I"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-300 uppercase">Golongan Kepala Sekolah</label>
                      <input
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold"
                        value={formData.principalGrade || ''}
                        onChange={e => setFormData({ ...formData, principalGrade: e.target.value })}
                        placeholder="Contoh: IV/b"
                      />
                    </div>
                  </div>\;

content = content.replace(
  /                  <\/div>\n                \) : \(\n                  <>\n                    <h5 className="text-base font-black text-slate-800 text-center">\{profile\.principalName\}<\/h5>\n                    <p className="text-\[10px\] font-mono text-slate-400 uppercase text-center">NIP\. \{profile\.principalNip\}<\/p>\n                  <\/>\n                \)}/,
  principalInputs + \
                ) : (
                  <>
                    <h5 className="text-base font-black text-slate-800 text-center">{profile.principalName}</h5>
                    <p className="text-[10px] font-mono text-slate-400 uppercase text-center">NIP. {profile.principalNip}</p>
                    {(profile.principalRank || profile.principalGrade) && (
                      <p className="text-[10px] font-bold text-slate-500 uppercase text-center mt-1">
                        {profile.principalRank} {profile.principalGrade ? \\\- \\\\\\ : ''}
                      </p>
                    )}
                  </>
                )}\
);

// 6. Append Graduation form block to the end of the left column (after Daftar Tahun Pelajaran)
// Look for the end of the left column
const targetStr = \                  </div>\n                )}\n              </div>\n            </div>\n          </div>\n        </div>\n\n        {/* Right Column: Principal & Contact */}\;

const graduationBlock = \                  </div>
                )}
              </div>
            </div>

            {/* GRADUATION BLOCK INJECTED */}
            <div className="space-y-4 border-t border-slate-100 pt-8 mt-8">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                <span>Data Kelulusan ({activeAcademicYear || 'Pilih Tahun Aktif'})</span>
              </h4>

              {activeAcademicYear ? (
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Kelulusan</label>
                    {isEditMode ? (
                      <input
                        type="date"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold"
                        value={gradData[activeAcademicYear]?.tanggalKelulusan || ''}
                        onChange={e => setGradData({ ...gradData, [activeAcademicYear]: { ...(gradData[activeAcademicYear] || {}), tanggalKelulusan: e.target.value } })}
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {gradData[activeAcademicYear]?.tanggalKelulusan ? new Date(gradData[activeAcademicYear].tanggalKelulusan).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Rapat Pleno</label>
                    {isEditMode ? (
                      <input
                        type="date"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold"
                        value={gradData[activeAcademicYear]?.tanggalRapatPleno || ''}
                        onChange={e => setGradData({ ...gradData, [activeAcademicYear]: { ...(gradData[activeAcademicYear] || {}), tanggalRapatPleno: e.target.value } })}
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {gradData[activeAcademicYear]?.tanggalRapatPleno ? new Date(gradData[activeAcademicYear].tanggalRapatPleno).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Transkrip Nilai</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold"
                        value={gradData[activeAcademicYear]?.noTranskripNilai || ''}
                        onChange={e => setGradData({ ...gradData, [activeAcademicYear]: { ...(gradData[activeAcademicYear] || {}), noTranskripNilai: e.target.value } })}
                        placeholder="Contoh: 421.3/..."
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {gradData[activeAcademicYear]?.noTranskripNilai || '-'}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No SKL</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold"
                        value={gradData[activeAcademicYear]?.noSkl || ''}
                        onChange={e => setGradData({ ...gradData, [activeAcademicYear]: { ...(gradData[activeAcademicYear] || {}), noSkl: e.target.value } })}
                        placeholder="Contoh: 421.3/..."
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {gradData[activeAcademicYear]?.noSkl || '-'}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No SKKB</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold"
                        value={gradData[activeAcademicYear]?.noSkkb || ''}
                        onChange={e => setGradData({ ...gradData, [activeAcademicYear]: { ...(gradData[activeAcademicYear] || {}), noSkkb: e.target.value } })}
                        placeholder="Contoh: 421.3/..."
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {gradData[activeAcademicYear]?.noSkkb || '-'}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-400 font-medium">Tahun pelajaran aktif belum diatur.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Principal & Contact */}\;

// Must ensure Windows line endings aren't messing it up by replacing both possible newlines
const normContent = content.replace(/\\r\\n/g, '\\n');
content = normContent.replace(targetStr, graduationBlock);

// Include GraduationInfo in imports
content = content.replace(
  /import \{ SchoolProfile \} from '\.\.\/types';/,
  \import { SchoolProfile, GraduationInfo } from '../types';\
);

fs.writeFileSync('pages/SchoolProfile.tsx', content);
console.log('done');
