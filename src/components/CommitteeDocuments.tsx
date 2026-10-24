import React, { useState } from 'react';
import { CommitteeMember, ClubDocument } from '../types';
import { Users, FileText, Phone, Mail, Download, ShieldCheck, MapPin, Building, Eye, X } from 'lucide-react';

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

  return (
    <div className="space-y-8">
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
