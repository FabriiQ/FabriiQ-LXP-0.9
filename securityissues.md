# Security Issues Report

This document outlines security vulnerabilities identified in the codebase along with their impact and recommended solutions.

## Authentication and Authorization

### 1. Development Mode Authentication Bypass

**Issue:** In development mode, password checks are bypassed for all users.

```typescript
// In src/app/api/auth/[...nextauth]/route.ts
const isValidPassword = process.env.NODE_ENV === "development"
  ? true
  : await compare(credentials.password, user.password || "");
```

**Impact:** 
- High severity in development environments
- Any user can log in with any password in development mode
- Could accidentally be deployed to production

**Solution:**
- Remove the development mode bypass
- If needed for testing, create specific test accounts with known credentials
- Use environment variables to control test accounts rather than bypassing all authentication

```typescript
// Better approach
const isValidPassword = await compare(credentials.password, user.password || "");

// If test accounts are needed, use a specific check
const isTestAccount = process.env.NODE_ENV === "development" && 
                     credentials.username === process.env.TEST_USERNAME;
if (isTestAccount) {
  return true;
}
```

### 2. Insecure Error Handling in Authentication

**Issue:** Authentication errors expose too much information.

```typescript
// In src/server/api/services/auth.service.ts
logger.warn("[AUTH] User not found or inactive", { username: credentials.username });
```

**Impact:**
- Medium severity
- Potential username enumeration vulnerability
- Attackers can determine if usernames exist in the system

**Solution:**
- Use generic error messages that don't reveal whether the username or password was incorrect
- Log detailed information server-side only
- Implement rate limiting for authentication attempts

```typescript
// Generic error message to user
throw new TRPCError({
  code: "UNAUTHORIZED",
  message: "Invalid credentials",
});

// Detailed logging server-side only
logger.warn("[AUTH] Authentication failed", { 
  username: credentials.username,
  reason: "User not found or inactive",
  ip: ctx.req?.headers['x-forwarded-for'] || ctx.req?.socket.remoteAddress
});
```

### 3. Missing Rate Limiting for Authentication

**Issue:** No rate limiting for login attempts.

**Impact:**
- High severity
- Vulnerable to brute force attacks
- Could lead to account compromise

**Solution:**
- Implement rate limiting for authentication endpoints
- Use IP-based and username-based rate limiting
- Add exponential backoff for repeated failed attempts
- Consider account lockout after multiple failed attempts

```typescript
// Example implementation using the existing rate limit middleware
login: publicProcedure
  .meta({
    ...withRateLimit({ 
      limit: 5, 
      windowInSeconds: 300,
      identifierFn: (ctx) => `${ctx.req?.headers['x-forwarded-for'] || 'unknown'}_${input.username}`
    })
  })
  .input(loginSchema)
  .mutation(async ({ ctx, input }) => {
    // Login logic
  })
```

### 4. Insecure Session Management

**Issue:** Session configuration has a long duration without refresh tokens.

```typescript
// In src/app/api/auth/[...nextauth]/route.ts
session: {
  strategy: "jwt",
  maxAge: 7 * 24 * 60 * 60 // 7 days
}
```

**Impact:**
- Medium severity
- If a JWT is compromised, it remains valid for 7 days
- No way to invalidate specific sessions

**Solution:**
- Reduce session duration to a reasonable timeframe (e.g., 1 day)
- Implement refresh tokens for longer sessions
- Add session tracking in the database to enable revocation
- Consider implementing a session activity timeout

```typescript
session: {
  strategy: "jwt",
  maxAge: 24 * 60 * 60, // 1 day
  updateAge: 4 * 60 * 60, // Refresh every 4 hours
}
```

## Input Validation and Sanitization

### 5. Insufficient Input Validation in API Routes

**Issue:** Some API routes don't properly validate all input parameters.

**Impact:**
- High severity
- Potential for injection attacks
- Could lead to unexpected behavior or data corruption

**Solution:**
- Ensure all API routes use Zod schemas for input validation
- Validate all user input before processing
- Implement a middleware that enforces validation for all routes

```typescript
// Example of comprehensive input validation
const createUserSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email(),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(100),
  userType: z.enum(Object.values(UserType) as [string, ...string[]]),
  // Add validation for all other fields
});
```

