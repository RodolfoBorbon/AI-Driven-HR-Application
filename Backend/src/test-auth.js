import axios from 'axios';
import dotenv from 'dotenv';
import { loadEnv } from './config/env.js';

// Load environment variables
dotenv.config();
loadEnv();

const API_URL = 'http://localhost:3000/api';
const TEST_USER = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'Test1234!'
};

async function testAuthFlow() {
  console.log('\n🔍 TESTING AUTHENTICATION FLOW');
  console.log('============================');
  
  try {
    // Step 1: Check JWT configuration
    console.log('\n📋 JWT Configuration Check:');
    console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`JWT_EXPIRY: ${process.env.JWT_EXPIRY ? '✅ Set' : '❌ Missing'}`);
    
    // Step 2: Try to register a test user
    console.log('\n📋 Step 1: Register Test User');
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, TEST_USER);
      console.log('✅ Registration successful:', registerResponse.data);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message === 'User already exists') {
        console.log('ℹ️ Test user already exists, continuing with login test');
      } else {
        console.error('❌ Registration error:', error.response?.data || error.message);
      }
    }
    
    // Step 3: Try to login
    console.log('\n📋 Step 2: Login Test User');
    let token;
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: TEST_USER.email,
        password: TEST_USER.password
      });
      
      token = loginResponse.data.token;
      console.log('✅ Login successful');
      console.log('📄 Response data:', loginResponse.data);
      
      if (!token) {
        console.error('❌ No token received in login response!');
      } else {
        console.log('🔑 Token received:', token.substring(0, 15) + '...');
      }
    } catch (error) {
      console.error('❌ Login error:', error.response?.data || error.message);
      return;
    }
    
    // Step 4: Test /auth/me endpoint with the token
    if (token) {
      console.log('\n📋 Step 3: Get Current User Test');
      try {
        const userResponse = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('✅ Get current user successful:');
        console.log('📄 User data:', userResponse.data);
      } catch (error) {
        console.error('❌ Get current user error:', error.response?.data || error.message);
        
        // Additional debugging for token verification
        console.log('\n🔍 Debugging token verification:');
        try {
          const jwt = await import('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          console.log('✅ Token verification successful:', decoded);
        } catch (jwtError) {
          console.error('❌ Token verification failed:', jwtError.message);
        }
      }
    }
    
    console.log('\n============================');
    console.log('🏁 Authentication Test Complete');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testAuthFlow();
