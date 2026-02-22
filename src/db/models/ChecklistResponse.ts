import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class ChecklistResponseModel extends Model {
  static table = 'checklist_responses';

  @field('server_id') serverId!: string | null;
  @field('checklist_id') checklistId!: string;
  @field('employee_id') employeeId!: string;
  @field('response_date') responseDate!: string;
  @field('responses_json') responsesJson!: string;
  @field('is_complete') isComplete!: boolean;
  @field('is_synced') isSynced!: boolean;
  @field('submitted_at') submittedAt!: number;
  @readonly @date('created_at') createdAt!: Date;
}