### 6. Raw SQL Queries with User Input

**Issue:** Several places in the code use raw SQL queries with user input.

```typescript
// In src/server/api/services/activity.service.ts
const activitiesResult = await this.prisma.$queryRawUnsafe(dataQuery, ...queryParams);
```

**Impact:**
- Critical severity
- Potential SQL injection vulnerability
- Could lead to unauthorized data access or modification

**Solution:**
- Replace raw SQL queries with Prisma's query builder
- If raw queries are necessary, use parameterized queries
- Validate and sanitize all user input before using in queries
- Consider using an ORM abstraction layer

```typescript
// Using Prisma's query builder instead of raw SQL
const activities = await this.prisma.activity.findMany({
  where: {
    // Use structured query conditions
    classId: input.classId,
    status: input.status,
    // etc.
  },
  include: {
    subject: true,
    class: true,
    topic: true,
  },
  orderBy: {
    createdAt: 'desc'
  },
  skip: offset,
  take: pageSize
});
```

### 7. Unsafe File Uploads

**Issue:** File uploads lack proper validation and sanitization.

**Impact:**
- High severity
- Potential for malicious file uploads
- Could lead to XSS or server-side execution

**Solution:**
- Validate file types using content inspection, not just extensions
- Scan uploaded files for malware
- Store files with random names to prevent path traversal
- Set strict content security policies for uploaded content
- Implement file size limits

```typescript
// Example of improved file upload handling
async function uploadFile(file: File) {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }
  
  // Validate file type using content inspection
  const fileBuffer = await file.arrayBuffer();
  const fileType = await fileTypeFromBuffer(Buffer.from(fileBuffer));
  
  if (!ALLOWED_FILE_TYPES.includes(fileType?.mime)) {
    throw new Error('Invalid file type');
  }
  
  // Generate random filename
  const fileName = crypto.randomUUID() + path.extname(file.name);
  
  // Store file
  // ...
}
```

## Data Protection and Privacy

### 8. Insecure Handling of Sensitive Data

**Issue:** Sensitive user data is logged in plain text.

```typescript
// In src/server/api/services/auth.service.ts
logger.info('User registered successfully', { 
  userId: user.id,
  email: user.email
});
```

**Impact:**
- Medium severity
- Privacy concerns if logs are exposed
- Potential regulatory compliance issues (GDPR, etc.)

**Solution:**
- Avoid logging sensitive personal information
- Mask or hash sensitive data in logs
- Implement proper log access controls
- Create a data classification policy

```typescript
// Better logging practice
logger.info('User registered successfully', { 
  userId: user.id,
  // Don't log email or other PII
  userType: user.userType
});
```

### 9. Insecure Environment Variable Handling

**Issue:** Environment variables are accessed directly without validation.

```typescript
// In src/env.mjs and other files
DATABASE_URL: process.env.DATABASE_URL,
```

**Impact:**
- Medium severity
- Application might run with missing or invalid configuration
- Could lead to unexpected behavior or security issues

**Solution:**
- Validate all environment variables at startup
- Use a library like `@t3-oss/env-nextjs` (already in use) consistently
- Provide clear error messages for missing variables
- Document required environment variables

```typescript
// Example of proper environment variable validation
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(32),
    // Other variables
  },
  // ...
});
```

## API and Network Security

### 10. Inconsistent CORS Configuration

**Issue:** CORS headers are inconsistently applied across the application.

```typescript
// In open-canvas-main\apps\web\src\app\api\[..._path]\route.ts
function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };
}
```

**Impact:**
- Medium severity
- Overly permissive CORS policy in some routes
- Inconsistent security across the application

**Solution:**
- Implement a consistent CORS policy across all routes
- Restrict origins to specific domains
- Avoid using wildcard (*) for production environments
- Use a middleware to apply CORS headers consistently

```typescript
// Better CORS configuration
function getCorsHeaders() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  const origin = req.headers.get('origin') || '';
  
  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : process.env.PRIMARY_DOMAIN,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}
```

### 11. Missing Security Headers

**Issue:** Important security headers are not consistently set across the application.

