
import React from 'react';
import { SchoolProfile } from '../types';

interface LetterheadProps {
  profile: SchoolProfile;
  className?: string;
}

const Letterhead: React.FC<LetterheadProps> = ({ profile, className = "" }) => {
  return (
    <div className={`bg-white p-4 md:p-6 text-black border-b-[3px] border-double border-black font-serif ${className}`}>
      <div className="flex items-center gap-6">
        {/* Logo Section */}
        <div className="w-24 h-24 shrink-0 flex items-center justify-center">
          {profile.logo ? (
            <img src={profile.logo} alt="Logo Sekolah" className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="w-20 h-20 bg-slate-200 border-2 border-dashed border-slate-400 rounded-lg flex items-center justify-center text-[10px] text-slate-500 font-sans text-center px-1">
              Logo Belum Diunggah
            </div>
          )}
        </div>

        {/* Text Section */}
        <div className="flex-1 text-center">
          <h4 className="text-sm md:text-base font-bold uppercase leading-tight tracking-wide">
            {profile.agencyName || "PEMERINTAH DAERAH"}
          </h4>
          <h4 className="text-sm md:text-base font-bold uppercase leading-tight tracking-wide">
            {profile.subAgencyName || "DINAS PENDIDIKAN"}
          </h4>
          <h4 className="text-sm md:text-base font-bold uppercase leading-tight tracking-wide">
            {profile.branchAgencyName || "CABANG DINAS PENDIDIKAN"}
          </h4>
          <h2 className="text-lg md:text-2xl font-black uppercase leading-tight my-1 tracking-wider">
            {profile.name}
          </h2>
          <div className="text-[10px] md:text-xs leading-relaxed space-y-0.5 mt-2">
            {/* Alamat, Telepon, dan Fax Sejajar */}
            <p className="italic">
              {profile.address}
              {profile.address && (profile.phone || profile.fax) && <span className="mx-2">;</span>}
              {profile.phone && `Telp: ${profile.phone}`}
              {profile.phone && profile.fax && <span className="mx-2">;</span>}
              {profile.fax && `Fax: ${profile.fax}`}
            </p>
            
            {/* Email dan Website Sejajar */}
            <p>
              {profile.email && `Email: ${profile.email}`}
              {profile.email && profile.website && <span className="mx-2">;</span>}
              {profile.website && (
                <span className="font-bold">{`Website: ${profile.website}`}</span>
              )}
            </p>
          </div>
        </div>

        {/* Placeholder for symmetry (optional) */}
        <div className="w-24 hidden md:block"></div>
      </div>
    </div>
  );
};

export default Letterhead;
