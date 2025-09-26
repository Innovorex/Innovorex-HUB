#!/usr/bin/env node

/**
 * ERPNext Continuous Sync Service
 * Automatically syncs data from ERPNext at regular intervals
 */

const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
dotenv.config({ path: '.env' });

// Configuration
const CONFIG = {
  SYNC_INTERVAL: 60000, // Sync every 1 minute (60000ms)
  RETRY_INTERVAL: 30000, // Retry after 30 seconds on failure
  MAX_RETRIES: 3,
  CACHE_DIR: path.join(__dirname, 'cache', 'erpnext'),
  LOG_FILE: path.join(__dirname, 'logs', 'erpnext-sync.log'),
  ERPNEXT_URL: process.env.ERPNEXT_URL || 'https://erpeducation.innovorex.co.in',
  API_KEY: process.env.ERPNEXT_API_KEY,
  API_SECRET: process.env.ERPNEXT_API_SECRET
};

// DocTypes to sync
const DOCTYPES_TO_SYNC = [
  // Student Management
  'Student',
  'Student Applicant',
  'Student Admission',
  'Student Batch Name',
  'Student Category',
  'Guardian',
  'Student Log',
  'Student Group',

  // Academic Setup
  'Academic Year',
  'Academic Term',
  'Room',
  'Instructor',

  // Programs & Courses
  'Program',
  'Course',
  'Program Enrollment',
  'Course Enrollment',
  'Course Schedule',

  // Assessment
  'Assessment Plan',
  'Assessment Group',
  'Assessment Result',
  'Assessment Criteria',
  'Grading Scale',

  // Fees
  'Fee Category',
  'Fee Structure',
  'Fee Schedule',
  'Fees',
  'Sales Invoice',
  'Payment Entry',

  // Attendance
  'Student Attendance',
  'Student Leave Application',

  // Employee/Instructor Attendance (HR Module)
  'Employee Checkin',
  'Attendance',

  // Payroll (HR Module)
  'Salary Slip',
  'Payroll Entry'
];

class ERPNextSyncService {
  constructor() {
    this.isRunning = false;
    this.syncStats = {
      lastSync: null,
      successCount: 0,
      errorCount: 0,
      totalRecords: 0
    };
    this.authHeader = null;
  }

  async init() {
    console.log('🚀 ERPNext Sync Service Starting...');
    console.log(`📍 ERPNext URL: ${CONFIG.ERPNEXT_URL}`);
    console.log(`⏰ Sync Interval: ${CONFIG.SYNC_INTERVAL / 1000} seconds`);
    console.log(`📦 DocTypes to sync: ${DOCTYPES_TO_SYNC.length}`);

    // Create cache directory if it doesn't exist
    await this.ensureDirectory(CONFIG.CACHE_DIR);
    await this.ensureDirectory(path.dirname(CONFIG.LOG_FILE));

    // Setup authentication
    this.setupAuth();

    // Test connection
    const connected = await this.testConnection();
    if (!connected) {
      console.error('❌ Failed to connect to ERPNext. Will retry...');
    }

    return connected;
  }

  setupAuth() {
    if (CONFIG.API_KEY && CONFIG.API_SECRET) {
      const authString = Buffer.from(`${CONFIG.API_KEY}:${CONFIG.API_SECRET}`).toString('base64');
      this.authHeader = `Basic ${authString}`;
    }
  }