**Impact:**
- Medium severity
- Increased vulnerability to various attacks (XSS, clickjacking, etc.)
- Reduced browser security protections

**Solution:**
- Implement a middleware to set security headers for all responses
- Use the `helmet` package or Next.js middleware
- Set appropriate Content Security Policy
- Enable other security headers (X-Frame-Options, X-Content-Type-Options, etc.)

```typescript
// Example Next.js middleware for security headers
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Set security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Set Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;"
  );
  
  return response;
}
```

## Client-Side Security

### 12. Insecure Client-Side Storage

**Issue:** Sensitive data might be stored in client-side storage without proper protection.

**Impact:**
- Medium severity
- Risk of data exposure in case of XSS attacks
- Privacy concerns for user data

**Solution:**
- Minimize sensitive data stored client-side
- Use HttpOnly cookies for authentication tokens
- Encrypt sensitive data stored in localStorage
- Implement proper session management

```typescript
// Example of secure cookie usage
cookies().set('session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 3600,
  path: '/'
});
```

### 13. Insufficient Protection Against XSS

**Issue:** Some components render user-generated content without proper sanitization.

**Impact:**
- High severity
- Vulnerable to Cross-Site Scripting (XSS) attacks
- Could lead to session hijacking or data theft

**Solution:**
- Sanitize all user-generated content before rendering
- Use libraries like DOMPurify for HTML sanitization
- Implement Content Security Policy (CSP)
- Use React's built-in XSS protection correctly

```typescript
// Example of proper content sanitization
import DOMPurify from 'dompurify';

function UserContent({ content }) {
  const sanitizedContent = DOMPurify.sanitize(content);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
}
```

## Infrastructure and Deployment

### 14. Insecure Dependency Management

**Issue:** No clear process for managing and updating dependencies with security vulnerabilities.

**Impact:**
- High severity
- Risk of using libraries with known vulnerabilities
- Potential for supply chain attacks

**Solution:**
- Implement automated dependency scanning
- Set up security alerts for vulnerable dependencies
- Regularly update dependencies
- Use lockfiles to ensure consistent dependency versions
- Consider using tools like Dependabot or Snyk

```json
// Example GitHub Dependabot configuration (.github/dependabot.yml)
{
  "version": 2,
  "updates": [
    {
      "package-ecosystem": "npm",
      "directory": "/",
      "schedule": {
        "interval": "weekly"
      },
      "allow": [
        "dependency-type": "production"
      ],
      "ignore": [
        {
          "dependency-name": "express",
          "versions": ["4.x.x"]
        }
      ]
    }
  ]
}
```

### 15. Lack of Secrets Management

**Issue:** Secrets and credentials are managed through environment variables without a proper secrets management system.

**Impact:**
- Medium severity
- Risk of secrets exposure in logs or error messages
- Difficult to rotate credentials

**Solution:**
- Use a secrets management service (AWS Secrets Manager, HashiCorp Vault, etc.)
- Implement proper access controls for secrets
- Rotate credentials regularly
- Avoid hardcoding secrets in any form
- Consider using environment-specific secrets

```typescript
// Example of improved secrets handling
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const secretsManager = new SecretsManager({
  region: process.env.AWS_REGION
});

async function getDatabaseCredentials() {
  const response = await secretsManager.getSecretValue({
    SecretId: process.env.DB_CREDENTIALS_SECRET_ID
  });
  
  return JSON.parse(response.SecretString || '{}');
}
```

## Conclusion

This security assessment identified 15 significant security issues across various aspects of the application. The most critical issues include:

1. Raw SQL queries with potential for SQL injection
2. Development mode authentication bypass
3. Insufficient input validation in API routes
4. Unsafe file upload handling
5. Missing rate limiting for authentication

Addressing these issues should be prioritized to improve the overall security posture of the application. Regular security assessments and code reviews should be implemented to prevent similar issues in the future.

## Recommended Next Steps

1. Implement a security fix plan prioritizing critical and high-severity issues
2. Establish secure coding guidelines for the development team
3. Set up automated security scanning in the CI/CD pipeline
4. Conduct regular security training for developers
5. Implement a vulnerability disclosure policy
