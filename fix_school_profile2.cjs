const fs = require('fs');
let content = fs.readFileSync('pages/SchoolProfile.tsx', 'utf8');

content = content.replace(
  "const [newAcademicYear, setNewAcademicYear] = useState('');",
  "const [newAcademicYear, setNewAcademicYear] = useState('');\n  const [gradData, setGradData] = useState<Record<string, GraduationInfo>>(graduationInfo);"
);

content = content.replace(
  "    setProfile(updatedProfile);\n    setIsEditMode(false);",
  "    setProfile(updatedProfile);\n    if (setGraduationInfo) setGraduationInfo(gradData);\n    setIsEditMode(false);"
);

content = content.replace(
  "                    <h5 className=\"text-base font-black text-slate-800 text-center\">{profile.principalName}</h5>\r\n                    <p className=\"text-[10px] font-mono text-slate-400 uppercase text-center\">NIP. {profile.principalNip}</p>\r\n                  </>\r\n                )}",
  "                    <h5 className=\"text-base font-black text-slate-800 text-center\">{profile.principalName}</h5>\n                    <p className=\"text-[10px] font-mono text-slate-400 uppercase text-center\">NIP. {profile.principalNip}</p>\n                    {(profile.principalRank || profile.principalGrade) && (\n                      <p className=\"text-[10px] font-bold text-slate-500 uppercase text-center mt-1\">\n                        {profile.principalRank} {profile.principalGrade ? -  : ''}\n                      </p>\n                    )}\n                  </>\n                )}"
);

content = content.replace(
  "                  </div>\r\n                ) : (\r\n                  <>\r\n                    <h5 className=\"text-base font-black text-slate-800 text-center\">{profile.principalName}</h5>",
  "                    <div className=\"space-y-1\">\n                      <label className=\"text-[9px] font-black text-slate-300 uppercase\">Pangkat Kepala Sekolah</label>\n                      <input\n                        className=\"w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold\"\n                        value={formData.principalRank || ''}\n                        onChange={e => setFormData({ ...formData, principalRank: e.target.value })}\n                        placeholder=\"Contoh: Pembina Tk. I\"\n                      />\n                    </div>\n                    <div className=\"space-y-1\">\n                      <label className=\"text-[9px] font-black text-slate-300 uppercase\">Golongan Kepala Sekolah</label>\n                      <input\n                        className=\"w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold\"\n                        value={formData.principalGrade || ''}\n                        onChange={e => setFormData({ ...formData, principalGrade: e.target.value })}\n                        placeholder=\"Contoh: IV/b\"\n                      />\n                    </div>\n                  </div>\n                ) : (\n                  <>\n                    <h5 className=\"text-base font-black text-slate-800 text-center\">{profile.principalName}</h5>"
);

// We need to add the graduation section right before the final</div> closing tag.
// The easiest way is to find <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"> and match the second one maybe? No, let's just append it before           </div>\r\n        </div>\r\n      </div>\r\n    </div>\r\n  );\r\n}

const gradBlock = 

            <div className="space-y-4 border-b border-slate-100 pb-6 mb-6 mt-8">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                <span>Data Kelulusan ({activeAcademicYear || 'Pilih Tahun Aktif'})</span>
              </h4>
            </div>

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
;

content = content.replace(
  "          </div>\r\n        </div>\r\n      </div>\r\n    </div>\r\n  );\r\n}",
  gradBlock + "\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}"
);

fs.writeFileSync('pages/SchoolProfile.tsx', content);
console.log('done');
