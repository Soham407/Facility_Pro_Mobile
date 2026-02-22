import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class GpsPointModel extends Model {
  static table = 'gps_points';

  @field('server_id') serverId!: string | null;
  @field('employee_id') employeeId!: string;
  @field('latitude') latitude!: number;
  @field('longitude') longitude!: number;
  @field('tracked_at') trackedAt!: number;
  @field('battery_level') batteryLevel!: number | null;
  @field('is_mock_location') isMockLocation!: boolean;
  @field('is_synced') isSynced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
}
