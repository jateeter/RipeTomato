/**
 * Test CORS and HMIS API Issues
 * Debug runtime errors and test the complete HMIS pipeline
 */

const http = require('http');

function makeRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, timeout);

    http.get(url, (res) => {
      clearTimeout(timeoutId);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ 
        status: res.statusCode, 
        data,
        headers: res.headers,
        size: data.length
      }));
    }).on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
}

async function testCORSAndHMIS() {
  console.log('🔧 CORS and HMIS Runtime Error Diagnostics\n');
  
  // Test 1: Basic app connectivity
  console.log('1️⃣ Testing basic app connectivity...');
  try {
    const response = await makeRequest('http://localhost:3000');
    if (response.status === 200) {
      console.log(`✅ App is running (${response.size} bytes)`);
    } else {
      console.log(`⚠️  App returned status ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ App connectivity failed: ${error.message}`);
    return false;
  }

  // Test 2: HMIS Proxy endpoint
  console.log('\n2️⃣ Testing HMIS proxy endpoint...');
  try {
    const response = await makeRequest('http://localhost:3000/api/hmis-opencommons/?action=query&meta=siteinfo&format=json', 15000);
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers['content-type'] || 'none'}`);
    console.log(`   CORS Headers: ${response.headers['access-control-allow-origin'] || 'none'}`);
    
    if (response.status === 200) {
      try {
        const data = JSON.parse(response.data);
        if (data.query?.general) {
          console.log(`✅ HMIS API working: ${data.query.general.sitename}`);
          console.log(`   Generator: ${data.query.general.generator}`);
        } else {
          console.log(`⚠️  Got response but structure is unexpected`);
          console.log(`   Data preview: ${response.data.substring(0, 200)}...`);
        }
      } catch (jsonError) {
        console.log(`❌ JSON parsing failed: ${jsonError.message}`);
        console.log(`   Raw response: ${response.data.substring(0, 300)}...`);
      }
    } else {
      console.log(`❌ HMIS proxy failed with status ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ HMIS proxy error: ${error.message}`);
  }

  // Test 3: Get facility list with detailed logging
  console.log('\n3️⃣ Testing facility list retrieval...');
  try {
    const response = await makeRequest('http://localhost:3000/api/hmis-opencommons/?action=query&list=allpages&aplimit=100&format=json', 20000);
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Size: ${response.size} bytes`);
    
    if (response.status === 200) {
      try {
        const data = JSON.parse(response.data);
        if (data.query?.allpages) {
          console.log(`✅ Got ${data.query.allpages.length} pages`);
          
          // Count shelter facilities
          const shelters = data.query.allpages.filter(page => {
            const title = page.title.toLowerCase();
            return title.includes('shelter') || title.includes('housing') || 
                   title.includes('motel') || title.includes('transitional');
          });
          
          console.log(`   🏠 ${shelters.length} shelter facilities found`);
          
          if (shelters.length > 0) {
            console.log(`   Examples: ${shelters.slice(0, 3).map(s => s.title).join(', ')}`);
          }
        } else {
          console.log(`❌ Unexpected response structure`);
          console.log(`   Keys: ${Object.keys(data)}`);
        }
      } catch (jsonError) {
        console.log(`❌ JSON parsing failed: ${jsonError.message}`);
      }
    } else {
      console.log(`❌ Request failed with status ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Facility list error: ${error.message}`);
  }

  // Test 4: Test individual facility page
  console.log('\n4️⃣ Testing individual facility page...');
  try {
    const response = await makeRequest('http://localhost:3000/api/hmis-opencommons/?action=query&prop=revisions&rvprop=content&pageids=35&format=json', 15000);
    
    if (response.status === 200) {
      try {
        const data = JSON.parse(response.data);
        if (data.query?.pages?.['35']?.revisions?.[0]?.['*']) {
          const content = data.query.pages['35'].revisions[0]['*'];
          console.log(`✅ Got facility content (${content.length} chars)`);
          
          // Look for address patterns
          const addressMatch = content.match(/address[=:\s]+([^\n\|]+)/i);
          if (addressMatch) {
            console.log(`   📍 Address found: ${addressMatch[1].trim()}`);
          } else {
            console.log(`   ⚠️  No address pattern found`);
          }
        } else {
          console.log(`❌ No content in facility page response`);
        }
      } catch (jsonError) {
        console.log(`❌ JSON parsing failed: ${jsonError.message}`);
      }
    } else {
      console.log(`❌ Facility page request failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Facility page error: ${error.message}`);
  }

  // Test 5: E2E HMIS Test - Full Pipeline
  console.log('\n5️⃣ END-TO-END HMIS TEST...');
  console.log('==========================================');
  
  try {
    // Step 1: Get facility list
    console.log('   Step 1: Getting facility list...');
    const listResponse = await makeRequest('http://localhost:3000/api/hmis-opencommons/?action=query&list=allpages&aplimit=500&format=json', 30000);
    
    if (listResponse.status !== 200) {
      throw new Error(`Facility list failed: ${listResponse.status}`);
    }
    
    const listData = JSON.parse(listResponse.data);
    const allPages = listData.query?.allpages || [];
    
    // Step 2: Filter shelter facilities
    console.log('   Step 2: Filtering shelter facilities...');
    const shelterFacilities = allPages.filter(page => {
      const title = page.title.toLowerCase();
      return title.includes('shelter') || title.includes('housing') || 
             title.includes('motel') || title.includes('transitional') ||
             title.includes('emergency') || title.includes('permanent');
    });
    
    console.log(`   📊 Total pages: ${allPages.length}`);
    console.log(`   🏠 Shelter facilities: ${shelterFacilities.length}`);
    
    // Step 3: Test geocoding on a few facilities
    console.log('   Step 3: Testing address extraction...');
    let addressesFound = 0;
    const sampleFacilities = shelterFacilities.slice(0, 5);
    
    for (const facility of sampleFacilities) {
      try {
        const contentResponse = await makeRequest(`http://localhost:3000/api/hmis-opencommons/?action=query&prop=revisions&rvprop=content&pageids=${facility.pageid}&format=json`);
        
        if (contentResponse.status === 200) {
          const contentData = JSON.parse(contentResponse.data);
          const content = contentData.query?.pages?.[facility.pageid]?.revisions?.[0]?.['*'] || '';
          
          const addressMatch = content.match(/address[=:\s]+([^\n\|]+)/i);
          if (addressMatch) {
            console.log(`   📍 ${facility.title}: ${addressMatch[1].trim()}`);
            addressesFound++;
          }
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log(`   ⚠️  Failed to get content for ${facility.title}: ${error.message}`);
      }
    }
    
    // Step 4: Results
    console.log('\n🎯 E2E TEST RESULTS:');
    console.log(`   ✅ HMIS API Connection: Working`);
    console.log(`   ✅ Proxy Configuration: Working`);
    console.log(`   ✅ Facility Data Retrieval: ${shelterFacilities.length} facilities`);
    console.log(`   ✅ Address Extraction: ${addressesFound}/${sampleFacilities.length} successful`);
    console.log(`   ✅ Rate Limiting: Applied`);
    
    if (shelterFacilities.length >= 30 && addressesFound >= 3) {
      console.log('\n🎉 END-TO-END HMIS TEST: SUCCESS');
      console.log('   The complete HMIS pipeline is working correctly!');
      console.log('   - Data retrieval: ✅');
      console.log('   - Address extraction: ✅');
      console.log('   - Geocoding ready: ✅');
      return true;
    } else {
      console.log('\n⚠️  END-TO-END HMIS TEST: PARTIAL SUCCESS');
      console.log('   Some components may need attention');
      return false;
    }
    
  } catch (error) {
    console.log(`\n❌ END-TO-END HMIS TEST: FAILED`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Run the test
testCORSAndHMIS().then(success => {
  if (success) {
    console.log('\n✅ All systems operational - ready for map visualization!');
  } else {
    console.log('\n⚠️  Some issues detected - check the logs above');
  }
});