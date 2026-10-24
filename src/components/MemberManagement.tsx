import React, { useState, useEffect } from 'react';
import { Member, SportType } from '../types';
import { calculateMemberArrears } from '../utils/sportsLogic';
import { Search, UserPlus, Phone, MapPin, QrCode, X, Check, AlertCircle, Shield, Award, Printer } from 'lucide-react';
import QRCode from 'qrcode';

interface MemberManagementProps {
  members: Member[];
  onAddMember: (member: Member) => void;
  onUpdateMember: (member: Member) => void;
  lang: 'en' | 'si';
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  members,
  onAddMember,
  onUpdateMember,
  lang,
}) => {
  const currentWeek = 14; // current week in calendar year
  const weeklyRate = 100; // LKR 100 per week

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [selectedDuesFilter, setSelectedDuesFilter] = useState<string>('All');
  const [activeMemberModal, setActiveMemberModal] = useState<Member | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [showIdCardModal, setShowIdCardModal] = useState<Member | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Form state for new member registration
  const [formData, setFormData] = useState({
    name: '',
    sinhalaName: '',
    nic: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    sports: ['Cricket'] as SportType[],
    primaryRole: '',
    jerseyNumber: '',
    emergencyName: '',
    emergencyRelationship: 'Father',
    emergencyPhone: '',
    initialWeeksPaid: '14',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Generate QR Code when ID card modal opens
  useEffect(() => {
    if (showIdCardModal) {
      const qrPayload = JSON.stringify({
        club: 'Young Star Sports Club Gamudawa',
        regNo: showIdCardModal.regNumber,
        name: showIdCardModal.name,
        nic: showIdCardModal.nic,
        validYear: 2026,
        status: showIdCardModal.status,
      });

      QRCode.toDataURL(qrPayload, { width: 180, margin: 1 })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation error', err));
    }
  }, [showIdCardModal]);

  // Filter members
  const filteredMembers = members.filter((m) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(query) ||
      m.sinhalaName.toLowerCase().includes(query) ||
      m.regNumber.toLowerCase().includes(query) ||
      m.nic.toLowerCase().includes(query) ||
      m.phone.includes(query);

    const matchesSport = selectedSport === 'All' || m.sports.includes(selectedSport as SportType);

    const duesState = calculateMemberArrears(
      m.weeklyDuesPaidCount * weeklyRate,
      currentWeek,
      weeklyRate
    ).status;

    let matchesDues = true;
    if (selectedDuesFilter === 'PAID') {
      matchesDues = duesState === 'PAID' || duesState === 'ADVANCE';
    } else if (selectedDuesFilter === 'PENDING') {
      matchesDues = duesState === 'PENDING';
    } else if (selectedDuesFilter === 'OVERDUE') {
      matchesDues = duesState === 'OVERDUE';
    }

    return matchesSearch && matchesSport && matchesDues;
  });

  const allSports: SportType[] = ['Cricket', 'Volleyball', 'Football', 'Carrom', 'Badminton', 'Athletics'];

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.nic.trim()) errors.nic = 'NIC / National ID is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.primaryRole.trim()) errors.primaryRole = 'Primary sports role is required';
    if (formData.sports.length === 0) errors.sports = 'Select at least one sport';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newId = `mem-${Date.now()}`;
    const nextRegNumber = `YSSC-2024-${String(members.length + 1).padStart(3, '0')}`;

    const newMember: Member = {
      id: newId,
      regNumber: nextRegNumber,
      name: formData.name.trim(),
      sinhalaName: formData.sinhalaName.trim() || formData.name.trim(),
      nic: formData.nic.trim(),
      phone: formData.phone.trim(),
      whatsapp: formData.whatsapp.trim() || formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim() || 'Gamudawa, Sri Lanka',
      sports: formData.sports,
      primaryRole: formData.primaryRole.trim(),
      jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : undefined,
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80`,
      emergencyContact: {
        name: formData.emergencyName || 'Family Member',
        relationship: formData.emergencyRelationship || 'Family',
        phone: formData.emergencyPhone || formData.phone,
      },
      weeklyDuesPaidCount: parseInt(formData.initialWeeksPaid) || currentWeek,
    };

    onAddMember(newMember);
    setIsRegisterOpen(false);
    // Reset form
    setFormData({
      name: '',
      sinhalaName: '',
      nic: '',
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      sports: ['Cricket'],
      primaryRole: '',
      jerseyNumber: '',
      emergencyName: '',
      emergencyRelationship: 'Father',
      emergencyPhone: '',
      initialWeeksPaid: '14',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {lang === 'si' ? 'ක්‍රීඩා සමාජ සාමාජික කළමනාකරණය' : 'Club Member Directory'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'si'
              ? `ලියාපදිංචි ක්‍රීඩකයින් සහ සාමාජිකයින් ${members.length} දෙනෙක්`
              : `Total ${members.length} registered sportsmen and executive members`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-sm transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>{lang === 'si' ? 'නව සාමාජිකයෙකු ලියාපදිංචි කිරීම' : 'Register New Member'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'si' ? 'නම, හැඳුනුම්පත් අංකය, සාමාජික අංකය හෝ දුරකථන අංකයෙන් සොයන්න...' : 'Search by name, NIC, Member ID (YSSC-...), or phone...'}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
            />
          </div>

          {/* Sport Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-500">Sport:</span>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-700"
            >
              <option value="All">All Sports</option>
              {allSports.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Dues Status Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-500">Weekly Dues:</span>
            <select
              value={selectedDuesFilter}
              onChange={(e) => setSelectedDuesFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-700"
            >
              <option value="All">All Dues States</option>
              <option value="PAID">Paid / Advance</option>
              <option value="PENDING">Pending (1-2 wks)</option>
              <option value="OVERDUE">Overdue (&gt;2 wks)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMembers.map((member) => {
          const duesInfo = calculateMemberArrears(
            member.weeklyDuesPaidCount * weeklyRate,
            currentWeek,
            weeklyRate
          );

          return (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400/80 p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Member Header (Avatar, Names, Reg #) */}
                <div className="flex items-start gap-3.5">
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-600 tracking-wider">
                        {member.regNumber}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          member.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : member.status === 'Honorary'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {member.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 truncate leading-snug">
                      {member.name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">
                      {member.sinhalaName}
                    </p>
                  </div>
                </div>

                {/* Role and Sports */}
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{member.primaryRole}</span>
                    {member.jerseyNumber && (
                      <span className="text-[10px] text-slate-500">#{member.jerseyNumber}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {member.sports.map((sp) => (
                      <span
                        key={sp}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                      >
                        {sp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Dues Status Bar */}
                <div className="pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Dues (Wk 1-{currentWeek}):</span>
                    <span
                      className={`font-bold ${
                        duesInfo.status === 'PAID' || duesInfo.status === 'ADVANCE'
                          ? 'text-emerald-600'
                          : duesInfo.status === 'PENDING'
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}
                    >
                      {duesInfo.status === 'PAID'
                        ? 'Settled'
                        : duesInfo.status === 'ADVANCE'
                        ? `Advance (+${Math.abs(duesInfo.arrears)} LKR)`
                        : `Arrears: ${duesInfo.arrears} LKR`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        duesInfo.status === 'PAID' || duesInfo.status === 'ADVANCE'
                          ? 'bg-emerald-500'
                          : duesInfo.status === 'PENDING'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (member.weeklyDuesPaidCount / currentWeek) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setShowIdCardModal(member)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-amber-600 py-1 px-2 rounded hover:bg-slate-50 transition"
                  title="Generate Digital Pass with QR"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-500" />
                  <span>Member Pass</span>
                </button>

                <button
                  onClick={() => setActiveMemberModal(member)}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 py-1 px-2.5 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                >
                  Full Profile
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">No members match your criteria</h4>
          <p className="text-xs">Try searching for a different keyword or resetting filters.</p>
        </div>
      )}

      {/* Member Details Modal */}
      {activeMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={activeMemberModal.avatarUrl}
                    alt={activeMemberModal.name}
                    className="w-16 h-16 rounded-xl object-cover border"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-600">
                      {activeMemberModal.regNumber}
                    </span>
                    <h3 className="text-base font-black text-slate-900">
                      {activeMemberModal.name}
                    </h3>
                    <p className="text-xs text-slate-500">{activeMemberModal.sinhalaName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveMemberModal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs divide-y divide-slate-100">
                <div className="pt-2 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400">National ID (NIC):</span>
                    <p className="font-semibold text-slate-800">{activeMemberModal.nic}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Primary Role:</span>
                    <p className="font-semibold text-slate-800">{activeMemberModal.primaryRole}</p>
                  </div>
                </div>

                <div className="pt-2 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400">Phone:</span>
                    <p className="font-semibold text-slate-800">{activeMemberModal.phone}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">WhatsApp:</span>
                    <p className="font-semibold text-slate-800">{activeMemberModal.whatsapp || 'Same'}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-slate-400">Residential Address:</span>
                  <p className="font-semibold text-slate-800">{activeMemberModal.address}</p>
                </div>

                <div className="pt-2">
                  <span className="text-slate-400">Emergency Contact:</span>
                  <p className="font-semibold text-slate-800">
                    {activeMemberModal.emergencyContact.name} ({activeMemberModal.emergencyContact.relationship}) -{' '}
                    {activeMemberModal.emergencyContact.phone}
                  </p>
                </div>

                <div className="pt-2">
                  <span className="text-slate-400">Membership Dues:</span>
                  <p className="font-semibold text-slate-800">
                    Paid {activeMemberModal.weeklyDuesPaidCount} of {currentWeek} weeks ({activeMemberModal.weeklyDuesPaidCount * weeklyRate} LKR)
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    const targetMember = activeMemberModal;
                    setActiveMemberModal(null);
                    setShowIdCardModal(targetMember);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Show Member Card</span>
                </button>

                <button
                  onClick={() => setActiveMemberModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Member ID Card Modal */}
      {showIdCardModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Printable Pass Container */}
            <div id="printable-member-pass" className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                    ⭐
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-400 tracking-wider">
                      YOUNG STAR SC
                    </h4>
                    <p className="text-[10px] text-slate-300">Gamudawa · Sri Lanka</p>
                  </div>
                </div>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                  2026 PASS
                </span>
              </div>

              {/* Photo & Details */}
              <div className="flex items-center gap-4">
                <img
                  src={showIdCardModal.avatarUrl}
                  alt={showIdCardModal.name}
                  className="w-20 h-20 rounded-xl object-cover border-2 border-amber-400 shadow-md shrink-0"
                />
                <div className="space-y-1">
                  <span className="text-[11px] font-mono font-bold text-amber-400">
                    {showIdCardModal.regNumber}
                  </span>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    {showIdCardModal.name}
                  </h3>
                  <p className="text-xs text-amber-200/80 font-medium">{showIdCardModal.sinhalaName}</p>
                  <p className="text-[11px] text-slate-300">{showIdCardModal.primaryRole}</p>
                </div>
              </div>

              {/* QR Verification */}
              <div className="bg-white rounded-xl p-3 flex items-center justify-between text-slate-900">
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    NIC
                  </span>
                  <p className="text-xs font-bold text-slate-800">{showIdCardModal.nic}</p>
                  <span className="text-[10px] text-emerald-700 font-semibold block pt-1">
                    ✓ Verified Member
                  </span>
                </div>
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="Club QR Pass" className="w-16 h-16 rounded shrink-0" />
                )}
              </div>

              <div className="text-[9px] text-center text-slate-400 pt-1">
                Issued by Management Committee · Young Star Sports Club Gamudawa
              </div>
            </div>

            {/* Modal Controls */}
            <div className="p-4 bg-slate-50 flex items-center justify-between border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Pass</span>
              </button>

              <button
                onClick={() => setShowIdCardModal(null)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'si' ? 'නව සාමාජික අයදුම්පත' : 'Register New Member'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Full Name (English) *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Kasun Dananjaya Fernando"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  {formErrors.name && <p className="text-red-500 text-[10px] mt-0.5">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Name in Sinhala (සම්පූර්ණ නම)
                  </label>
                  <input
                    type="text"
                    value={formData.sinhalaName}
                    onChange={(e) => setFormData({ ...formData, sinhalaName: e.target.value })}
                    placeholder="උදා: කසුන් ධනංජය ප්‍රනාන්දු"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    National ID (NIC) *
                  </label>
                  <input
                    type="text"
                    value={formData.nic}
                    onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                    placeholder="e.g. 199845001243"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  {formErrors.nic && <p className="text-red-500 text-[10px] mt-0.5">{formErrors.nic}</p>}
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Phone / Mobile *
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+94 77 123 4567"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  {formErrors.phone && <p className="text-red-500 text-[10px] mt-0.5">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="+94 77 123 4567"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="player@gmail.com"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="text-xs">
                <label className="font-semibold text-slate-700 block mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street / House No, Gamudawa"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Primary Role & Sports */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Primary Sports Role *
                  </label>
                  <input
                    type="text"
                    value={formData.primaryRole}
                    onChange={(e) => setFormData({ ...formData, primaryRole: e.target.value })}
                    placeholder="e.g. All-Rounder, Spiker, Bowler"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  {formErrors.primaryRole && (
                    <p className="text-red-500 text-[10px] mt-0.5">{formErrors.primaryRole}</p>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Jersey Number (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.jerseyNumber}
                    onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                    placeholder="e.g. 7"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Sports selection checkboxes */}
              <div className="text-xs">
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Sports Enrolled In *
                </label>
                <div className="flex flex-wrap gap-2">
                  {allSports.map((sp) => {
                    const isChecked = formData.sports.includes(sp);
                    return (
                      <button
                        type="button"
                        key={sp}
                        onClick={() => {
                          if (isChecked) {
                            setFormData({
                              ...formData,
                              sports: formData.sports.filter((s) => s !== sp),
                            });
                          } else {
                            setFormData({
                              ...formData,
                              sports: [...formData.sports, sp],
                            });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
                          isChecked
                            ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                        <span>{sp}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-200">
                <span className="font-bold text-slate-700 block">Emergency Contact Person</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={formData.emergencyName}
                    onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                    placeholder="Contact Name"
                    className="px-2.5 py-1.5 border rounded-lg bg-white"
                  />
                  <input
                    type="text"
                    value={formData.emergencyRelationship}
                    onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })}
                    placeholder="Relationship (e.g. Father)"
                    className="px-2.5 py-1.5 border rounded-lg bg-white"
                  />
                  <input
                    type="text"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    placeholder="Emergency Phone"
                    className="px-2.5 py-1.5 border rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-sm transition active:scale-95"
                >
                  Submit Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
