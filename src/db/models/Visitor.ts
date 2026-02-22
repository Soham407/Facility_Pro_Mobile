import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class VisitorModel extends Model {
  static table = 'visitors';

  @field('server_id') serverId!: string | null;
  @field('visitor_name') visitorName!: string;
  @field('phone') phone!: string | null;
  @field('flat_id') flatId!: string | null;
  @field('entry_time') entryTime!: number;
  @field('exit_time') exitTime!: number | null;
  @field('entry_guard_id') entryGuardId!: string | null;
  @field('is_synced') isSynced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
}
