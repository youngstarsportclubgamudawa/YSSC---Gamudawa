export type SportType = 'Cricket' | 'Volleyball' | 'Football' | 'Carrom' | 'Badminton' | 'Athletics';

export type MemberStatus = 'Active' | 'Inactive' | 'Honorary' | 'Suspended';

export interface Member {
  id: string;
  regNumber: string;
  name: string;
  sinhalaName: string;
  nic: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address: string;
  sports: SportType[];
  primaryRole: string; // e.g. "Top Order Batsman", "All Rounder", "Power Spiker", "Goalkeeper"
  jerseyNumber?: number;
  joinedDate: string;
  status: MemberStatus;
  avatarUrl: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  weeklyDuesPaidCount: number; // number of weeks paid in current year
  duesNotes?: string;
}

export interface TeamSquad {
  id: string;
  name: string;
  sinhalaName: string;
  sport: SportType;
  captainId: string;
  viceCaptainId?: string;
  playerIds: string[];
  jerseyColor: string;
  coachName?: string;
}

export interface BallEvent {
  ball: string; // e.g. "14.2"
  result: string; // "0" | "1" | "2" | "3" | "4" | "6" | "W" | "Wd" | "Nb"
  runs: number;
  isWicket?: boolean;
  commentary: string;
  timestamp: string;
}

export interface MatchScorecard {
  id: string;
  title: string;
  tournamentName: string;
  sport: SportType;
  date: string;
  time: string;
  venue: string;
  status: 'upcoming' | 'live' | 'completed';
  teamA: {
    id: string;
    name: string;
    shortName: string;
    logo?: string;
    runs?: number;
    wickets?: number;
    overs?: string | number;
    points?: number;
  };
  teamB: {
    id: string;
    name: string;
    shortName: string;
    logo?: string;
    runs?: number;
    wickets?: number;
    overs?: string | number;
    points?: number;
  };
  matchType: string; // "T20 (20 Overs)", "Sixes Tournament", "Volleyball 3-Set", "Football 90m"
  resultSummary?: string;
  manOfTheMatch?: string;
  currentInnings?: 1 | 2;
  currentBattingTeam?: 'teamA' | 'teamB';
  liveData?: {
    runs: number;
    wickets: number;
    totalBalls: number; // e.g. 84 balls = 14.0 overs
    target?: number;
    currentOverBalls: string[]; // e.g. ["1", "4", "W", "0", "6"]
    striker: { name: string; runs: number; balls: number; fours: number; sixes: number };
    nonStriker: { name: string; runs: number; balls: number; fours: number; sixes: number };
    bowler: { name: string; oversConceded: string; maidens: number; runs: number; wickets: number };
    recentBallEvents: BallEvent[];
  };
}

export interface FinancialTransaction {
  id: string;
  receiptNumber: string;
  date: string;
  memberId?: string;
  memberName: string;
  category: 'income' | 'expense';
  type: 'weekly_dues' | 'tournament_fee' | 'donation' | 'equipment_expense' | 'maintenance' | 'ground_rent';
  amount: number; // LKR
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Online QR' | 'Google Sheet Sync';
  referenceNo: string;
  weekNumber?: number;
  year: number;
  recordedBy: string;
  notes?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  album: string;
  sport: SportType | 'Club Life';
  date: string;
  url: string;
  caption: string;
  photographer?: string;
}

export interface CommitteeMember {
  id: string;
  role: string;
  sinhalaRole: string;
  name: string;
  sinhalaName: string;
  phone: string;
  email: string;
  avatarUrl: string;
  term: string;
  responsibility: string;
}

export interface ClubDocument {
  id: string;
  title: string;
  sinhalaTitle: string;
  category: 'Constitution' | 'Meeting Minutes' | 'Circular' | 'Rules & Code of Conduct';
  date: string;
  fileSize: string;
  description: string;
}

export interface ClubProfileInfo {
  clubNameEn: string;
  clubNameSi: string;
  regNumber: string;
  establishedYear: string;
  homeGroundEn: string;
  homeGroundSi: string;
  email: string;
  phone: string;
  visionEn: string;
  visionSi: string;
  missionEn: string[];
  missionSi: string[];
  weeklyDuesRate: number;
  currentWeek: number;
}

export type GplJerseySize = 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type GplPlayingRole = 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
export type GplPaymentStatus = 'Advance Rs. 1,500 Paid' | 'Full Paid (Rs. 3,000)' | 'Pending';

export interface GplPlayer {
  id: string;
  slot: number; // 1 to 11
  name: string;
  sinhalaName?: string;
  role: GplPlayingRole;
  jerseySize: GplJerseySize;
  jerseyNumber: number;
  paymentStatus: GplPaymentStatus;
  phone: string;
  nic: string;
  photoUrl: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  photoFileName?: string;
  drivePhotoId?: string;
  notes?: string;
}

export interface GplTeam {
  id: string;
  teamNumber: number; // 1 to 6
  name: string;
  sinhalaName: string;
  color: string;
  badge: string;
  gradient: string;
  managerName: string;
  managerPhone: string;
  captainName: string;
  viceCaptainName: string;
  players: GplPlayer[];
  lastDriveSyncTime?: string;
  driveFolderUrl?: string;
}

