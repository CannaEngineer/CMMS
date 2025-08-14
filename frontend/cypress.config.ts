import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    experimentalStudio: true,
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
      
      // Task for seeding test data
      on('task', {
        seedTestData() {
          // This would seed the test database with known data
          return null;
        },
        
        clearTestData() {
          // This would clear test data
          return null;
        },
        
        log(message) {
          console.log(message);
          return null;
        },
      });
      
      // Environment-specific configuration
      if (config.env.environment === 'test') {
        config.baseUrl = 'http://localhost:5173';
      } else if (config.env.environment === 'staging') {
        config.baseUrl = 'https://staging.cmms.example.com';
      }
      
      return config;
    },
    
    env: {
      environment: 'test',
      apiUrl: 'http://localhost:3001/api',
      testUser: {
        email: 'test.technician@company.com',
        password: 'testpassword123',
        name: 'Test Technician',
        role: 'TECHNICIAN'
      },
      testAdmin: {
        email: 'test.admin@company.com',
        password: 'adminpassword123',
        name: 'Test Admin',
        role: 'ADMIN'
      }
    }
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    setupNodeEvents(on, config) {
      // component testing setup
    },
  },
});