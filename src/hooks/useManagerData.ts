import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useManagerData() {
  return useQuery({
    queryKey: ["managerData"],
    staleTime: 60000, // 60s
    queryFn: async () => {
      // openServiceRequests
      const { count: openServiceRequests } = await supabase
        .from("service_requests")
        .select("*", { count: "exact", head: true })
        .not("status", "in", '("completed","cancelled")');

      // pendingLeaves
      const { data: pendingLeaves } = await supabase
        .from("leave_applications")
        .select(
          `
          *,
          employees (first_name, last_name, photo_url, employee_code, designation),
          leave_types (leave_type_name)
        `,
        )
        .eq("status", "pending");

      // expiringItems (Using RPC detect_expiring_items(7))
      const { data: expiringItemsData } = await supabase.rpc(
        "detect_expiring_items",
        { days_ahead: 7 },
      );
      const expiringItems = expiringItemsData?.length || 0;

      // recentActivity (mixed feed from last 24h)
      interface ActivityFeedItem {
        id: string;
        title: string;
        description: string;
        created_at: string;
        type: "alert" | "leave" | "service";
      }

      const { data: recentAlerts } = await supabase
        .from("panic_alerts")
        .select(`id, alert_type, description, alert_time`)
        .gte(
          "alert_time",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        )
        .limit(5);

      const mappedAlerts: ActivityFeedItem[] = (recentAlerts || []).map(
        (a) => ({
          id: a.id,
          title: a.alert_type,
          description: a.description || "",
          created_at: a.alert_time,
          type: "alert" as const,
        }),
      );

      const { data: recentLeaves } = await supabase
        .from("leave_applications")
        .select(`id, reason, status, applied_at`)
        .gte(
          "applied_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        )
        .limit(5);

      const mappedLeaves: ActivityFeedItem[] = (recentLeaves || []).map(
        (l) => ({
          id: l.id,
          title: l.reason || "Leave",
          description: l.status,
          created_at: l.applied_at || new Date().toISOString(),
          type: "leave" as const,
        }),
      );

      const { data: recentServices } = await supabase
        .from("service_requests")
        .select(`id, status, description, created_at`)
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        )
        .limit(5);

      const mappedServices: ActivityFeedItem[] = (recentServices || []).map(
        (s) => ({
          id: s.id,
          title: s.status,
          description: s.description || "",
          created_at: s.created_at,
          type: "service" as const,
        }),
      );

      // Combine and sort
      const combined = [...mappedAlerts, ...mappedLeaves, ...mappedServices]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 10); // Show last 10 items only

      return {
        openServiceRequests: openServiceRequests || 0,
        pendingLeaves: pendingLeaves || [],
        expiringItems,
        recentActivity: combined,
      };
    },
  });
}
