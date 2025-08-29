import '../runtime-config';
import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const getEnvInfo = async (req: Request, res: Response) => {
  try {
    // Check environment variables without exposing sensitive values
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      VERCEL: !!process.env.VERCEL,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      LIBSQL_URL: process.env.LIBSQL_URL ? 'SET' : 'NOT SET',
      LIBSQL_AUTH_TOKEN: process.env.LIBSQL_AUTH_TOKEN ? 'SET' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      IP_HASH_SALT: process.env.IP_HASH_SALT ? 'SET' : 'NOT SET',
      // Show first few chars of LIBSQL_URL for debugging (if set)
      LIBSQL_URL_PREVIEW: process.env.LIBSQL_URL ? process.env.LIBSQL_URL.substring(0, 20) + '...' : 'NOT SET'
    };

    res.json({
      status: 'env_check',
      environment: envCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

export const getDbInfo = async (req: Request, res: Response) => {
  try {
    // Test connection
    const userCount = await prisma.user.count();
    
    // Get connection info (safe version)
    const dbUrl = process.env.DATABASE_URL || 'not set';
    const urlType = dbUrl.includes('prisma://') ? 'DATA_PROXY' : 
                    dbUrl.includes('postgres://') ? 'DIRECT' : 
                    dbUrl.includes('postgresql://') ? 'DIRECT' : 'UNKNOWN';
    
    res.json({
      status: 'connected',
      userCount,
      connectionType: urlType,
      runtime: process.env.VERCEL_ENV || 'local',
      nodeVersion: process.version,
      // Don't expose actual URL for security
      dbConfigured: !!process.env.DATABASE_URL,
      isVercel: !!process.env.VERCEL,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      // Check if it's trying to connect to proxy
      isProxyError: error.message.includes('db.prisma.io'),
      hint: error.message.includes('db.prisma.io') 
        ? 'DATABASE_URL is pointing to Prisma Data Proxy. Update to use POSTGRES_PRISMA_URL' 
        : 'Check database configuration'
    });
  }
};