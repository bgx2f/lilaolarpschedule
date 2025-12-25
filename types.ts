
export enum SlotType {
  MORNING = '上午場',
  AFTERNOON = '下午場',
  EVENING = '晚上場',
}

export enum PaymentStatus {
  UNPAID = '未付',
  PARTIAL = '已付定金',
  PAID = '已結清',
}

export interface Room {
  id: string;
  name: string;
  capacity?: number;
}

export interface Booking {
  id: string;
  date: string; // YYYY-MM-DD
  roomId: string;
  slot: SlotType;
  timeRange: string; // e.g., "10:00-18:30"
  scriptName: string;
  dms: string[]; // Array of DM names
  npcs: string[]; // Array of NPC names
  depositAmount: number;
  organizerName: string;
  organizerContact?: string;
  notes?: string;
}

// Helper to define the grid structure
export interface DaySchedule {
  date: string;
  bookings: Booking[];
}

// --- New Member System Types ---

export enum MemberRole {
  ADMIN = 'admin',
  EDITOR = 'editor', // New role: Can edit bookings but not members
  MEMBER = 'member',
}

export enum MemberStatus {
  PENDING = 'pending',   // Registered, waiting for approval
  APPROVED = 'approved', // Can login
  REJECTED = 'rejected', // Denied access
}

export interface Member {
  id: string;
  username: string;
  password: string; // In a real app, this should be hashed
  displayName: string;
  role: MemberRole;
  status: MemberStatus;
  createdAt: string;
  isOnline?: boolean; // New field to track online status
}

// --- Cloud Sync Types ---
export interface LarpData {
  bookings: Booking[];
  rooms: Room[];
  scripts: string[];
  dms: string[];
  npcs: string[];
  holidays: string[];
  members: Member[];
  lastUpdated: string;
}

export interface GoogleDriveConfig {
  clientId: string;
  apiKey: string;
}
