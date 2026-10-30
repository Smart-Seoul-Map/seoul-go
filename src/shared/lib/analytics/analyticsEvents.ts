export type AnalyticsEvent =
  | { name: "entry_intro_start" }
  | { name: "entry_intro_miss_click" }
  | { name: "entry_place_visit"; placeId: string; rewarded: boolean }
  | { name: "entry_dart_blocked" }
  | { name: "entry_roulette_blocked" }
  | { name: "entry_guide_open"; source: "first_entry" | "number_button" }
  | { name: "entry_guide_close"; step: number; completed: boolean }
  | { name: "entry_number_reward_action" }
  | { name: "entry_district_start"; districtId: number }
  | { name: "linked_place_card_press"; placeId: string }
  | { name: "course_unavailable_action_press"; action: "naver" | "share" };

export type AnalyticsClient = {
  capture: (event: AnalyticsEvent) => void;
  captureError: (error: unknown) => void;
};