  async ensureDirectory(dir) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Failed to create directory ${dir}:`, error.message);
    }
  }

  async testConnection() {
    try {
      const response = await axios.get(`${CONFIG.ERPNEXT_URL}/api/method/frappe.ping`, {
        headers: {
          'Authorization': this.authHeader,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.message === 'pong') {
        console.log('✅ ERPNext connection successful');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Connection test failed:', error.message);
      return false;
    }
  }

  async syncDocType(doctype) {
    try {
      console.log(`  📥 Syncing ${doctype}...`);

      const url = `${CONFIG.ERPNEXT_URL}/api/resource/${encodeURIComponent(doctype)}`;
      const response = await axios.get(url, {
        headers: {
          'Authorization': this.authHeader,
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      let data = [];
      if (response.data && response.data.data) {
        data = response.data.data;
      }

      // For certain doctypes, fetch full details if only names are returned
      if (data.length > 0 && Object.keys(data[0]).length <= 2) {
        const needsFullDetails = [
          'Academic Year', 'Academic Term', 'Room', 'Instructor',
          'Student Batch Name', 'Guardian', 'Student Category',
          'Student Attendance', 'Student Leave Application',
          'Assessment Plan', 'Assessment Group', 'Assessment Result',
          'Assessment Criteria', 'Grading Scale',
          'Fee Category', 'Fee Structure', 'Fee Schedule',
          'Employee Checkin', 'Attendance',
          'Salary Slip', 'Payroll Entry'
        ].includes(doctype);

        if (needsFullDetails) {
          console.log(`    🔍 Fetching full details for ${data.length} records...`);
          const fullData = [];

          for (const item of data.slice(0, 100)) { // Limit to 100 records
            try {
              const detailUrl = `${CONFIG.ERPNEXT_URL}/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(item.name)}`;
              const detailResponse = await axios.get(detailUrl, {
                headers: {
                  'Authorization': this.authHeader,
                  'Accept': 'application/json'
                },
                timeout: 10000
              });

              if (detailResponse.data && detailResponse.data.data) {
                fullData.push(detailResponse.data.data);
              }
            } catch (err) {
              // Keep basic record if detail fetch fails
              fullData.push(item);
            }
          }

          data = fullData;
        }
      }

      // Cache the data
      const cacheFile = path.join(CONFIG.CACHE_DIR, `${doctype.replace(/\s+/g, '_')}.json`);
      await fs.writeFile(cacheFile, JSON.stringify({
        doctype,
        timestamp: new Date().toISOString(),
        count: data.length,
        data
      }, null, 2));

      console.log(`    ✅ Synced ${data.length} ${doctype} records`);
      this.syncStats.totalRecords += data.length;

      return { success: true, count: data.length };

    } catch (error) {
      console.error(`    ❌ Failed to sync ${doctype}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async performSync() {
    if (this.isRunning) {
      console.log('⚠️  Sync already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    console.log('\n' + '='.repeat(50));
    console.log(`🔄 Starting ERPNext sync at ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));

    let successCount = 0;
    let errorCount = 0;

    // Test connection first
    const connected = await this.testConnection();
    if (!connected) {
      console.error('❌ ERPNext is not reachable. Skipping sync.');
      this.isRunning = false;
      this.syncStats.errorCount++;
      return;
    }

    // Sync each doctype
    for (const doctype of DOCTYPES_TO_SYNC) {
      const result = await this.syncDocType(doctype);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }

      // Add small delay between requests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Update stats
    this.syncStats.lastSync = new Date().toISOString();
    this.syncStats.successCount += successCount;
    this.syncStats.errorCount += errorCount;

    // Log results
    const logMessage = `
📊 Sync Summary:
  ✅ Successful: ${successCount}/${DOCTYPES_TO_SYNC.length} doctypes
  ❌ Failed: ${errorCount}/${DOCTYPES_TO_SYNC.length} doctypes
  📦 Total Records: ${this.syncStats.totalRecords}
  ⏱️  Duration: ${duration} seconds
  🕐 Next sync in: ${CONFIG.SYNC_INTERVAL / 1000} seconds
`;

    console.log(logMessage);
    await this.writeLog(logMessage);

    this.isRunning = false;
  }

  async writeLog(message) {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${message}\n`;
      await fs.appendFile(CONFIG.LOG_FILE, logEntry);
    } catch (error) {
      console.error('Failed to write log:', error.message);
    }
  }

  async getCachedData(doctype) {
    try {
      const cacheFile = path.join(CONFIG.CACHE_DIR, `${doctype.replace(/\s+/g, '_')}.json`);
      const data = await fs.readFile(cacheFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  start() {
    console.log('🎯 Starting continuous sync service...\n');

    // Perform initial sync
    this.performSync();

    // Schedule regular syncs
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, CONFIG.SYNC_INTERVAL);

    // Handle graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  stop() {
    console.log('\n🛑 Stopping ERPNext sync service...');

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    console.log('📊 Final Statistics:');
    console.log(`  Last Sync: ${this.syncStats.lastSync}`);
    console.log(`  Successful Syncs: ${this.syncStats.successCount}`);
    console.log(`  Failed Syncs: ${this.syncStats.errorCount}`);
    console.log(`  Total Records Synced: ${this.syncStats.totalRecords}`);

    process.exit(0);
  }

  // API endpoint for getting sync status
  getStatus() {
    return {
      isRunning: this.isRunning,
      stats: this.syncStats,
      config: {
        syncInterval: CONFIG.SYNC_INTERVAL,
        erpnextUrl: CONFIG.ERPNEXT_URL,
        doctypesCount: DOCTYPES_TO_SYNC.length
      }
    };
  }
}

// Main execution
async function main() {
  const syncService = new ERPNextSyncService();

  const initialized = await syncService.init();

  if (!initialized) {
    console.log('⏳ Waiting 30 seconds before retry...');
    setTimeout(() => {
      main(); // Retry initialization
    }, 30000);
    return;
  }

  // Start the sync service
  syncService.start();

  // Optional: Create a simple HTTP endpoint to check status
  const express = require('express');
  const app = express();
  const PORT = 7777;

  app.get('/status', (req, res) => {
    res.json(syncService.getStatus());
  });

  app.get('/cache/:doctype', async (req, res) => {
    const data = await syncService.getCachedData(req.params.doctype);
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ error: 'No cached data found' });
    }
  });

  app.listen(PORT, () => {
    console.log(`📡 Sync status API available at http://localhost:${PORT}/status`);
  });
}

// Start the service
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ERPNextSyncService;