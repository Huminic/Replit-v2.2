// Mock drive files data for Nexxus V2 UI prototype

export type FileType = 'folder' | 'document' | 'spreadsheet' | 'image' | 'pdf' | 'video' | 'audio';

export interface DriveFile {
  id: string;
  name: string;
  type: FileType;
  size?: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  shared: boolean;
  starred: boolean;
}

export const mockFiles: DriveFile[] = [
  // Root folders
  {
    id: 'folder-1',
    name: 'Marketing Materials',
    type: 'folder',
    parentId: null,
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-20T14:00:00Z',
    createdBy: 'Duane Wells',
    shared: true,
    starred: true,
  },
  {
    id: 'folder-2',
    name: 'Sales Documents',
    type: 'folder',
    parentId: null,
    createdAt: '2026-01-05T09:00:00Z',
    updatedAt: '2026-01-19T16:00:00Z',
    createdBy: 'Duane Wells',
    shared: false,
    starred: false,
  },
  {
    id: 'folder-3',
    name: 'Agent Training',
    type: 'folder',
    parentId: null,
    createdAt: '2026-01-10T11:00:00Z',
    updatedAt: '2026-01-18T10:00:00Z',
    createdBy: 'Sarah Johnson',
    shared: true,
    starred: true,
  },
  // Files in root
  {
    id: 'file-1',
    name: 'Q1 Sales Report.pdf',
    type: 'pdf',
    size: 2450000,
    parentId: null,
    createdAt: '2026-01-15T14:00:00Z',
    updatedAt: '2026-01-15T14:00:00Z',
    createdBy: 'Duane Wells',
    shared: false,
    starred: true,
  },
  {
    id: 'file-2',
    name: 'Inventory Spreadsheet.xlsx',
    type: 'spreadsheet',
    size: 1250000,
    parentId: null,
    createdAt: '2026-01-12T09:00:00Z',
    updatedAt: '2026-01-20T11:00:00Z',
    createdBy: 'Mike Chen',
    shared: true,
    starred: false,
  },
  {
    id: 'file-3',
    name: 'Welcome Video.mp4',
    type: 'video',
    size: 45000000,
    parentId: null,
    createdAt: '2026-01-08T15:00:00Z',
    updatedAt: '2026-01-08T15:00:00Z',
    createdBy: 'Sarah Johnson',
    shared: true,
    starred: false,
  },
  // Files in Marketing Materials folder
  {
    id: 'file-4',
    name: 'Brand Guidelines.pdf',
    type: 'pdf',
    size: 5200000,
    parentId: 'folder-1',
    createdAt: '2026-01-02T10:00:00Z',
    updatedAt: '2026-01-10T14:00:00Z',
    createdBy: 'Duane Wells',
    shared: true,
    starred: false,
  },
  {
    id: 'file-5',
    name: 'Social Media Assets',
    type: 'folder',
    parentId: 'folder-1',
    createdAt: '2026-01-03T11:00:00Z',
    updatedAt: '2026-01-18T09:00:00Z',
    createdBy: 'Sarah Johnson',
    shared: true,
    starred: false,
  },
  {
    id: 'file-6',
    name: 'Promotional Flyer.png',
    type: 'image',
    size: 850000,
    parentId: 'folder-1',
    createdAt: '2026-01-14T16:00:00Z',
    updatedAt: '2026-01-14T16:00:00Z',
    createdBy: 'Mike Chen',
    shared: false,
    starred: true,
  },
];

export const mockTemplates: DriveFile[] = [
  {
    id: 'template-1',
    name: 'Sales Contract Template',
    type: 'document',
    size: 125000,
    parentId: null,
    createdAt: '2025-12-01T10:00:00Z',
    updatedAt: '2025-12-15T14:00:00Z',
    createdBy: 'System',
    shared: true,
    starred: false,
  },
  {
    id: 'template-2',
    name: 'Vehicle Inspection Checklist',
    type: 'document',
    size: 85000,
    parentId: null,
    createdAt: '2025-12-05T09:00:00Z',
    updatedAt: '2025-12-20T11:00:00Z',
    createdBy: 'System',
    shared: true,
    starred: false,
  },
  {
    id: 'template-3',
    name: 'Monthly Report Template',
    type: 'spreadsheet',
    size: 320000,
    parentId: null,
    createdAt: '2025-12-10T14:00:00Z',
    updatedAt: '2026-01-05T10:00:00Z',
    createdBy: 'System',
    shared: true,
    starred: false,
  },
];

export const getFileIcon = (type: FileType): string => {
  const icons: Record<FileType, string> = {
    folder: 'Folder',
    document: 'FileText',
    spreadsheet: 'Table',
    image: 'Image',
    pdf: 'FileText',
    video: 'Video',
    audio: 'Music',
  };
  return icons[type];
};

export const getFileColor = (type: FileType): string => {
  const colors: Record<FileType, string> = {
    folder: 'text-blue-500',
    document: 'text-blue-600',
    spreadsheet: 'text-green-500',
    image: 'text-purple-500',
    pdf: 'text-red-500',
    video: 'text-pink-500',
    audio: 'text-orange-500',
  };
  return colors[type];
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};
