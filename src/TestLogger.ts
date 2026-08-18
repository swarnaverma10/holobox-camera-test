export interface LogEntry {
  timestamp: string;
  cameraName: string;
  nativeWidth: number;
  nativeHeight: number;
  fps: number;
  selectedMode: string;
  targetWidth: number;
  targetHeight: number;
  fitMode: string;
  viewScale: number;
  viewOffsetX: number;
  viewOffsetY: number;
  cameraScale: number;
  cameraOffsetX: number;
  cameraOffsetY: number;
  rawLandmarksSample?: string;
  mappedLandmarksSample?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private readonly STORAGE_KEY = 'holobox_pose_log';

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        this.logs = JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load logs', e);
    }
  }

  addLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > 1000) {
      this.logs.shift();
    }
    this.saveLogs();
  }

  private saveLogs() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
    } catch (e) {
      console.error('Failed to save logs', e);
    }
  }

  exportCSV() {
    if (this.logs.length === 0) return;

    const headers = Object.keys(this.logs[0]).join(',');
    const rows = this.logs.map(log => {
      return Object.values(log)
        .map(v => {
          if (typeof v === 'string') return `"${v.replace(/"/g, '""')}"`;
          return v;
        })
        .join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'holobox_pose_log.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportJSON() {
    if (this.logs.length === 0) return;
    const jsonContent = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'holobox_pose_log.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export const TestLogger = new Logger();
