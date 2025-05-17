# Hướng Dẫn Sử Dụng AI để Code Hiệu Quả Dự Án Multi-Tenant

Tài liệu này cung cấp các quy tắc, hướng dẫn và prompt templates để giúp AI tự động hỗ trợ phát triển dự án multi-tenant một cách hiệu quả. Các hướng dẫn này được thiết kế để đảm bảo mã nguồn nhất quán, hiệu quả, và tuân thủ các best practices.

## 1. Quy Tắc Chung

### 1.1. Mẫu Prompt cho AI

```
Hãy giúp tôi phát triển [COMPONENT] cho hệ thống multi-tenant của tôi. Chi tiết như sau:
- Công nghệ: NestJS, TypeORM, PostgreSQL, Kafka, Next.js, TypeScript, React Query
- Kiến trúc: Microservices, Event-driven architecture, CQRS
- Mô hình multi-tenant: Schema-based isolation với PostgreSQL
- Bối cảnh: [Chi tiết về vị trí component trong hệ thống, tương tác với các services khác]
- Yêu cầu:
  * [Functional requirement 1]
  * [Functional requirement 2]
  * [Performance requirement]
  * [Security requirement]
- Quy tắc coding: Tuân thủ best practices được đề cập trong tài liệu AI-Coding-Guidelines.md
- Các điểm cần lưu ý:
  * Tenant isolation phải được tuân thủ nghiêm ngặt
  * Xử lý lỗi và retry logic cho các tác vụ quan trọng
  * Audit logging cho các thay đổi dữ liệu
  * [Các điểm đặc biệt khác]
```

#### Các biến thể prompt theo loại component

##### Backend Microservice

```
Hãy giúp tôi phát triển microservice [TÊN SERVICE] cho hệ thống multi-tenant. Chi tiết như sau:
- Công nghệ: NestJS, TypeORM, PostgreSQL, Kafka
- Domain: [Mô tả domain/bounded context]
- Entity chính: [Danh sách entities]
- Events:
  * Publish: [Danh sách events service sẽ phát hành]
  * Subscribe: [Danh sách events service sẽ lắng nghe]
- APIs:
  * [Mô tả API 1]
  * [Mô tả API 2]
- Quy tắc coding: Tuân thủ best practices được đề cập trong tài liệu AI-Coding-Guidelines.md
- Yêu cầu đặc biệt: [Các yêu cầu đặc biệt]
```

##### Frontend Component

```
Hãy giúp tôi phát triển [TÊN COMPONENT] cho frontend của hệ thống multi-tenant. Chi tiết như sau:
- Công nghệ: Next.js, TypeScript, React Query, TailwindCSS
- Loại component: [Page/Layout/Feature/UI Component]
- Tương tác với APIs:
  * [API 1] - [Mục đích sử dụng]
  * [API 2] - [Mục đích sử dụng]
- Yêu cầu UI/UX:
  * [Responsive requirements]
  * [Accessibility requirements]
  * [Performance requirements]
- Quy tắc coding: Tuân thủ best practices được đề cập trong tài liệu AI-Coding-Guidelines.md
- Tenant customization: [Các phần có thể tùy chỉnh theo tenant]
```

##### Database Migration

```
Hãy giúp tôi tạo database migration để [MỤC ĐÍCH] cho hệ thống multi-tenant. Chi tiết như sau:
- Công nghệ: TypeORM migrations, PostgreSQL
- Schema affected: [System/Tenant/Both]
- Thay đổi cần thực hiện:
  * [Thay đổi 1]
  * [Thay đổi 2]
- Backwards compatibility: [Yêu cầu về backwards compatibility]
- Rollback strategy: [Chiến lược rollback]
- Quy tắc coding: Tuân thủ best practices được đề cập trong tài liệu AI-Coding-Guidelines.md
- Những điều cần lưu ý: [Các lưu ý đặc biệt]
```

##### Database & Storage Setup

