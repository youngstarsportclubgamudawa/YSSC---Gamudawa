import React, { useState, useEffect } from 'react';
import { FinancialTransaction, Member } from '../types';
import { calculateLedgerSummary, calculateMemberArrears } from '../utils/sportsLogic';
import { DollarSign, ArrowUpRight, ArrowDownRight, FileSpreadsheet, PlusCircle, Printer, Download, CheckCircle, RefreshCw, QrCode, X } from 'lucide-react';
import QRCode from 'qrcode';

interface FinancialTrackerProps {
  transactions: FinancialTransaction[];
  members: Member[];
  onAddTransaction: (tx: FinancialTransaction) => void;
  onUpdateMemberDues: (memberId: string, additionalWeeks: number) => void;
  lang: 'en' | 'si';
}

export const FinancialTracker: React.FC<FinancialTrackerProps> = ({
  transactions,
  members,
  onAddTransaction,
  onUpdateMemberDues,
  lang,
}) => {
  const currentWeek = 14;
  const weeklyRate = 100; // LKR 100

  const [activeTab, setActiveTab] = useState<'dues' | 'ledger' | 'gsheet'>('dues');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [viewReceiptModal, setViewReceiptModal] = useState<FinancialTransaction | null>(null);
  const [receiptQrUrl, setReceiptQrUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Form state
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');
  const [weeksToPay, setWeeksToPay] = useState<number>(2);
  const [customAmount, setCustomAmount] = useState<string>('200');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Online QR' | 'Google Sheet Sync'>('Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  const summary = calculateLedgerSummary(transactions);

  // Generate QR for Receipt Modal
  useEffect(() => {
    if (viewReceiptModal) {
      const payload = JSON.stringify({
        receipt: viewReceiptModal.receiptNumber,
        club: 'Young Star SC Gamudawa',
        member: viewReceiptModal.memberName,
        amount: `${viewReceiptModal.amount} LKR`,
        date: viewReceiptModal.date,
        ref: viewReceiptModal.referenceNo,
      });

      QRCode.toDataURL(payload, { width: 140, margin: 1 })
        .then((url) => setReceiptQrUrl(url))
        .catch((err) => console.error(err));
    }
  }, [viewReceiptModal]);

  const handleWeeksChange = (w: number) => {
    setWeeksToPay(w);
    setCustomAmount(String(w * weeklyRate));
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const member = members.find((m) => m.id === selectedMemberId);
    if (!member) return;

    const amount = parseInt(customAmount) || weeksToPay * weeklyRate;
    const newReceipt = `YSSC-RCPT-2026-${String(transactions.length + 143).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      receiptNumber: newReceipt,
      date: today,
      memberId: member.id,
      memberName: member.name,
      category: 'income',
      type: 'weekly_dues',
      amount,
      paymentMethod,
      referenceNo: referenceNo.trim() || `PAY-${Date.now().toString().slice(-6)}`,
      weekNumber: member.weeklyDuesPaidCount + weeksToPay,
      year: 2026,
      recordedBy: 'Nuwan Bandara (Treasurer)',
      notes: notes.trim() || `Payment for ${weeksToPay} weeks membership dues.`,
    };

    onAddTransaction(newTx);
    onUpdateMemberDues(member.id, weeksToPay);
    setIsRecordModalOpen(false);
    setViewReceiptModal(newTx);

    // Reset
    setNotes('');
    setReferenceNo('');
  };

  // Google Sheet live sync simulation
  const handleTriggerGSheetSync = () => {
    setIsSyncing(true);
    setSyncStatus('Connecting to Young_Star_SC_Master_Ledger.gsheet...');
    setTimeout(() => {
      setIsSyncing(false);
      setSyncStatus(`✓ Successfully synchronized with Google Sheet! Updated ${transactions.length} rows.`);
    }, 1200);
  };

  // CSV Export for Treasurer
  const handleExportCSV = () => {
    const headers = ['Receipt No', 'Date', 'Member Name', 'Category', 'Type', 'Amount (LKR)', 'Payment Method', 'Reference', 'Recorded By'];
    const rows = transactions.map((t) => [
      t.receiptNumber,
      t.date,
      `"${t.memberName}"`,
      t.category,
      t.type,
      t.amount,
      t.paymentMethod,
      t.referenceNo,
      `"${t.recordedBy}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Young_Star_SC_Accounts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Collection (Income)</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            LKR {summary.totalIncome.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">Includes dues & donations</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Expenditure (Expenses)</span>
            <div className="p-1.5 bg-red-50 text-red-700 rounded-lg">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            LKR {summary.totalExpense.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">Gear, grounds & events</p>
        </div>

        {/* Net Treasury Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Treasury Net Balance</span>
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">
            LKR {summary.netBalance.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">Bank & Cash In-Hand</p>
        </div>

        {/* Dues Rate */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm space-y-1 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              Membership Dues Standard
            </span>
            <div className="text-xl font-black text-white mt-0.5">LKR 100 / Week</div>
            <p className="text-[11px] text-slate-400">Current: Week #{currentWeek} of 2026</p>
          </div>
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition active:scale-95"
          >
            + Record Payment
          </button>
        </div>
      </div>

      {/* Action Header and Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {lang === 'si' ? 'සතිපතා සමාජික මුදල් සහ ගිණුම් කළමනාකරණය' : 'Weekly Dues & Treasury Ledger'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'si'
              ? 'සමාජික මුදල් තත්ත්වය, රිසිට්පත් සහ Google Sheet ගිණුම් සටහන'
              : 'Individual member dues tracking, digital receipts, and real-time ledger'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('dues')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'dues'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Member Dues Matrix
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'ledger'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transactions ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab('gsheet')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'gsheet'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Sheet Sync</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            title="Download CSV for Excel / Sheets"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Member Dues Matrix */}
      {activeTab === 'dues' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Member Dues Payment Status (Weeks 1 to {currentWeek})
            </h3>
            <span className="text-xs text-slate-500">Rate: LKR 100/week</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3 text-center">Weeks Settled</th>
                  <th className="py-3 px-3 text-right">Total Paid</th>
                  <th className="py-3 px-3 text-right">Arrears / Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => {
                  const duesInfo = calculateMemberArrears(
                    member.weeklyDuesPaidCount * weeklyRate,
                    currentWeek,
                    weeklyRate
                  );

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="w-8 h-8 rounded-full object-cover border"
                        />
                        <div>
                          <div>{member.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {member.regNumber}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-slate-600">{member.primaryRole}</td>

                      <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                        {member.weeklyDuesPaidCount} / {currentWeek}
                      </td>

                      <td className="py-3.5 px-3 text-right font-semibold text-slate-800">
                        LKR {(member.weeklyDuesPaidCount * weeklyRate).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold">
                        {duesInfo.status === 'PAID' ? (
                          <span className="text-emerald-600">0 LKR</span>
                        ) : duesInfo.status === 'ADVANCE' ? (
                          <span className="text-emerald-600">+{Math.abs(duesInfo.arrears)} LKR (Adv)</span>
                        ) : (
                          <span className="text-red-600">-{duesInfo.arrears} LKR</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            duesInfo.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : duesInfo.status === 'ADVANCE'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : duesInfo.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {duesInfo.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedMemberId(member.id);
                            setIsRecordModalOpen(true);
                          }}
                          className="text-[11px] font-bold px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-xs transition"
                        >
                          + Settle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ledger Transactions */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Official Ledger Transactions ({transactions.length})
            </h3>
            <span className="text-xs text-slate-500">Audited by Club Treasurer</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-4">Entity / Member</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Amount (LKR)</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                      {tx.receiptNumber}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">{tx.date}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{tx.memberName}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          tx.category === 'income'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 capitalize">
                      {tx.type.replace('_', ' ')}
                    </td>
                    <td
                      className={`py-3.5 px-3 text-right font-black ${
                        tx.category === 'income' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {tx.category === 'income' ? '+' : '-'} LKR {tx.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">{tx.paymentMethod}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setViewReceiptModal(tx)}
                        className="text-[11px] font-semibold text-slate-700 hover:text-amber-600 underline"
                      >
                        View Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Google Sheet Sync Tab */}
      {activeTab === 'gsheet' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700 border border-emerald-200">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Google Sheet Master Dues Synchronization
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Connected to: <strong>Young_Star_SC_Financial_Ledger_2026</strong>
                </p>
              </div>
            </div>

            <button
              onClick={handleTriggerGSheetSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing with Google Drive...' : 'Sync Now with Google Sheet'}</span>
            </button>
          </div>

          {syncStatus && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncStatus}</span>
            </div>
          )}

          {/* Sheet Preview Simulation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider">
                Cloud Spreadsheet Feed Preview
              </span>
              <span className="text-slate-400">Auto-sync frequency: Every 15 minutes</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 space-y-2 overflow-x-auto">
              <div className="text-slate-400">
                // Google Sheets Webhook End-Point: https://docs.google.com/spreadsheets/d/1YSSC_GAMUDAWA_2026/edit
              </div>
              <div className="text-slate-800 font-bold">
                [COL A: Timestamp] | [COL B: Reg No] | [COL C: Member Name] | [COL D: Amount LKR] | [COL E: Payment Ref] | [COL F: Status]
              </div>
              {transactions.slice(0, 4).map((t, i) => (
                <div key={i} className="text-slate-600">
                  {t.date} 10:00:00 | {t.receiptNumber} | {t.memberName} | {t.amount} LKR | {t.referenceNo} | VERIFIED_PAID
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-500" />
                <span>Record Member Weekly Dues</span>
              </h3>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Member *</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.regNumber}) - Paid {m.weeklyDuesPaidCount} wks
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Weeks Paying</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 4, 10].map((w) => (
                    <button
                      type="button"
                      key={w}
                      onClick={() => handleWeeksChange(w)}
                      className={`py-1.5 rounded-lg border font-bold transition ${
                        weeksToPay === w
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {w} {w === 1 ? 'Wk' : 'Wks'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Amount (LKR) *</label>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Cash">Cash at Ground</option>
                    <option value="Bank Transfer">Bank Transfer (BOC/Peoples)</option>
                    <option value="Online QR">LankaQR / Online</option>
                    <option value="Google Sheet Sync">Google Sheet Sync</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reference / Slip No</label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. TXN-998811 or Cash Ground"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Cleared back dues for March & April"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm"
                >
                  Confirm & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {viewReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Receipt Body */}
            <div id="printable-receipt" className="p-6 bg-white space-y-4 text-slate-800">
              <div className="text-center space-y-1 border-b border-slate-200 pb-3">
                <div className="text-lg font-black tracking-tight text-slate-900">
                  YOUNG STAR SPORTS CLUB
                </div>
                <div className="text-xs font-semibold text-amber-600">
                  තරුණ තරු ක්‍රීඩා සමාජය ගම්උදාව
                </div>
                <div className="text-[10px] text-slate-400">
                  Reg No: DS/SP/2018/14 · Gamudawa, Sri Lanka
                </div>
                <div className="text-[11px] font-mono font-bold text-slate-700 mt-1">
                  OFFICIAL PAYMENT RECEIPT
                </div>
              </div>

              <div className="text-xs space-y-1.5 divide-y divide-slate-100">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Receipt No:</span>
                  <span className="font-mono font-bold text-amber-700">
                    {viewReceiptModal.receiptNumber}
                  </span>
                </div>

                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Date:</span>
                  <span className="font-semibold text-slate-800">{viewReceiptModal.date}</span>
                </div>

                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Member Name:</span>
                  <span className="font-bold text-slate-900">{viewReceiptModal.memberName}</span>
                </div>

                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-medium text-slate-700 capitalize">
                    {viewReceiptModal.type.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Method:</span>
                  <span className="font-semibold text-slate-800">
                    {viewReceiptModal.paymentMethod}
                  </span>
                </div>

                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Reference:</span>
                  <span className="font-mono text-slate-600">{viewReceiptModal.referenceNo}</span>
                </div>

                <div className="flex justify-between pt-2 text-sm font-black border-t-2 border-slate-900">
                  <span>AMOUNT PAID:</span>
                  <span className="text-emerald-700">
                    LKR {viewReceiptModal.amount.toLocaleString()}.00
                  </span>
                </div>
              </div>

              {/* QR and Signature */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                {receiptQrUrl && (
                  <img src={receiptQrUrl} alt="Receipt QR" className="w-16 h-16 border rounded" />
                )}
                <div className="text-right text-[10px] space-y-1">
                  <div className="font-script text-xs text-slate-600 italic">Nuwan Bandara</div>
                  <div className="border-t border-slate-300 pt-0.5 font-bold text-slate-600">
                    Club Treasurer
                  </div>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>

              <button
                onClick={() => setViewReceiptModal(null)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
