#!/usr/bin/env node

/**
 * Knowledge Base Management Utility
 * This script helps manage the MongoDB knowledge base
 */

const { exec } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const BASE_URL = 'http://localhost:3000';

// Color codes for better console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function showMenu() {
  console.log('\n' + '='.repeat(50));
  log('📚 Knowledge Base Management Tool', 'blue');
  console.log('='.repeat(50));
  console.log('1. Initialize Knowledge Base (Seed from JSON)');
  console.log('2. Get Services Data');
  console.log('3. Get Complaint Types');
  console.log('4. Get Complaint Process');
  console.log('5. Search Knowledge Base');
  console.log('6. Test Chat API');
  console.log('7. Exit');
  console.log('='.repeat(50));
}

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    let curlCommand = `curl -s -X ${method} "${url}"`;
    
    if (method === 'POST' && data) {
      curlCommand += ` -H "Content-Type: application/json" -d '${JSON.stringify(data)}'`;
    }
    
    exec(curlCommand, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (parseError) {
        reject(new Error(`Failed to parse response: ${stdout}`));
      }
    });
  });
}

async function initializeKnowledgeBase() {
  try {
    log('🔄 Initializing knowledge base...', 'yellow');
    const result = await makeRequest(`${BASE_URL}/api/knowledge/init`, 'POST');
    
    if (result.success) {
      log('✅ Knowledge base initialized successfully!', 'green');
      console.log('Generated IDs:', result.ids);
    } else {
      log('❌ Failed to initialize knowledge base', 'red');
      console.log('Error:', result.error);
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
}

async function getServicesData() {
  try {
    log('🔄 Fetching services data...', 'yellow');
    const result = await makeRequest(`${BASE_URL}/api/knowledge?type=services`);
    
    if (result.success) {
      log('✅ Services data retrieved successfully!', 'green');
      console.log(`Found ${result.data.length} services`);
      
      // Show first few services as sample
      result.data.slice(0, 3).forEach((service, index) => {
        console.log(`${index + 1}. ${service.service_name} (Category: ${service.category})`);
      });
      
      if (result.data.length > 3) {
        console.log(`... and ${result.data.length - 3} more services`);
      }
    } else {
      log('❌ Failed to get services data', 'red');
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
}

async function getComplaintTypes() {
  try {
    log('🔄 Fetching complaint types...', 'yellow');
    const result = await makeRequest(`${BASE_URL}/api/knowledge?type=complaint_types`);
    
    if (result.success) {
      log('✅ Complaint types retrieved successfully!', 'green');
      console.log('Available complaint categories:');
      
      Object.keys(result.data).forEach(category => {
        console.log(`📋 ${category}: ${result.data[category].length} subtypes`);
      });
    } else {
      log('❌ Failed to get complaint types', 'red');
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
}

async function getComplaintProcess() {
  try {
    log('🔄 Fetching complaint process...', 'yellow');
    const result = await makeRequest(`${BASE_URL}/api/knowledge?type=complaint_process`);
    
    if (result.success) {
      log('✅ Complaint process retrieved successfully!', 'green');
      console.log('Process steps:', result.data.length);
    } else {
      log('❌ Failed to get complaint process', 'red');
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
}

async function searchKnowledgeBase() {
  rl.question('Enter search query: ', async (query) => {
    try {
      log(`🔍 Searching for: "${query}"...`, 'yellow');
      const result = await makeRequest(`${BASE_URL}/api/knowledge?query=${encodeURIComponent(query)}`);
      
      if (result.success) {
        log(`✅ Found ${result.results.length} results!`, 'green');
        
        result.results.forEach((item, index) => {
          console.log(`\n${index + 1}. ${item.service_name || item.type || 'Unknown'}`);
          if (item.category) console.log(`   Category: ${item.category}`);
          if (item.description) console.log(`   Description: ${item.description.substring(0, 100)}...`);
        });
      } else {
        log('❌ Search failed', 'red');
      }
    } catch (error) {
      log(`❌ Error: ${error.message}`, 'red');
    }
    
    showMenuAndWait();
  });
}

async function testChatAPI() {
  rl.question('Enter message to test: ', async (message) => {
    try {
      log(`💬 Testing chat with: "${message}"...`, 'yellow');
      const result = await makeRequest(`${BASE_URL}/api/chat`, 'POST', {
        message: message,
        sessionId: `test_${Date.now()}`
      });
      
      if (result.response) {
        log('✅ Chat API response:', 'green');
        console.log(result.response);
      } else {
        log('❌ Chat API failed', 'red');
        console.log('Error:', result.error);
      }
    } catch (error) {
      log(`❌ Error: ${error.message}`, 'red');
    }
    
    showMenuAndWait();
  });
}

function showMenuAndWait() {
  showMenu();
  rl.question('\nSelect an option (1-7): ', handleMenuChoice);
}

async function handleMenuChoice(choice) {
  switch (choice.trim()) {
    case '1':
      await initializeKnowledgeBase();
      showMenuAndWait();
      break;
    case '2':
      await getServicesData();
      showMenuAndWait();
      break;
    case '3':
      await getComplaintTypes();
      showMenuAndWait();
      break;
    case '4':
      await getComplaintProcess();
      showMenuAndWait();
      break;
    case '5':
      await searchKnowledgeBase();
      break;
    case '6':
      await testChatAPI();
      break;
    case '7':
      log('👋 Goodbye!', 'blue');
      rl.close();
      process.exit(0);
      break;
    default:
      log('❌ Invalid option. Please select 1-7.', 'red');
      showMenuAndWait();
      break;
  }
}

// Start the application
log('🚀 Starting Knowledge Base Management Tool...', 'blue');
log('Make sure your Next.js application is running on http://localhost:3000', 'yellow');

showMenuAndWait();
