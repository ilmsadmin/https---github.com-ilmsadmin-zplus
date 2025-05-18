import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  // Mock for the app service
  const mockAppService = {
    getStatus: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStatus', () => {
    it('should return service status information', () => {
      const mockStatusResponse = {
        service: 'notification-service',
        version: '1.0.0',
        status: 'online',
        environment: 'test',
        uptime: '0d 0h 0m',
        timestamp: expect.any(String),
      };

      mockAppService.getStatus.mockReturnValue(mockStatusResponse);

      const result = appController.getStatus();

      expect(appService.getStatus).toHaveBeenCalled();
      expect(result).toEqual(mockStatusResponse);
      expect(result).toHaveProperty('service');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('timestamp');
    });
  });
});
