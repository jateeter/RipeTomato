/**
 * End-to-End Test for HMIS OpenCommons Integration
 * 
 * This test validates that the CORS proxy can successfully access
 * HMIS OpenCommons MediaWiki API and retrieve facility data.
 * 
 * Test Requirements:
 * - Must access HMIS API through the proxy
 * - Must retrieve facility listings
 * - Must validate that there are more than 50 facilities
 * - Must validate response structure and data integrity
 */

import axios from 'axios';

describe.skip('HMIS OpenCommons End-to-End Integration', () => {
  const PROXY_BASE_URL = 'http://localhost:3000';
  const HMIS_PROXY_ENDPOINT = '/api/hmis-opencommons';
  const TEST_TIMEOUT = 30000; // 30 seconds for API calls

  beforeAll(() => {
    console.log('🧪 Starting HMIS E2E Tests');
    console.log(`📡 Testing proxy at: ${PROXY_BASE_URL}${HMIS_PROXY_ENDPOINT}`);
  });

  describe('HMIS API Connectivity', () => {
    test.skip('should successfully connect to HMIS through proxy', async () => {
      const response = await axios.get(`${PROXY_BASE_URL}${HMIS_PROXY_ENDPOINT}`, {
        params: {
          action: 'query',
          meta: 'siteinfo',
          format: 'json'
        },
        timeout: TEST_TIMEOUT
      });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      
      const data = response.data;
      expect(data).toHaveProperty('query');
      expect(data.query).toHaveProperty('general');
      expect(data.query.general).toHaveProperty('sitename');
      expect(data.query.general.sitename).toBe('hmis');
      
      console.log('✅ HMIS connectivity test passed');
    }, TEST_TIMEOUT);

    test('should have proper CORS headers', async () => {
      const response = await axios.get(`${PROXY_BASE_URL}${HMIS_PROXY_ENDPOINT}`, {
        params: {
          action: 'query',
          meta: 'siteinfo',
          format: 'json'
        },
        timeout: TEST_TIMEOUT
      });

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      
      console.log('✅ CORS headers validation passed');
    }, TEST_TIMEOUT);
  });

  describe('HMIS Facility Data Retrieval', () => {
    test('should retrieve all facility pages', async () => {
      const response = await axios.get(`${PROXY_BASE_URL}${HMIS_PROXY_ENDPOINT}`, {
        params: {
          action: 'query',
          list: 'allpages',
          aplimit: '500', // Get up to 500 pages
          format: 'json'
        },
        timeout: TEST_TIMEOUT
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('query');
      expect(response.data.query).toHaveProperty('allpages');
      expect(Array.isArray(response.data.query.allpages)).toBe(true);
      
      const pages = response.data.query.allpages;
      console.log(`📊 Retrieved ${pages.length} total pages from HMIS`);
      
      // Validate page structure
      if (pages.length > 0) {
        const firstPage = pages[0];
        expect(firstPage).toHaveProperty('pageid');
        expect(firstPage).toHaveProperty('title');
        expect(typeof firstPage.pageid).toBe('number');
        expect(typeof firstPage.title).toBe('string');
      }
      
      console.log('✅ Facility pages retrieval test passed');
    }, TEST_TIMEOUT);

    test('should identify facility-related pages', async () => {
      const response = await axios.get(`${PROXY_BASE_URL}${HMIS_PROXY_ENDPOINT}`, {
        params: {
          action: 'query',
          list: 'allpages',
          aplimit: '500',
          format: 'json'
        },
        timeout: TEST_TIMEOUT
      });

      const pages = response.data.query.allpages;
      
      // Filter pages that look like facilities
      const facilityKeywords = [
        'shelter', 'housing', 'motel', 'recovery', 'treatment', 'detox',
        'health', 'medical', 'clinic', 'hospital', 'behavioral',
        'community', 'center', 'support', 'services', 'resource'
      ];
      
      const facilityPages = pages.filter((page: any) => {
        const title = page.title.toLowerCase();
        return facilityKeywords.some(keyword => title.includes(keyword)) ||
               // Include pages that don't contain metadata keywords
               !['form:', 'category:', 'template:', 'user:', 'main page', 'special:'].some(meta => title.includes(meta));
      });
      
      console.log(`🏠 Identified ${facilityPages.length} potential facility pages`);
      console.log(`📋 Sample facility titles:`, facilityPages.slice(0, 5).map((p: any) => p.title));
      
      expect(facilityPages.length).toBeGreaterThan(0);
      console.log('✅ Facility identification test passed');
    }, TEST_TIMEOUT);

    test('should find more than 50 facilities', async () => {
      const response = await axios.get(`${PROXY_BASE_URL}${HMIS_PROXY_ENDPOINT}`, {
        params: {
          action: 'query',
          list: 'allpages',
          aplimit: '500',
          format: 'json'
        },
        timeout: TEST_TIMEOUT
      });

      const pages = response.data.query.allpages;
      
      // Filter to identify actual facilities (exclude metadata pages)
      const excludeKeywords = ['form:', 'category:', 'template:', 'user:', 'main page', 'special:', 'help:'];
      const facilityPages = pages.filter((page: any) => {
        const title = page.title.toLowerCase();
        return !excludeKeywords.some(keyword => title.includes(keyword));
      });
      
      console.log(`🎯 Found ${facilityPages.length} total facilities in HMIS OpenCommons`);
      
      // Log some example facility names
      const sampleFacilities = facilityPages.slice(0, 10).map((page: any) => page.title);
      console.log(`📋 Sample facilities:`, sampleFacilities);
      
      // Main validation: Must have more than 50 facilities
      expect(facilityPages.length).toBeGreaterThan(50);
      
      console.log(`✅ SUCCESS: Found ${facilityPages.length} facilities (> 50 required)`);
    }, TEST_TIMEOUT);
  });

  describe('HMIS Data Quality Validation', () => {
    test('should retrieve specific facility details', async () => {
      // First get list of facilities
      const listResponse = await axios.get(`${PROXY_BASE_URL}${HMIS_PROXY_ENDPOINT}`, {
        params: {
          action: 'query',
          list: 'allpages',
          aplimit: '10',
          format: 'json'
        },
        timeout: TEST_TIMEOUT
      });

      const pages = listResponse.data.query.allpages;
      expect(pages.length).toBeGreaterThan(0);
      
      // Get details for first facility
      const firstFacility = pages[0];
      const detailResponse = await axios.get(`${PROXY_BASE_URL}${HMIS_PROXY_ENDPOINT}`, {
        params: {
          action: 'query',
          prop: 'revisions',
          rvprop: 'content',
          titles: firstFacility.title,
          format: 'json'
        },
        timeout: TEST_TIMEOUT
      });

      expect(detailResponse.status).toBe(200);
      expect(detailResponse.data).toHaveProperty('query');
      expect(detailResponse.data.query).toHaveProperty('pages');
      
      const pageDetails = Object.values(detailResponse.data.query.pages)[0] as any;
      expect(pageDetails).toHaveProperty('pageid');
      expect(pageDetails).toHaveProperty('title');
      
      console.log(`✅ Successfully retrieved details for facility: ${firstFacility.title}`);
    }, TEST_TIMEOUT);

    test('should handle API errors gracefully', async () => {
      // Test with invalid parameters
      const response = await axios.get(`${PROXY_BASE_URL}${HMIS_PROXY_ENDPOINT}`, {
        params: {
          action: 'invalid_action',
          format: 'json'
        },
        timeout: TEST_TIMEOUT
      });

      expect(response.status).toBe(200);
      // MediaWiki should return an error structure for invalid actions
      expect(response.data).toHaveProperty('error');
      
      console.log('✅ Error handling test passed');
    }, TEST_TIMEOUT);
  });

  describe('Performance and Reliability', () => {
    test('should respond within reasonable time limits', async () => {
      const startTime = Date.now();
      
      const response = await axios.get(`${PROXY_BASE_URL}${HMIS_PROXY_ENDPOINT}`, {
        params: {
          action: 'query',
          list: 'allpages',
          aplimit: '100',
          format: 'json'
        },
        timeout: TEST_TIMEOUT
      });

      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(15000); // Should respond within 15 seconds
      
      console.log(`⚡ Response time: ${responseTime}ms`);
      console.log('✅ Performance test passed');
    }, TEST_TIMEOUT);

    test('should be consistent across multiple requests', async () => {
      const requests = Array(3).fill(null).map(() => 
        axios.get(`${PROXY_BASE_URL}${HMIS_PROXY_ENDPOINT}`, {
          params: {
            action: 'query',
            meta: 'siteinfo',
            format: 'json'
          },
          timeout: TEST_TIMEOUT
        })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.query.general.sitename).toBe('hmis');
      });
      
      console.log('✅ Consistency test passed - all requests returned same result');
    }, TEST_TIMEOUT);
  });

  afterAll(() => {
    console.log('🏁 HMIS E2E Tests completed');
  });
});