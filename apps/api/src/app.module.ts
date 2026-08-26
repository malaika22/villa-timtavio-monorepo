import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { Auth0Module } from './modules/auth0/auth0.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ManifestModule } from './modules/manifest/manifest.module';
import { RequestsModule } from './modules/requests/requests.module';
import { FolioModule } from './modules/folio/folio.module';
import { GuestsModule } from './modules/guests/guests.module';
import { CrmModule } from './modules/crm/crm.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { LodgifyModule } from './modules/lodgify/lodgify.module';
import { BreezeWayModule } from './modules/breezeway/breezeway.module';
import { PusherModule } from './modules/pusher/pusher.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { InquiriesModule } from './modules/inqueries/inquiries.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SystemModule } from './modules/system/system.module';
import { AuditModule } from './modules/audit/audit.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SettingsModule } from './modules/settings/settings.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DiningModule } from './modules/dining/dining.module';
import { MenuModule } from './modules/menu/menu.module';
import { BrokerModule } from './modules/broker/broker.module';
import { ExperienceCategoriesModule } from './modules/experience-categories/experience-categories.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    /**
     * Registered for one route in particular.
     *
     * A magic-link code now lasts the whole stay rather than half an hour,
     * which is what the guest needs and what makes six digits worth guessing:
     * a million combinations and, until this, unlimited attempts and unlimited
     * time. The limit is declared on the verify route itself; this only makes
     * the guard available. Nothing else opts in, so no existing endpoint
     * changes behaviour.
     */
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    PrismaModule,
    AuthModule,
    Auth0Module,
    BookingsModule,
    RoomsModule,
    CatalogModule,
    ManifestModule,
    RequestsModule,
    FolioModule,
    GuestsModule,
    CrmModule,
    VendorsModule,
    LodgifyModule,
    BreezeWayModule,
    PusherModule,
    NotificationsModule,
    WebhooksModule,
    InquiriesModule,
    AnalyticsModule,
    SystemModule,
    AuditModule,
    InventoryModule,
    SettingsModule,
    IntegrationsModule,
    DashboardModule,
    UploadsModule,
    DiningModule,
    MenuModule,
    BrokerModule,
    ExperienceCategoriesModule,
  ],
})
export class AppModule {}
