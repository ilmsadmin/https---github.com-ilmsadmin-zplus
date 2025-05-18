import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { TypeOrmHealthIndicator } from '../src/health/indicators/typeorm.health';

describe('TypeOrmHealthIndicator', () => {
  let indicator: TypeOrmHealthIndicator;
  
  const mockDataSource = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmHealthIndicator,
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    indicator = module.get<TypeOrmHealthIndicator>(TypeOrmHealthIndicator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(indicator).toBeDefined();
  });

  describe('pingCheck', () => {
    it('should return a healthy status when database is available', async () => {
      mockDataSource.query.mockResolvedValue([{ result: 1 }]);

      const result = await indicator.pingCheck('database');

      expect(mockDataSource.query).toHaveBeenCalledWith('SELECT 1 as result');
      expect(result).toEqual({
        database: {
          status: 'up',
        },
      });
    });

    it('should return an unhealthy status when database query fails', async () => {
      const error = new Error('Database connection error');
      mockDataSource.query.mockRejectedValue(error);

      await expect(indicator.pingCheck('database')).rejects.toThrow();
    });
  });
});
