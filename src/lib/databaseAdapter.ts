import { PlatformData, CloudConfig } from '../types';

/**
 * -------------------------------------------------------------
 * Database & Storage Adapter Pattern (نمط المحول لقواعد البيانات والتخزين)
 * -------------------------------------------------------------
 * هذا الملف هو "الفيشة" التي تربط واجهات التطبيق بقاعدة البيانات.
 * يتم التحكم فيه ديناميكياً من خلال لوحة المطور (CloudConfig).
 */

export interface IDatabaseAdapter {
  fetchPlatformData(tenantId: string): Promise<PlatformData | null>;
  savePlatformData(tenantId: string, data: Partial<PlatformData>): Promise<void>;
}

export interface IStorageAdapter {
  uploadFile(path: string, file: File): Promise<string>;
  deleteFile(path: string): Promise<void>;
}

// 1. Firebase Implementations
class FirebaseDatabaseAdapter implements IDatabaseAdapter {
  config: CloudConfig['firebaseConfig'];
  constructor(config: CloudConfig['firebaseConfig']) {
    this.config = config;
  }
  async fetchPlatformData(tenantId: string): Promise<PlatformData | null> {
    console.log(`[Firebase DB] Fetching data for tenant: ${tenantId} using projectId: ${this.config.projectId}`);
    return null; // To be implemented with actual Firestore
  }
  async savePlatformData(tenantId: string, data: Partial<PlatformData>): Promise<void> {
    console.log(`[Firebase DB] Saving data for tenant: ${tenantId} using projectId: ${this.config.projectId}`);
  }
}

class FirebaseStorageAdapter implements IStorageAdapter {
  config: CloudConfig['firebaseConfig'];
  constructor(config: CloudConfig['firebaseConfig']) {
    this.config = config;
  }
  async uploadFile(path: string, file: File): Promise<string> {
    console.log(`[Firebase Storage] Uploading to bucket: ${this.config.storageBucket}, path: ${path}`);
    return `https://firebasestorage.googleapis.com/v0/b/${this.config.storageBucket}/o/${encodeURIComponent(path)}`;
  }
  async deleteFile(path: string): Promise<void> {
    console.log(`[Firebase Storage] Deleting from bucket: ${this.config.storageBucket}, path: ${path}`);
  }
}

// 2. Local Server Implementations (Node.js/SQL)
class LocalDatabaseAdapter implements IDatabaseAdapter {
  config: CloudConfig['localServerConfig'];
  constructor(config: CloudConfig['localServerConfig']) {
    this.config = config;
  }
  async fetchPlatformData(tenantId: string): Promise<PlatformData | null> {
    console.log(`[Local SQL] Fetching data from ${this.config.apiUrl}/data/${tenantId}`);
    return null;
  }
  async savePlatformData(tenantId: string, data: Partial<PlatformData>): Promise<void> {
    console.log(`[Local SQL] Saving data to ${this.config.apiUrl}/data/${tenantId}`);
  }
}

class LocalFolderStorageAdapter implements IStorageAdapter {
  config: CloudConfig['localServerConfig'];
  constructor(config: CloudConfig['localServerConfig']) {
    this.config = config;
  }
  async uploadFile(path: string, file: File): Promise<string> {
    console.log(`[Local Folder] Saving file to local path: ${this.config.storagePath}/${path}`);
    return `${this.config.apiUrl}/uploads/${path}`;
  }
  async deleteFile(path: string): Promise<void> {
    console.log(`[Local Folder] Deleting file from local path: ${this.config.storagePath}/${path}`);
  }
}

// Core System Manager
class CloudManager {
  db: IDatabaseAdapter | null = null;
  storage: IStorageAdapter | null = null;

  configure(config?: CloudConfig) {
    if (!config) {
      console.warn("No CloudConfig provided. Adapters are null.");
      return;
    }

    if (config.databaseProvider === 'firebase') {
      this.db = new FirebaseDatabaseAdapter(config.firebaseConfig);
    } else if (config.databaseProvider === 'local_sql') {
      this.db = new LocalDatabaseAdapter(config.localServerConfig);
    }

    if (config.storageProvider === 'firebase') {
      this.storage = new FirebaseStorageAdapter(config.firebaseConfig);
    } else if (config.storageProvider === 'local_folder') {
      this.storage = new LocalFolderStorageAdapter(config.localServerConfig);
    }
    
    console.log(`[CloudManager] Reconfigured. DB: ${config.databaseProvider}, Storage: ${config.storageProvider}`);
  }
}

export const cloudManager = new CloudManager();