```
Hãy giúp tôi triển khai [TASK DATABASE/STORAGE] cho hệ thống multi-tenant. Chi tiết như sau:
- Công nghệ: PostgreSQL, MongoDB, Redis, MinIO/S3
- Mô hình multi-tenant: Schema-based isolation với PostgreSQL
- Phạm vi:
  * [System/Tenant/Both]
  * [Production/Development/Testing]
- Yêu cầu:
  * [Schema design requirement]
  * [Data isolation requirement]
  * [Performance requirement]
  * [Backup/Recovery requirement]
- Script cần tạo:
  * [SQL/NoSQL scripts]
  * [Migration scripts]
  * [Initialization scripts]
- Quy tắc coding: Tuân thủ best practices trong tài liệu AI-Coding-Guidelines.md
- Các điểm cần lưu ý:
  * Tenant isolation phải được đảm bảo tuyệt đối
  * Khả năng mở rộng và scale theo số lượng tenant
  * Hiệu suất truy vấn và index optimization
  * Chiến lược backup/recovery
  * [Các điểm đặc biệt khác]
```

###### Mẫu cho System Database Setup

```
Hãy giúp tôi thiết lập System Database cho hệ thống multi-tenant. Chi tiết như sau:
- Công nghệ: PostgreSQL 15
- Mô hình: Schema-based isolation
- Tables cần tạo:
  * tenants (id, name, schema_name, created_at, status, ...)
  * packages (id, name, description, price, features, ...)
  * modules (id, name, description, version, status, ...)
  * tenant_modules (tenant_id, module_id, status, installed_at, ...)
  * domains (id, tenant_id, domain_name, verified, primary, ...)
  * billing (id, tenant_id, package_id, start_date, end_date, amount, status, ...)
  * audit_logs (id, tenant_id, user_id, action, entity, entity_id, timestamp, changes, ...)
- Yêu cầu về indexes:
  * Primary keys
  * Foreign keys với on-delete behaviors
  * Index cho frequent queries
  * Full-text search indexes nếu cần
- Quy tắc coding: Tuân thủ best practices trong tài liệu AI-Coding-Guidelines.md
- Các điểm cần lưu ý:
  * SQL scripts phải idempotent (có thể chạy nhiều lần an toàn)
  * Migrations phải có cơ chế rollback
  * Đảm bảo quản lý đúng transaction
  * Tạo seeding data cho development/testing
```

###### Mẫu cho Tenant Schema Creation

```
Hãy giúp tôi cải thiện hàm tạo Schema Tenant cho hệ thống multi-tenant. Chi tiết như sau:
- Công nghệ: PostgreSQL 15, PL/pgSQL
- Mục tiêu: Tạo và khởi tạo schema mới cho tenant với tất cả các bảng cần thiết
- Bảng cần tạo trong schema tenant:
  * users (id, username, email, password, first_name, last_name, role_id, is_mfa_enabled, status, ...)
  * roles (id, name, description, permissions, ...)
  * teams (id, name, description, created_by, created_at, ...)
  * team_members (team_id, user_id, role, joined_at, ...)
  * permissions (id, name, description, resource, action, ...)
  * user_permissions (user_id, permission_id, granted_at, granted_by, ...)
  * notifications (id, user_id, type, content, read, created_at, ...)
  * custom_fields (id, entity_type, field_name, field_type, is_required, ...)
  * [Các bảng khác cần thiết cho tenant]
- Các function/trigger cần tạo:
  * audit_log_trigger cho mỗi bảng
  * updated_at automatation
  * soft delete support
- Indexes và Constraints:
  * Primary keys
  * Foreign keys với on-delete behaviors
  * Unique constraints
  * Check constraints cho data validation
- Quy tắc coding: Tuân thủ best practices trong tài liệu AI-Coding-Guidelines.md
- Các điểm cần lưu ý:
  * Function phải idempotent (có thể chạy nhiều lần an toàn)
  * Cần có error handling
  * Tạo seeding data cho các bảng lookup
  * Support cho schema migration khi cập nhật function
```

###### Mẫu cho NoSQL Database Setup (MongoDB)

