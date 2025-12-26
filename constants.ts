
import { Room, SlotType, Booking, Member, MemberRole, MemberStatus } from './types';

export const ROOMS: Room[] = [
  { id: 'room-1', name: '富民館2樓古風' },
  { id: 'room-2', name: '富民館2樓仙俠' },
  { id: 'room-3', name: '富民館3樓歐式' },
  { id: 'room-4', name: '富民館3樓日式' },
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    date: '2026-11-14',
    roomId: 'room-1',
    slot: SlotType.AFTERNOON,
    timeRange: '10:00-18:30',
    scriptName: '竊雲台',
    dms: ['待定', '待定'], // Matches screenshot yellow highlight logic
    npcs: [],
    depositAmount: 1000,
    organizerName: '佳芳',
  },
  {
    id: 'b2',
    date: '2026-11-14',
    roomId: 'room-1',
    slot: SlotType.EVENING,
    timeRange: '19:00-02:00',
    scriptName: '請君入甕',
    dms: ['待定', '待定'],
    npcs: ['貓咪'],
    depositAmount: 1000,
    organizerName: '佳芳',
  },
  {
    id: 'b3',
    date: '2026-11-14',
    roomId: 'room-2',
    slot: SlotType.AFTERNOON,
    timeRange: '13:00-17:00',
    scriptName: '古木吟',
    dms: ['小凱'],
    npcs: [],
    depositAmount: 0,
    organizerName: 'Mark',
  },
   {
    id: 'b4',
    date: '2026-11-15',
    roomId: 'room-3',
    slot: SlotType.EVENING,
    timeRange: '19:30-23:30',
    scriptName: '病嬌男孩的精分日記',
    dms: ['阿寶'],
    npcs: ['小紅', '小明'],
    depositAmount: 2000,
    organizerName: 'Jason',
  }
];

export const PRESET_SCRIPTS = [
  '竊雲台',
  '請君入甕',
  '古木吟',
  '病嬌男孩的精分日記',
  '拆遷',
  '搞事',
  '一點半',
];

export const PRESET_DMS = [
  '小凱',
  '阿寶',
  '佳芳',
  '待定'
];

export const PRESET_NPCS = [
  '小紅',
  '小明',
  '貓咪'
];

// 簡易國定假日清單 (YYYY-MM-DD)
export const HOLIDAYS = [
    '2026-01-01', // 元旦
    '2026-02-28', // 228
    '2026-04-04', // 兒童節
    '2026-04-05', // 清明節
    '2026-05-01', // 勞動節
    '2026-06-19', // 端午節 (預估)
    '2026-09-25', // 中秋節 (預估)
    '2026-10-10', // 國慶日
    // 為了展示效果，假設目前選取的 2026-11-14 的前一天是假日，或可自行新增
];

// --- Mock Members ---
export const MOCK_MEMBERS: Member[] = [
  {
    id: 'admin-01',
    username: 'boardgamex2f',
    password: 'Boardgamex2F', // Default password
    displayName: '系統管理員',
    role: MemberRole.ADMIN,
    status: MemberStatus.APPROVED,
    createdAt: '2024-01-01',
    isOnline: true, // Default online for demo
  },
  {
    id: 'editor-01',
    username: 'editor',
    password: 'password',
    displayName: '值班經理 (編輯者)',
    role: MemberRole.EDITOR,
    status: MemberStatus.APPROVED,
    createdAt: '2024-01-05',
    isOnline: false,
  },
  {
    id: 'member-01',
    username: 'guest',
    password: 'password',
    displayName: '測試主持人',
    role: MemberRole.MEMBER,
    status: MemberStatus.APPROVED,
    createdAt: '2024-02-15',
    isOnline: true, // Default online for demo
  },
  {
    id: 'member-02',
    username: 'newbie',
    password: 'password',
    displayName: '待審核主持人',
    role: MemberRole.MEMBER,
    status: MemberStatus.PENDING, // Pending approval
    createdAt: '2024-05-20',
    isOnline: false,
  }
];
