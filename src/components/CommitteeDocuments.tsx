import React, { useState } from 'react';
import { CommitteeMember, ClubDocument } from '../types';
import {
  Users,
  FileText,
  Phone,
  Mail,
  Download,
  ShieldCheck,
  MapPin,
  Building,
  Eye,
  X,
  Target,
  Sparkles,
  FolderSync,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  OFFICIAL_VISION_MISSION,
  saveVisionMissionToGoogleDrive,
  saveExactCharterCSVToGoogleDrive,
  generateExactCharterCSVContent,
  GOOGLE_DRIVE_FOLDER_URL,
} from '../services/googleDriveService';
import { googleSignIn, getAccessToken } from '../services/googleAuth';

interface CommitteeDocumentsProps {
  committee: CommitteeMember[];
  documents: ClubDocument[];
  lang: 'en' | 'si';
}

export const CommitteeDocuments: React.FC<CommitteeDocumentsProps> = ({
  committee,
  documents,
  lang,
}) => {
  const [activeDoc, setActiveDoc] = useState<ClubDocument | null>(null);
  const [isSavingVision, setIsSavingVision] = useState(false);
  const [visionSaveMsg, setVisionSaveMsg] = useState<{ type: 'success' | 'error'; text: string; link?: string } | null>(null);

  const handleSaveVisionToDrive = async () => {
    try {
      setIsSavingVision(true);
      setVisionSaveMsg(null);

      let token = await getAccessToken();
      if (!token) {
        const signin = await googleSignIn();
        token = signin?.accessToken || null;
      }

      if (!token) {
        throw new Error('Google authorization is required to save to Drive.');
      }

      const res = await saveVisionMissionToGoogleDrive(token);
      setVisionSaveMsg({
        type: 'success',
        text: lang === 'si'
          ? 'දැක්ම සහ මෙහෙවර ලේඛනය ඔබගේ Google Drive ෆෝල්ඩරයේ සාර්ථකව සුරකින ලදී!'
          : 'Official Vision & Mission successfully saved into the linked Google Drive folder!',
        link: res.webViewLink || GOOGLE_DRIVE_FOLDER_URL,
      });
    } catch (err: any) {
      setVisionSaveMsg({
        type: 'error',
        text: err?.message || 'Failed to upload document to Google Drive',
      });
    } finally {
      setIsSavingVision(false);
    }
  };

  const handleSaveCSVToDrive = async () => {
    try {
      setIsSavingVision(true);
      setVisionSaveMsg(null);

      let token = await getAccessToken();
      if (!token) {
        const signin = await googleSignIn();
        token = signin?.accessToken || null;
      }

      if (!token) {
        throw new Error('Google authorization is required to save to Drive.');
      }

      const res = await saveExactCharterCSVToGoogleDrive(token);
      setVisionSaveMsg({
        type: 'success',
        text: lang === 'si'
          ? 'නිල Excel/CSV ප්‍රඥප්ති ලේඛනය (Young_Star_Sport_Club_Gamudawa.csv) ඔබගේ Google Drive ෆෝල්ඩරයේ සුරකින ලදී!'
          : 'Official Excel/CSV Charter file (Young_Star_Sport_Club_Gamudawa.csv) saved to Google Drive!',
        link: res.webViewLink || GOOGLE_DRIVE_FOLDER_URL,
      });
    } catch (err: any) {
      setVisionSaveMsg({
        type: 'error',
        text: err?.message || 'Failed to upload CSV to Google Drive',
      });
    } finally {
      setIsSavingVision(false);
    }
  };

  const handleDownloadCharterCSV = () => {
    const csvContent = generateExactCharterCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', 'Young_Star_Sport_Club_Gamudawa.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Official Vision & Mission Card (Directly from User Attachment) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>{lang === 'si' ? 'නිල ක්‍රීඩා සමාජ ප්‍රඥප්තිය' : 'Official Club Charter'}</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                {lang === 'si' ? OFFICIAL_VISION_MISSION.clubNameSi : OFFICIAL_VISION_MISSION.clubNameEn}
              </h2>
              <p className="text-xs text-amber-100 font-medium mt-0.5">
                Reg: DS/SP/2018/14 · Gamudawa, Sri Lanka
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={GOOGLE_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-bold rounded-xl transition border border-white/20 shadow-sm"
              >
                <FolderSync className="w-4 h-4 text-amber-200" />
                <span>Drive Folder</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>

              <button
                onClick={handleSaveCSVToDrive}
                disabled={isSavingVision}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-black rounded-xl transition shadow-md disabled:opacity-50"
                title="Save exact CSV file into Google Drive folder"
              >
                {isSavingVision ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FolderSync className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Save CSV to Drive</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadCharterCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition shadow-md"
                title="Download Young_Star_Sport_Club_Gamudawa.csv for Excel"
              >
                <Download className="w-3.5 h-3.5 text-slate-950" />
                <span>Excel / CSV</span>
              </button>
            </div>
          </div>

          {visionSaveMsg && (
            <div
              className={`text-xs p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                visionSaveMsg.type === 'success'
                  ? 'bg-emerald-950/70 border-emerald-400/50 text-emerald-100'
                  : 'bg-rose-950/70 border-rose-400/50 text-rose-100'
              }`}
            >
              <div className="flex items-center gap-2">
                {visionSaveMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                )}
                <span>{visionSaveMsg.text}</span>
              </div>
              {visionSaveMsg.link && (
                <a
                  href={visionSaveMsg.link}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline text-white hover:text-amber-200 flex items-center gap-1 shrink-0"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Vision & Mission Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
            {/* Vision */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3">
              <div className="flex items-center gap-2 text-amber-200 font-bold text-sm">
                <Target className="w-5 h-5" />
                <span>🎯 {lang === 'si' ? 'අපගේ දැක්ම (Our Vision)' : 'Our Vision (අපගේ දැක්ම)'}</span>
              </div>
              <blockquote className="text-sm leading-relaxed italic text-white/95 border-l-2 border-amber-300 pl-3">
                "{lang === 'si' ? OFFICIAL_VISION_MISSION.visionSi : OFFICIAL_VISION_MISSION.visionEn}"
              </blockquote>
              <p className="text-[11px] text-white/70 italic">
                {lang === 'si' ? `[EN]: "${OFFICIAL_VISION_MISSION.visionEn}"` : `[SI]: "${OFFICIAL_VISION_MISSION.visionSi}"`}
              </p>
            </div>

            {/* Mission */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3">
              <div className="flex items-center gap-2 text-amber-200 font-bold text-sm">
                <Sparkles className="w-5 h-5" />
                <span>🚀 {lang === 'si' ? 'අපගේ මෙහෙවර (Our Mission)' : 'Our Mission (අපගේ මෙහෙවර)'}</span>
              </div>
              <ul className="space-y-2 text-xs text-white/95">
                {(lang === 'si' ? OFFICIAL_VISION_MISSION.missionSi : OFFICIAL_VISION_MISSION.missionEn).map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-amber-300">💪</span>
                    <span className="leading-snug">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Committee Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              <span>{lang === 'si' ? 'විධායක කාරක සභාව සහ නිලධාරි මණ්ඩලය' : 'Management & Executive Committee'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'si'
                ? 'ක්‍රීඩා සමාජයේ නිල කටයුතු මෙහෙයවන ගෞරවනීය නිලධාරී මණ්ඩලය (2024 - 2027)'
                : 'Elected office bearers leading club operations, tournaments and treasury (Term: 2024 - 2027)'}
            </p>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Reg: DS/SP/2018/14
          </span>
        </div>

        {/* Committee Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {committee.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3.5">
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                      {lang === 'si' ? member.sinhalaRole : member.role}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 truncate">{member.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{member.sinhalaName}</p>
                    <span className="text-[10px] text-slate-400">Term: {member.term}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2.5">
                  {member.responsibility}
                </p>
              </div>

              {/* Contact details */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <a
                  href={`tel:${member.phone}`}
                  className="flex items-center gap-2 hover:text-amber-600 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{member.phone}</span>
                </a>
                <a
                  href={`mailto:${member.email}`}
                  className="flex items-center gap-2 hover:text-amber-600 transition"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Documents & Circulars */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              <span>{lang === 'si' ? 'ක්‍රීඩා සමාජ නිල ලිපි ලේඛන සහ චක්‍රලේඛන' : 'Club Documents & Constitution'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Constitution, AGM minutes, rules, and weekly dues regulations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-amber-400 transition flex items-start justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {doc.category}
                </span>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{doc.title}</h3>
                <p className="text-xs text-amber-700 font-medium">{doc.sinhalaTitle}</p>
                <p className="text-xs text-slate-500 line-clamp-2">{doc.description}</p>
                <div className="text-[11px] text-slate-400 pt-1">
                  Issued: {doc.date} · {doc.fileSize}
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => setActiveDoc(doc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => alert(`Simulated downloading: ${doc.title}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Headquarters and Bank Deposit Details */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h3 className="text-lg font-black text-amber-400 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <span>Young Star Sports Club Gamudawa Headquarters</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Registered under the Department of Sports Development · Reg: DS/SP/2018/14
            </p>
          </div>

          <div className="text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono">youngstarsportclubgamudawa@gmail.com</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Gamudawa Ground Road, Gamudawa Central, Sri Lanka</span>
            </div>
          </div>
        </div>

        {/* Bank Details for Direct Deposits */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <Building className="w-4 h-4" />
            <span>Official Club Bank Account for Membership Dues & Tournament Sponsorships</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-300 pt-1 font-mono text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">BANK:</span>
              <strong className="text-white">Bank of Ceylon (BOC)</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">BRANCH:</span>
              <strong className="text-white">Gamudawa / Dambulla Branch</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">ACCOUNT NUMBER:</span>
              <strong className="text-amber-400">842100984412</strong>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic pt-1">
            *Please mention your Member ID (e.g. YSSC-2024-001) as the payment description or deposit slip reference.
          </p>
        </div>
      </div>

      {/* Document Reader Modal */}
      {activeDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-amber-600">{activeDoc.category}</span>
                <h3 className="text-base font-bold text-slate-900">{activeDoc.title}</h3>
                <p className="text-xs text-slate-500">{activeDoc.sinhalaTitle}</p>
              </div>
              <button
                onClick={() => setActiveDoc(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900">
                Official Excerpt · Young Star Sports Club Gamudawa
              </p>
              <p>{activeDoc.description}</p>
              <p>
                1. All active members are bound to follow the decisions of the Management Committee and abide by sportsmanship principles.
              </p>
              <p>
                2. Weekly dues of LKR 100 must be remitted promptly to ensure continuous equipment provision, turf upkeep, and tournament registration fees.
              </p>
              <p>
                3. Decisions regarding matchday Playing XI selection rest exclusively with the designated Captain and Team Management.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">{activeDoc.fileSize}</span>
              <button
                onClick={() => setActiveDoc(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
