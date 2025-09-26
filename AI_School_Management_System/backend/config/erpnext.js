// config/erpnext.js - ERPNext API Configuration
const axios = require('axios');

class ERPNextAPI {
  constructor() {
    // Load environment variables if .env exists
    require('dotenv').config();

    this.baseURL = process.env.ERPNEXT_URL || 'https://erpeducation.innovorex.co.in';
    this.apiKey = process.env.ERPNEXT_API_KEY || 'ae19e5af7a92ea6';
    this.apiSecret = process.env.ERPNEXT_API_SECRET || '8effd081b656b7d';
    this.timeout = 30000; // 30 seconds

    // Create axios instance with default config and connection pooling
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      maxRedirects: 5,
      maxContentLength: 50 * 1000 * 1000, // 50MB
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Connection': 'keep-alive'
      },
      // Add connection pooling
      httpAgent: new (require('http').Agent)({
        keepAlive: true,
        maxSockets: 10,
        timeout: 30000
      }),
      httpsAgent: new (require('https').Agent)({
        keepAlive: true,
        maxSockets: 10,
        timeout: 30000
      })
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        if (this.apiKey && this.apiSecret) {
          config.headers['Authorization'] = `token ${this.apiKey}:${this.apiSecret}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        console.error('ERPNext API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(this.formatError(error));
      }
    );
  }

  formatError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        status: error.response.status,
        message: error.response.data?.message || error.response.statusText,
        data: error.response.data,
        type: 'api_error'
      };
    } else if (error.request) {
      // Request made but no response received
      return {
        status: 500,
        message: 'ERPNext server not responding',
        type: 'network_error'
      };
    } else {
      // Something else happened
      return {
        status: 500,
        message: error.message || 'Unknown error occurred',
        type: 'unknown_error'
      };
    }
  }

  // Test connection to ERPNext
  async testConnection() {
    try {
      // Use a simple resource endpoint that requires authentication
      const response = await this.client.get('/api/resource/DocType?limit=1');
      return {
        success: true,
        data: response.data,
        message: 'Connected to ERPNext successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error,
        message: 'Failed to connect to ERPNext'
      };
    }
  }

  // Generic GET method
  async get(endpoint, params = {}) {
    try {
      const response = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Generic POST method
  async post(endpoint, data = {}) {
    try {
      const response = await this.client.post(endpoint, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Generic PUT method
  async put(endpoint, data = {}) {
    try {
      const response = await this.client.put(endpoint, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Generic DELETE method
  async delete(endpoint) {
    try {
      const response = await this.client.delete(endpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get list of documents
  async getList(doctype, fields = [], filters = {}, limit = null, orderBy = 'modified desc') {
    const params = {
      fields: JSON.stringify(fields),
      filters: JSON.stringify(filters),
      order_by: orderBy
    };

    // If no limit specified, use very high limit to get all data
    // ERPNext defaults to 20 if no limit is provided
    if (limit === null || limit === undefined) {
      params.limit_page_length = 9999; // Very high limit to get all data
    } else {
      params.limit_page_length = limit;
    }

    return this.get(`/api/resource/${doctype}`, params);
  }

  // Get single document
  async getDoc(doctype, name) {
    return this.get(`/api/resource/${doctype}/${name}`);
  }

  // Create document
  async createDoc(doctype, data) {
    return this.post(`/api/resource/${doctype}`, data);
  }

  // Update document
  async updateDoc(doctype, name, data) {
    return this.put(`/api/resource/${doctype}/${name}`, data);
  }

  // Delete document
  async deleteDoc(doctype, name) {
    return this.delete(`/api/resource/${doctype}/${name}`);
  }

  // Submit document (change docstatus from 0 to 1)
  async submitDoc(doctype, name) {
    // First get the latest document with all data
    const docResponse = await this.getDoc(doctype, name);

    // Use frappe.client.submit with the complete document data
    return this.callMethod('frappe.client.submit', {
      doc: JSON.stringify(docResponse.data)
    });
  }

  // Cancel document (change docstatus from 1 to 2)
  async cancelDoc(doctype, name) {
    // Use the frappe.client.cancel method which handles submitted documents properly
    return this.callMethod('frappe.client.cancel', {
      doctype: doctype,
      name: name
    });
  }

  // Execute server method
  async callMethod(method, args = {}) {
    return this.post(`/api/method/${method}`, args);
  }

  // Search functionality
  async search(doctype, searchTerm, fields = ['name']) {
    const params = {
      doctype,
      txt: searchTerm,
      searchfield: fields.join(',')
    };

    return this.get('/api/method/frappe.desk.search.search_link', params);
  }

  // Make request method (for compatibility with the frappe proxy endpoint)
  async makeRequest(method, url, data = null) {
    try {
      const config = {
        method: method.toLowerCase(),
        url: url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (this.apiKey && this.apiSecret) {
        config.headers['Authorization'] = `token ${this.apiKey}:${this.apiSecret}`;
      }

      if (data && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
        config.data = data;
      }

      const response = await this.client.request(config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ERPNextAPI;