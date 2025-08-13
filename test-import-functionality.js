const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_BASE_URL = 'http://localhost:5000';

class ImportTester {
  constructor() {
    this.authToken = null;
    this.organizationId = null;
  }

  // Login as Hudson Cannabis admin
  async login() {
    console.log('🔐 Logging in as Hudson Cannabis admin...');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: 'dan@hudsonhemp.com',
        password: 'Hudson2024!'
      });

      if (response.data.token && response.data.user) {
        this.authToken = response.data.token;
        this.organizationId = response.data.user.organizationId;
        console.log(`✅ Login successful!`);
        console.log(`   User: ${response.data.user.name} (${response.data.user.email})`);
        console.log(`   Role: ${response.data.user.role}`);
        console.log(`   Organization ID: ${this.organizationId}`);
        return true;
      } else {
        console.error('❌ Login failed:', response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ Login error:', error.response?.data || error.message);
      return false;
    }
  }

  // Get authorization headers
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };
  }

  // Test entity configurations endpoint
  async testEntityConfigs() {
    console.log('\n📋 Testing entity configurations...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/import/entity-configs`, {
        headers: this.getAuthHeaders()
      });

      console.log('✅ Entity configs retrieved successfully:');
      response.data.entityTypes.forEach(entity => {
        console.log(`   - ${entity.label} (${entity.fields.length} fields)`);
      });
      
      return response.data.entityTypes;
    } catch (error) {
      console.error('❌ Entity configs error:', error.response?.data || error.message);
      return null;
    }
  }

  // Test CSV file analysis
  async testCSVAnalysis(csvPath, entityType) {
    console.log(`\n📊 Analyzing ${path.basename(csvPath)} for entity type: ${entityType}...`);
    
    try {
      const formData = new FormData();
      formData.append('csvFile', fs.createReadStream(csvPath));
      formData.append('entityType', entityType);

      const response = await axios.post(`${API_BASE_URL}/api/import/analyze`, formData, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          ...formData.getHeaders()
        }
      });

      console.log('✅ CSV analysis successful:');
      console.log(`   File: ${response.data.data.fileName}`);
      console.log(`   Total rows: ${response.data.data.totalRows}`);
      console.log(`   Headers: ${response.data.data.headers.length}`);
      console.log(`   Mapped columns: ${response.data.data.columnMappings.filter(m => m.targetField).length}`);
      
      return response.data.data;
    } catch (error) {
      console.error('❌ CSV analysis error:', error.response?.data || error.message);
      return null;
    }
  }

  // Test import validation
  async testImportValidation(csvData, mappings, entityType) {
    console.log(`\n✅ Validating import for ${entityType}...`);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/import/validate`, {
        csvData,
        mappings,
        entityType
      }, {
        headers: this.getAuthHeaders()
      });

      console.log('✅ Import validation results:');
      console.log(`   Valid: ${response.data.validation.valid}`);
      console.log(`   Errors: ${response.data.validation.errors.length}`);
      console.log(`   Warnings: ${response.data.validation.warnings.length}`);
      console.log(`   Duplicates: ${response.data.duplicates.length}`);
      console.log(`   Conflicts: ${response.data.conflicts.length}`);
      console.log(`   Can proceed: ${response.data.canProceed}`);

      if (response.data.validation.errors.length > 0) {
        console.log('   Validation errors:');
        response.data.validation.errors.forEach(error => console.log(`     - ${error}`));
      }

      if (response.data.validation.warnings.length > 0) {
        console.log('   Validation warnings:');
        response.data.validation.warnings.forEach(warning => console.log(`     - ${warning}`));
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Import validation error:', error.response?.data || error.message);
      return null;
    }
  }

  // Test import execution
  async testImportExecution(csvData, mappings, entityType) {
    console.log(`\n🚀 Executing import for ${entityType}...`);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/import/execute`, {
        csvData,
        mappings,
        entityType
      }, {
        headers: this.getAuthHeaders()
      });

      console.log('✅ Import execution results:');
      console.log(`   Success: ${response.data.success}`);
      console.log(`   Imported: ${response.data.importedCount} records`);
      console.log(`   Skipped: ${response.data.skippedCount} records`);
      console.log(`   Errors: ${response.data.errors.length}`);
      console.log(`   Duplicates: ${response.data.duplicates.length}`);
      console.log(`   Import ID: ${response.data.importId}`);

      if (response.data.errors.length > 0) {
        console.log('   Import errors:');
        response.data.errors.slice(0, 5).forEach(error => console.log(`     - ${error}`));
        if (response.data.errors.length > 5) {
          console.log(`     ... and ${response.data.errors.length - 5} more errors`);
        }
      }

      if (response.data.duplicates.length > 0) {
        console.log('   Import duplicates:');
        response.data.duplicates.slice(0, 3).forEach(duplicate => console.log(`     - ${duplicate}`));
        if (response.data.duplicates.length > 3) {
          console.log(`     ... and ${response.data.duplicates.length - 3} more duplicates`);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Import execution error:', error.response?.data || error.message);
      return null;
    }
  }

  // Test import history
  async testImportHistory() {
    console.log('\n📚 Testing import history...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/import/history`, {
        headers: this.getAuthHeaders()
      });

      console.log('✅ Import history retrieved:');
      console.log(`   Total imports: ${response.data.imports.length}`);
      
      response.data.imports.forEach(importRecord => {
        console.log(`   - ${importRecord.entityType}: ${importRecord.status} (${importRecord.importedCount} imported, ${importRecord.skippedCount} skipped)`);
      });
      
      return response.data.imports;
    } catch (error) {
      console.error('❌ Import history error:', error.response?.data || error.message);
      return null;
    }
  }

  // Test full import workflow for a specific CSV file
  async testFullImportWorkflow(csvPath, entityType) {
    console.log(`\n🔄 Testing full import workflow for ${path.basename(csvPath)} (${entityType})`);
    console.log('='.repeat(80));

    // Step 1: Analyze CSV
    const analysisResult = await this.testCSVAnalysis(csvPath, entityType);
    if (!analysisResult) return false;

    // Step 2: Validate import
    const validationResult = await this.testImportValidation(
      analysisResult.preview,
      analysisResult.columnMappings,
      entityType
    );
    if (!validationResult) return false;

    // Step 3: Execute import (only if validation passes)
    if (validationResult.canProceed) {
      const executionResult = await this.testImportExecution(
        analysisResult.preview, // Using preview data for testing (first 10 rows)
        analysisResult.columnMappings,
        entityType
      );
      return executionResult !== null;
    } else {
      console.log('⚠️  Import validation failed, skipping execution');
      return false;
    }
  }

  // Test organization isolation by checking if data is only accessible to the current organization
  async testOrganizationIsolation() {
    console.log('\n🔒 Testing organization isolation...');
    
    try {
      // Test accessing assets - should only see Hudson Cannabis assets
      const assetsResponse = await axios.get(`${API_BASE_URL}/api/assets`, {
        headers: this.getAuthHeaders()
      });

      console.log('✅ Organization isolation test:');
      console.log(`   Accessible assets: ${assetsResponse.data.length}`);
      
      // Check that all assets belong to our organization
      const foreignAssets = assetsResponse.data.filter(asset => asset.organizationId !== this.organizationId);
      if (foreignAssets.length === 0) {
        console.log('   ✅ All assets belong to the current organization');
      } else {
        console.log(`   ❌ Found ${foreignAssets.length} assets from other organizations!`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Organization isolation test error:', error.response?.data || error.message);
      return false;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🧪 HUDSON CANNABIS CMMS IMPORT FUNCTIONALITY TEST');
    console.log('='.repeat(80));

    // Step 1: Login
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ Test suite failed - could not login');
      return;
    }

    // Step 2: Test entity configurations
    const entityConfigs = await this.testEntityConfigs();
    if (!entityConfigs) {
      console.log('❌ Test suite failed - could not get entity configurations');
      return;
    }

    // Step 3: Test full import workflow for each CSV file
    const testFiles = [
      { path: '/home/daniel-crawford/Projects/CMMS/CSV/Locations.csv', entityType: 'locations' },
      { path: '/home/daniel-crawford/Projects/CMMS/CSV/Assets.csv', entityType: 'assets' },
      { path: '/home/daniel-crawford/Projects/CMMS/CSV/Parts.csv', entityType: 'parts' }
    ];

    let successCount = 0;
    for (const { path: csvPath, entityType } of testFiles) {
      if (fs.existsSync(csvPath)) {
        const success = await this.testFullImportWorkflow(csvPath, entityType);
        if (success) successCount++;
      } else {
        console.log(`⚠️  CSV file not found: ${csvPath}`);
      }
    }

    // Step 4: Test import history
    await this.testImportHistory();

    // Step 5: Test organization isolation
    const isolationSuccess = await this.testOrganizationIsolation();

    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Login: ${loginSuccess ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Entity Configs: ${entityConfigs ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Import Workflows: ${successCount}/${testFiles.length} PASSED`);
    console.log(`✅ Organization Isolation: ${isolationSuccess ? 'PASSED' : 'FAILED'}`);

    if (loginSuccess && entityConfigs && successCount > 0 && isolationSuccess) {
      console.log('\n🎉 OVERALL RESULT: TESTS PASSED');
    } else {
      console.log('\n❌ OVERALL RESULT: SOME TESTS FAILED');
    }
  }
}

// Run the tests
const tester = new ImportTester();
tester.runAllTests().catch(console.error);