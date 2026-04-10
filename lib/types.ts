export type AttendanceStatus = "present" | "excused" | "absent_unexcused";
export type ManualStatus = AttendanceStatus | "inherit";
export type FineDraftStatus = "draft" | "exported";

export type Member = {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
};

export type Admin = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
};

export type Event = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  checkin_open_at: string;
  checkin_close_at: string;
  excuse_close_at: string;
  fine_amount: number;
  created_by: string | null;
  created_at: string;
};

export type AttendanceRecord = {
  id: string;
  event_id: string;
  member_id: string;
  checked_in_at: string;
  user_lat: number;
  user_lng: number;
  gps_accuracy_meters: number | null;
  distance_from_center_meters: number;
  status: AttendanceStatus;
  created_at: string;
};

export type ExcuseSubmission = {
  id: string;
  event_id: string;
  member_id: string;
  full_name_snapshot: string;
  reason: string;
  proof_image_url: string | null;
  submitted_at: string;
  default_valid: boolean;
  admin_override_status: "approved" | "rejected" | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
};

export type EventExpectedMember = {
  id: string;
  event_id: string;
  member_id: string;
  full_name_snapshot: string;
  email_snapshot: string;
  manual_status: AttendanceStatus | null;
  created_at: string;
};

export type FineDraft = {
  id: string;
  event_id: string;
  member_id: string;
  amount: number;
  message_body: string;
  status: FineDraftStatus;
  created_at: string;
};

export type EventMemberRow = {
  member: Pick<Member, "id" | "full_name" | "email">;
  expected: EventExpectedMember;
  attendance: AttendanceRecord | null;
  excuse: ExcuseSubmission | null;
  finalStatus: AttendanceStatus;
};