```
Hãy giúp tôi thiết lập MongoDB cho hệ thống multi-tenant. Chi tiết như sau:
- Công nghệ: MongoDB 6.0
- Mô hình multi-tenant: Database-per-tenant hoặc Collection-per-tenant
- Collections cần tạo:
  * system_logs (timestamp, service, level, message, metadata, tenant_id)
  * analytics_data (timestamp, tenant_id, event_type, event_data, user_id)
  * module_configs (tenant_id, module_id, config_data, last_updated)
  * user_events (tenant_id, user_id, timestamp, event_type, event_data)
  * time_series_metrics (tenant_id, timestamp, metric_type, value, metadata)
- Indexes cần tạo:
  * Time-based indexes cho time-series data
  * Compound indexes cho queries phổ biến
  * TTL indexes cho data expiration
  * Text indexes cho search
- Quy tắc coding: Tuân thủ best practices trong tài liệu AI-Coding-Guidelines.md
- Các điểm cần lưu ý:
  * Shard key selection cho horizontal scaling
  * Tenant data isolation
  * Index design cho performance
  * Data validation với JSON Schema
  * Chiến lược backup/recovery
```

###### Mẫu cho Object Storage Configuration (MinIO/S3)

```
Hãy giúp tôi thiết lập Object Storage cho hệ thống multi-tenant. Chi tiết như sau:
- Công nghệ: MinIO (S3 compatible)
- Mô hình: Bucket-per-tenant
- Yêu cầu:
  * Tự động tạo bucket khi tenant mới được tạo
  * Policy để hạn chế access chỉ trong phạm vi tenant
  * Lifecycle rules cho automatic cleanup
  * Versioning cho critical files
  * Server-side encryption
- Script cần tạo:
  * API Service cho file operations (upload, download, delete, list)
  * Background job cho cleanup và maintenance
  * Integration với File Service microservice
- Quy tắc coding: Tuân thủ best practices trong tài liệu AI-Coding-Guidelines.md
- Các điểm cần lưu ý:
  * Tenant isolation là ưu tiên số 1
  * Xử lý large file uploads (multipart)
  * CDN integration cho public assets
  * Security best practices (presigned URLs, access control)
  * Monitoring và alerts cho storage usage
```

###### Mẫu cho Redis Configuration

```
Hãy giúp tôi thiết lập Redis cho hệ thống multi-tenant. Chi tiết như sau:
- Công nghệ: Redis 7.0
- Use cases:
  * Caching (API responses, DB query results)
  * Session storage
  * Rate limiting
  * Pub/Sub cho real-time features
  * Background job queues
- Yêu cầu:
  * Key namespacing theo tenant (prefix: tenant:{tenant_id}:*)
  * TTL và eviction policies
  * Redis Sentinel/Cluster cho high availability
  * Monitoring và alerts
- Quy tắc coding: Tuân thủ best practices trong tài liệu AI-Coding-Guidelines.md
- Các điểm cần lưu ý:
  * Memory usage monitoring
  * Key patterns và namespace conventions
  * Cache invalidation strategy
  * Redis persistence configuration
  * Connection pooling và retry logic
```

### 1.2. Tiền Xử Lý Prompt

Trước khi phản hồi, AI nên:
1. Phân tích yêu cầu để xác định context, service liên quan, và mô hình multi-tenant đang áp dụng
2. Xác định các quy tắc thiết kế liên quan từ tài liệu thiết kế
3. Áp dụng các best practices phù hợp với loại component đang phát triển

## 2. Quy Tắc cho Backend (NestJS)

### 2.1. Kiến Trúc Microservices

- **Mỗi service phải có trách nhiệm đơn lẻ** và lưu trữ không quá 5-7 entities liên quan
- **Giao tiếp giữa các service** thông qua message broker (Kafka/RabbitMQ)
- **Cấu hình tenant isolation** đảm bảo mỗi tenant chỉ truy cập được dữ liệu của mình

**Template cho Microservice:**

