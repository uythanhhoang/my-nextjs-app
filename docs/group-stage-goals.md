# Vòng bảng — cầu thủ ghi bàn (openfootball)

Nguồn dữ liệu: [openfootball/worldcup.json — 2026](https://github.com/openfootball/worldcup.json/tree/master/2026)

## Quy ước dự án

- **`lib/supabase.ts`** — client typed (`Database` từ `supabase_types.ts`), dùng cho module cũ.
- **`lib/supabase-untyped.ts`** — client không gắn kiểu, **chỉ** cho object mới:
  - `group_matches`
  - `match_goals` (cột `match_kind`: `group` | `knockout`)
  - view `top_scorers`

Không regenerate `supabase_types.ts`.

## Schema mới

| Object | Mô tả |
|--------|--------|
| `group_matches` | Trận vòng bảng (72 trận), khóa `external_key` = `date\|team1\|team2` |
| `match_goals.match_kind` | `group` → `match_id` trỏ `group_matches.id`; `knockout` → `knockout_matches.id` |
| `top_scorers` (view) | Gom mọi bàn (trừ phản lưới nhà), cả vòng bảng + knockout |

Migration: `supabase/migrations/20260703150000_group_stage_goals.sql`

## Triển khai

1. Áp migration lên Supabase Cloud (SQL Editor hoặc `supabase db push`).
2. Set env local (không commit):

   ```env
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   ```

3. Chạy seed:

   ```bash
   npm run seed:group-goals
   ```

Script tải `worldcup.json`, lọc trận có trường `group`, map tên đội sang bảng `teams`, upsert `group_matches` và chèn `match_goals`.

## Realtime

- `TopScorersTable` subscribe `match_goals` → refetch view `top_scorers`.
- Bàn vòng bảng tự xuất hiện trên `/top-scorers` sau seed, không cần sửa component typed cũ.

## Ghi chú

- Bàn **phản lưới nhà** vẫn lưu trong `match_goals` (timeline) nhưng **không** tính vào `top_scorers`.
- Penalty: `penalty: true` trong JSON → `is_penalty = true`.
- Phút `90+4` → `minute = 90`, `minute_extra = 4`.
