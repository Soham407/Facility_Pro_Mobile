import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class PanicAlertModel extends Model {
  static table = 'panic_alerts';

  @field('server_id') serverId!: string | null;
  @field('guard_id') guardId!: string;
  @field('alert_type') alertType!: string;
  @field('latitude') latitude!: number | null;
  @field('longitude') longitude!: number | null;
  @field('description') description!: string | null;
  @field('is_resolved') isResolved!: boolean;
  @field('is_synced') isSynced!: boolean;
  @field('alert_time') alertTime!: number;
  @readonly @date('created_at') createdAt!: Date;
}