```typescript
// Ví dụ: Tenant Service
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRootAsync({
      name: 'system',
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('SYSTEM_DB_NAME'),
        entities: ['dist/**/*.entity{.ts,.js}'],
        synchronize: process.env.NODE_ENV !== 'production',
      }),
      inject: [ConfigService],
    }),
    ClientsModule.registerAsync([
      {
        name: 'EVENT_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'tenant-service',
              brokers: [configService.get('KAFKA_BROKER')],
            },
            consumer: {
              groupId: 'tenant-consumer',
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    // Thêm các module khác...
  ],
  controllers: [...],
  providers: [...],
})
export class AppModule {}
```

### 2.2. Xử Lý Tenant Isolation

**Sử dụng Middleware hoặc Guard cho tenant isolation:**

```typescript
// Ví dụ: Tenant Identification Middleware
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DomainService } from './domain.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly domainService: DomainService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const hostname = req.headers.host;
    
    // Skip for system admin domain
    if (hostname === 'example.com') {
      return next();
    }

    try {
      // Lookup tenant based on domain
      const tenantContext = await this.domainService.getTenantContextByDomain(hostname);
      
      // Attach tenant context to request object
      req['tenantContext'] = tenantContext;
      
      next();
    } catch (error) {
      res.status(404).json({ message: 'Tenant not found' });
    }
  }
}
```

### 2.3. Database Access Pattern

**Repository Pattern với Tenant Context:**

```typescript
// Ví dụ: Base Repository với Tenant Context
import { Repository, EntityManager } from 'typeorm';
import { TenantContext } from '../interfaces/tenant-context.interface';

export class TenantAwareRepository<T> {
  constructor(
    private readonly repository: Repository<T>,
    private readonly entityManager: EntityManager,
  ) {}

  async findWithTenantContext(tenantContext: TenantContext, criteria: any): Promise<T[]> {
    // Switch to tenant schema
    await this.entityManager.query(`SET search_path TO tenant_${tenantContext.schemaName}`);
    
    return this.repository.find(criteria);
  }
  
  // Các phương thức CRUD khác với tenant context...
}
```

### 2.4. Event-Driven Architecture

**Publish/Subscribe Pattern:**

```typescript
// Ví dụ: Event Producer Service
import { Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { TenantCreatedEvent } from '../events/tenant-created.event';

@Injectable()
export class TenantEventService {
  constructor(
    @Inject('EVENT_SERVICE') private readonly eventClient: ClientKafka,
  ) {}

  async publishTenantCreated(tenant: Tenant): Promise<void> {
    const event = new TenantCreatedEvent(tenant);
    this.eventClient.emit('tenant.created', event);
  }
}
```

## 3. Quy Tắc cho Frontend (Next.js)

### 3.1. Tenant-Aware API Clients

**Interceptors và Context cho API Calls:**

```typescript
// Ví dụ: API Client với Tenant Context
import axios from 'axios';

export const createApiClient = (baseURL = '/api') => {
  const client = axios.create({ baseURL });
  
  client.interceptors.request.use((config) => {
    // Thêm domain vào header để backend xác định tenant
    config.headers['X-Domain'] = window.location.hostname;
    
    // Thêm token nếu có
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  });
  
  return client;
};
```

### 3.2. Dynamic Routing và Multi-Tenancy

**Cấu hình Route cho Tenant vs System Admin:**

```typescript
// Ví dụ: Middleware xác định tenant trong Next.js
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { hostname } = new URL(req.url);
  
  // Mặc định là system admin route
  let route = 'system';
  
  // Kiểm tra subdomain hoặc custom domain
  if (hostname !== 'example.com') {
    route = 'tenant';
  }
  
  // Lưu thông tin route vào header
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-route-type', route);
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 3.3. Tenant-Specific Theming

**Theme Provider dựa trên Tenant:**

```typescript
// Ví dụ: Dynamic Theme Provider
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { createApiClient } from '@/lib/api-client';

const TenantThemeContext = createContext({
  primaryColor: '#1976d2',
  secondaryColor: '#dc004e',
  logoUrl: '/logo.png',
});

