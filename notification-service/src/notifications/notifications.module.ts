import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailModule } from '../channels/email/email.module';
import { PushModule } from '../channels/push/push.module';
import { SmsModule } from '../channels/sms/sms.module';
import { InAppModule } from '../channels/in-app/in-app.module';
import { TemplatesModule } from '../templates/templates.module';
import { NotificationProcessor } from './processors/notification.processor';
import { NotificationListener } from './listeners/notification.listener';
import { NotificationScheduler } from './schedulers/notification.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    EmailModule,
    PushModule,
    SmsModule,
    InAppModule,
    TemplatesModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationProcessor,
    NotificationListener,
    NotificationScheduler,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
