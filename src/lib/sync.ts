import { Q } from '@nozbe/watermelondb';
import { database } from './watermelon';
import { supabase } from './supabase';
import { AttendanceLogModel } from '../db/models/AttendanceLog';
import { PanicAlertModel } from '../db/models/PanicAlert';
import { ChecklistResponseModel } from '../db/models/ChecklistResponse';
import { VisitorModel } from '../db/models/Visitor';
import { GpsPointModel } from '../db/models/GpsPoint';

let isSyncing = false;

export async function syncOfflineData() {
  if (isSyncing) return;
  isSyncing = true;

  try {
    // 1. Sync Panic Alerts (Highest Priority)
    const pendingPanics = await database.collections
      .get<PanicAlertModel>('panic_alerts')
      .query(Q.where('is_synced', false))
      .fetch();

    if (pendingPanics.length > 0) {
      const payloads = pendingPanics.map(p => ({
        id: p.serverId || undefined, // undefined to let Supabase generate if null
        guard_id: p.guardId,
        alert_type: p.alertType,
        latitude: p.latitude,
        longitude: p.longitude,
        description: p.description,
        is_resolved: p.isResolved,
        alert_time: new Date(p.alertTime).toISOString(),
      }));

      const { data, error } = await supabase.from('panic_alerts').upsert(payloads, { onConflict: 'id' }).select('id');
      if (!error && data) {
        await database.write(async () => {
          for (let i = 0; i < pendingPanics.length; i++) {
            await pendingPanics[i].update(p => {
              p.isSynced = true;
              if (data[i]?.id) p.serverId = data[i].id;
            });
          }
        });
      } else {
        console.error('Failed to sync panic alerts:', error);
      }
    }

    // 2. Sync Attendance Logs
    const pendingAttendance = await database.collections
      .get<AttendanceLogModel>('attendance_logs')
      .query(Q.where('is_synced', false))
      .fetch();

    if (pendingAttendance.length > 0) {
      const payloads = pendingAttendance.map(a => ({
        id: a.serverId || undefined,
        employee_id: a.employeeId,
        log_date: a.logDate,
        check_in_time: a.checkInTime ? new Date(a.checkInTime).toISOString() : null,
        check_out_time: a.checkOutTime ? new Date(a.checkOutTime).toISOString() : null,
        check_in_latitude: a.checkInLat,
        check_in_longitude: a.checkInLng,
        check_in_selfie_url: a.checkInSelfieUrl,
        is_auto_punch_out: a.isAutoPunchOut,
      }));

      const { data, error } = await supabase.from('attendance_logs').upsert(payloads, { onConflict: 'id' }).select('id');
      if (!error && data) {
        await database.write(async () => {
          for (let i = 0; i < pendingAttendance.length; i++) {
            await pendingAttendance[i].update(a => {
              a.isSynced = true;
              if (data[i]?.id) a.serverId = data[i].id;
            });
          }
        });
      } else {
        console.error('Failed to sync attendance:', error);
      }
    }

    // 3. Sync Checklist Responses
    const pendingChecklists = await database.collections
      .get<ChecklistResponseModel>('checklist_responses')
      .query(Q.where('is_synced', false))
      .fetch();

    if (pendingChecklists.length > 0) {
      const payloads = pendingChecklists.map(c => ({
        id: c.serverId || undefined,
        checklist_id: c.checklistId,
        employee_id: c.employeeId,
        response_date: c.responseDate,
        responses: JSON.parse(c.responsesJson || '[]'),
        is_complete: c.isComplete,
        submitted_at: c.submittedAt ? new Date(c.submittedAt).toISOString() : null,
      }));

      const { data, error } = await supabase.from('checklist_responses').upsert(payloads, { onConflict: 'id' }).select('id');
      if (!error && data) {
        await database.write(async () => {
          for (let i = 0; i < pendingChecklists.length; i++) {
            await pendingChecklists[i].update(c => {
              c.isSynced = true;
              if (data[i]?.id) c.serverId = data[i].id;
            });
          }
        });
      } else {
        console.error('Failed to sync checklists:', error);
      }
    }

    // 4. Sync Visitors
    const pendingVisitors = await database.collections
      .get<VisitorModel>('visitors')
      .query(Q.where('is_synced', false))
      .fetch();

    if (pendingVisitors.length > 0) {
      const payloads = pendingVisitors.map(v => ({
        id: v.serverId || undefined,
        visitor_name: v.visitorName,
        phone: v.phone,
        flat_id: v.flatId,
        entry_time: new Date(v.entryTime).toISOString(),
        exit_time: v.exitTime ? new Date(v.exitTime).toISOString() : null,
        entry_guard_id: v.entryGuardId,
      }));

      const { data, error } = await supabase.from('visitors').upsert(payloads, { onConflict: 'id' }).select('id');
      if (!error && data) {
        await database.write(async () => {
          for (let i = 0; i < pendingVisitors.length; i++) {
            await pendingVisitors[i].update(v => {
              v.isSynced = true;
              if (data[i]?.id) v.serverId = data[i].id;
            });
          }
        });
      } else {
        console.error('Failed to sync visitors:', error);
      }
    }

    // 5. Sync GPS Points
    const pendingGps = await database.collections
      .get<GpsPointModel>('gps_points')
      .query(Q.where('is_synced', false))
      .fetch();

    if (pendingGps.length > 0) {
      const payloads = pendingGps.map(g => ({
        employee_id: g.employeeId,
        latitude: g.latitude,
        longitude: g.longitude,
        tracked_at: new Date(g.trackedAt).toISOString(),
        is_mock_location: g.isMockLocation,
      }));

      // No id needed for gps, just insert
      const { error } = await supabase.from('gps_tracking').insert(payloads);
      if (!error) {
        await database.write(async () => {
          for (const g of pendingGps) {
            await g.update(gItem => { gItem.isSynced = true; });
          }
          // Optionally delete synced GPS points to save space
          for (const g of pendingGps) {
             await g.destroyPermanently();
          }
        });
      } else {
         console.error('Failed to sync gps points:', error);
      }
    }

  } catch (err) {
    console.error('Sync error:', err);
  } finally {
    isSyncing = false;
  }
}