export const TenantThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState({
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    logoUrl: '/logo.png',
  });
  
  useEffect(() => {
    const fetchTenantTheme = async () => {
      try {
        const apiClient = createApiClient();
        const { data } = await apiClient.get('/tenant/theme');
        setTheme(data);
      } catch (error) {
        console.error('Failed to fetch tenant theme:', error);
      }
    };
    
    fetchTenantTheme();
  }, []);
  
  return (
    <TenantThemeContext.Provider value={theme}>
      <NextThemeProvider attribute="class">
        {children}
      </NextThemeProvider>
    </TenantThemeContext.Provider>
  );
};

export const useTenantTheme = () => useContext(TenantThemeContext);
```

## 4. Quy Tắc cho Database

### 4.1. Schema Design và Migration

**Tenant Schema Creation:**

```typescript
// Ví dụ: Tenant Schema Service
import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

@Injectable()
export class TenantSchemaService {
  constructor(
    @InjectEntityManager('system')
    private readonly entityManager: EntityManager,
  ) {}
  
  async createTenantSchema(schemaName: string): Promise<void> {
    const tenantSchema = `tenant_${schemaName}`;
    
    // Create schema
    await this.entityManager.query(`CREATE SCHEMA IF NOT EXISTS ${tenantSchema}`);
    
    // Create tables in the schema
    await this.entityManager.query(`
      CREATE TABLE IF NOT EXISTS ${tenantSchema}.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role_id UUID NOT NULL,
        is_mfa_enabled BOOLEAN DEFAULT false,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create additional tables...
  }
}
```

### 4.2. Audit Logging

**Central Audit Logging:**

```typescript
// Ví dụ: Audit Log Service
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}
  
  async logAction(data: {
    actorId: string;
    actorType: 'system_user' | 'tenant_user';
    tenantId?: string;
    action: string;
    resourceType: string;
    resourceId: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.auditLogRepository.save({
      ...data,
      created_at: new Date(),
    });
  }
}
```

## 5. Event Sourcing & CQRS Patterns

### 5.1. Event Sourcing

**Event Store Pattern:**

```typescript
// Ví dụ: Event Store Service
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';

@Injectable()
export class EventStoreService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}
  
  async storeEvent(eventType: string, data: any, metadata: any): Promise<Event> {
    const event = this.eventRepository.create({
      type: eventType,
      data,
      metadata,
      timestamp: new Date(),
    });
    
    return this.eventRepository.save(event);
  }
  
  async getEvents(filters: any): Promise<Event[]> {
    return this.eventRepository.find({
      where: filters,
      order: { timestamp: 'ASC' },
    });
  }
}
```

### 5.2. CQRS Pattern

**Command và Query Separation:**

```typescript
// Ví dụ: CQRS cho User Service

// Command
export class CreateUserCommand {
  constructor(
    public readonly tenantId: string,
    public readonly username: string,
    public readonly email: string,
    public readonly password: string,
    public readonly roleId: string,
  ) {}
}

// Command Handler
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}
  
  async execute(command: CreateUserCommand): Promise<void> {
    const { tenantId, username, email, password, roleId } = command;
    
    // Business logic
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await this.userRepository.createUser({
      tenantId,
      username,
      email,
      password: hashedPassword,
      roleId,
    });
    
    // Publish event
    this.eventBus.publish(new UserCreatedEvent(user));
  }
}

// Query
export class GetUserByIdQuery {
  constructor(
    public readonly tenantId: string,
    public readonly userId: string,
  ) {}
}

// Query Handler
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}
  
  async execute(query: GetUserByIdQuery): Promise<User> {
    const { tenantId, userId } = query;
    
    return this.userRepository.findUserById(tenantId, userId);
  }
}
```

## 6. Testing Guidelines

### 6.1. Unit Testing

**Test với Tenant Context:**

```typescript
// Ví dụ: Unit Test cho Tenant-Aware Service
describe('UserService', () => {
  let service: UserService;
  let userRepository: MockType<Repository<User>>;
  
  const tenantContext = {
    tenantId: 'test-tenant-id',
    schemaName: 'test_tenant',
  };
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();
    
    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));
  });
  
  it('should find users with tenant context', async () => {
    const user = { id: '1', username: 'testuser' };
    userRepository.find.mockReturnValue([user]);
    
    const result = await service.findUsers(tenantContext, {});
    
    expect(result).toEqual([user]);
    expect(userRepository.find).toHaveBeenCalledWith({});
  });
});
```

### 6.2. Integration Testing

**Test Service Interactions:**

```typescript
// Ví dụ: Integration Test với Multiple Services
describe('Tenant Creation Flow', () => {
  let app: INestApplication;
  let tenantService: TenantService;
  let schemaService: TenantSchemaService;
  let eventBus: EventBus;
  
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    tenantService = moduleFixture.get<TenantService>(TenantService);
    schemaService = moduleFixture.get<TenantSchemaService>(TenantSchemaService);
    eventBus = moduleFixture.get<EventBus>(EventBus);
    
    await app.init();
  });
  
  it('should create tenant and schema, then publish event', async () => {
    // Spy on methods
    jest.spyOn(schemaService, 'createTenantSchema');
    jest.spyOn(eventBus, 'publish');
    
    // Create tenant
    const tenant = await tenantService.createTenant({
      name: 'Test Tenant',
      schemaName: 'test_tenant',
      packageId: 'test-package-id',
    });
    
    // Verify schema creation was called
    expect(schemaService.createTenantSchema).toHaveBeenCalledWith('test_tenant');
    
    // Verify event was published
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: tenant.id,
      }),
    );
  });
});
```

## 7. Security Best Practices

### 7.1. Authentication và Authorization

**JWT với Tenant Context:**

```typescript
// Ví dụ: JWT Strategy với Tenant Context
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DomainService } from '../domain/domain.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly domainService: DomainService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      passReqToCallback: true,
    });
  }
  
  async validate(req: Request, payload: any) {
    // For system users, no tenant context needed
    if (payload.isSystemUser) {
      return { userId: payload.sub, username: payload.username, isSystemUser: true };
    }
    
    // For tenant users, get tenant context from domain
    const hostname = req.headers['host'];
    const tenantContext = await this.domainService.getTenantContextByDomain(hostname);
    
    // Validate user belongs to this tenant
    if (payload.tenantId !== tenantContext.tenantId) {
      throw new UnauthorizedException('Invalid tenant context');
    }
    
    return {
      userId: payload.sub,
      username: payload.username,
      tenantId: payload.tenantId,
      tenantContext,
    };
  }
}
```

### 7.2. Data Protection và Privacy

**PII Anonymization:**

```typescript
// Ví dụ: PII Anonymization Service
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class AnonymizationService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }
  
  decrypt(text: string): string {
    const [ivHex, encryptedText] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  
  anonymizeUser(user: any): any {
    // Deep clone to avoid modifying original
    const anonymized = JSON.parse(JSON.stringify(user));
    
    // Anonymize PII fields
    if (anonymized.email) {
      anonymized.email = this.obfuscateEmail(anonymized.email);
    }
    
    if (anonymized.phone) {
      anonymized.phone = this.obfuscatePhone(anonymized.phone);
    }
    
    return anonymized;
  }
  
  private obfuscateEmail(email: string): string {
    const [username, domain] = email.split('@');
    return `${username.charAt(0)}${'*'.repeat(username.length - 2)}${username.charAt(username.length - 1)}@${domain}`;
  }
  
  private obfuscatePhone(phone: string): string {
    return phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
  }
}
```

## 8. Deployment và DevOps

### 8.1. Containerization

**Dockerfile cho Microservice:**

```dockerfile
# Ví dụ: Dockerfile cho NestJS Microservice
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Set environment variables
ENV NODE_ENV=production

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### 8.2. Kubernetes Deployment

**Kubernetes Manifest cho Microservice:**

```yaml
# Ví dụ: k8s deployment cho User Service
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: multi-tenant
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: ${REGISTRY}/user-service:${TAG}
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: host
        # Các biến môi trường khác...
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"
          requests:
            cpu: "100m"
            memory: "256Mi"
---
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: multi-tenant
spec:
  selector:
    app: user-service
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
```

## 9. Prometheus và Grafana Monitoring

### 9.1. Metrics Collection

**NestJS Prometheus Integration:**

```typescript
// Ví dụ: Prometheus Metrics Service
import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly requestsCounter: Counter<string>,
    
    @InjectMetric('http_request_duration_seconds')
    private readonly requestDuration: Histogram<string>,
    
    @InjectMetric('active_users_gauge')
    private readonly activeUsersGauge: Gauge<string>,
  ) {}
  
  incrementRequestCount(method: string, route: string, statusCode: number, tenantId?: string): void {
    this.requestsCounter.inc({
      method,
      route,
      status_code: statusCode.toString(),
      tenant_id: tenantId || 'system',
    });
  }
  
  recordRequestDuration(method: string, route: string, durationMs: number, tenantId?: string): void {
    this.requestDuration.observe(
      {
        method,
        route,
        tenant_id: tenantId || 'system',
      },
      durationMs / 1000,
    );
  }
  
  setActiveUsers(count: number, tenantId: string): void {
    this.activeUsersGauge.set({ tenant_id: tenantId }, count);
  }
}
```

## 10. Ví Dụ Prompt cho Các Tình Huống Cụ Thể

### 10.1. Tạo Microservice Mới

```
Hãy giúp tôi tạo Billing Microservice cho hệ thống multi-tenant. Chi tiết như sau:
- Công nghệ: NestJS, TypeORM, Kafka, PostgreSQL
- Bối cảnh: Microservice này sẽ quản lý billing, subscription, và thanh toán cho tenants
- Yêu cầu:
  * Cần có API để tạo, lấy, cập nhật invoices
  * Tích hợp với Stripe để xử lý thanh toán
  * Gửi notification qua Kafka khi có invoice mới hoặc thanh toán thành công/thất bại
  * Hỗ trợ nhiều billing cycles (monthly, yearly)
  * Tự động renewal subscriptions
- Quy tắc coding: Tuân thủ best practices được đề cập trong tài liệu AI-Coding-Guidelines.md
- Các điểm cần lưu ý: 
  * Cần xử lý hiện tượng khi payment gateway không phản hồi
  * Cần audit log đầy đủ cho tất cả các transactions
```

### 10.2. Tạo Frontend Component

```
Hãy giúp tôi tạo Tenant Dashboard cho hệ thống multi-tenant. Chi tiết như sau:
- Công nghệ: Next.js, TypeScript, React Query, Tailwind CSS
- Bối cảnh: Dashboard cho tenant admin quản lý users, roles, và settings cho tenant của họ
- Yêu cầu:
  * Hiển thị số lượng users, monthly active users
  * Chart hiển thị usage metrics
  * Quản lý user permissions và roles
  * White-labeling settings để tùy chỉnh theme
  * Account settings để quản lý billing và subscription
- Quy tắc coding: Tuân thủ best practices được đề cập trong tài liệu AI-Coding-Guidelines.md
- Các điểm cần lưu ý:
  * Dashboard phải responsive
  * Cần hỗ trợ i18n
  * Phải có skeleton loading states
```

### 10.3. Tạo Database Migration

```
Hãy giúp tôi tạo database migration để thêm multi-factor authentication. Chi tiết như sau:
- Công nghệ: TypeORM migrations, PostgreSQL
- Bối cảnh: Cần thêm MFA cho cả system users và tenant users
- Yêu cầu:
  * Thêm các fields cần thiết vào các bảng users
  * Thêm bảng để lưu trữ MFA backup codes
  * Cập nhật schema creation script để áp dụng cho tenant mới
- Quy tắc coding: Tuân thủ best practices được đề cập trong tài liệu AI-Coding-Guidelines.md
- Các điểm cần lưu ý:
  * Migration phải có khả năng rollback
  * Đảm bảo backwards compatibility
  * Không làm mất dữ liệu hiện có
```

## 11. Tài Liệu Tham Khảo

1. **NestJS Documentation**: https://docs.nestjs.com/
2. **Next.js Documentation**: https://nextjs.org/docs
3. **TypeORM Documentation**: https://typeorm.io/
4. **Kubernetes Best Practices**: https://kubernetes.io/docs/concepts/
5. **PostgreSQL Multi-tenant Patterns**: https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/
