import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class AttendanceLogModel extends Model {
  static table = 'attendance_logs';

  @field('server_id') serverId!: string | null;
  @field('employee_id') employeeId!: string;
  @field('log_date') logDate!: string;
  @field('check_in_time') checkInTime!: number | null;
  @field('check_out_time') checkOutTime!: number | null;
  @field('check_in_lat') checkInLat!: number | null;
  @field('check_in_lng') checkInLng!: number | null;
  @field('check_in_selfie_url') checkInSelfieUrl!: string | null;
  @field('is_auto_punch_out') isAutoPunchOut!: boolean;
  @field('is_synced') isSynced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
}
