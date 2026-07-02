# Live Data Sync — World Cup 2026 (v2.0)

Nâng cấp non-breaking bổ sung pipeline đồng bộ tỉ số tự động từ API-FOOTBALL,
theo `WorldCup2026_Upgrade_Runtime_Architecture_v2.0.md`. Không thay đổi
workflow Development hay kiến trúc Runtime hiện có.

## Phạm vi thực tế (đã thu hẹp so với spec gốc)

Spec gốc mô tả sync cho các bảng chung `matches` / `standings` / `fixtures` /
`teams` / `players` / `coaches`. Dự án thực tế là bracket loại trực tiếp
(`knockout_matches`), không có vòng bảng, và `teams` / `players` /
`coaching_staff` đã được nhập tay bằng tiếng Việt. Vì vậy Edge Function
**chỉ cập nhật dữ liệu trận đấu**:

- `status`, `current_minute`, `is_extra_time`
- `home_score`, `away_score`, `home_penalty_score`, `away_penalty_score`
- `winner_id` (tự tính khi trận kết thúc — kích hoạt trigger
  `advance_winner_to_next_match` có sẵn)
- `external_match_id` (fixture id của API-FOOTBALL, tự gán lần đầu match được)
- `last_synced_at`

Không ghi đè tên đội, logo, cầu thủ, HLV.

## Kiến trúc

```
API-FOOTBALL (league=1, season=2026)
      ↓  (1 request GET / lần chạy)
Edge Function: sync-worldcup-data
      ↓  match theo cặp tên đội (home/away) đã xác định trong knockout_matches
Supabase Database (UPDATE knockout_matches, INSERT sync_log)
      ↓
Supabase Realtime (postgres_changes)
      ↓
Browser (RoundOf32List / RoundOf16List / LiveMatches / MatchDetail)
```

## Cron

- Lịch: `0 */2 * * *` (12 lần/ngày) qua `pg_cron` + `pg_net`
  (migration `setup_sync_worldcup_data_cron`).
- Ngân sách API: 1 request/lần chạy × 12 = 12 requests/ngày, dư nhiều so với
  giới hạn 100/ngày của gói FREE — còn dư địa để chạy tay khi cần debug.
- Job name: `sync-worldcup-data-every-2h`. Xem/huỷ:
  ```sql
  select * from cron.job where jobname = 'sync-worldcup-data-every-2h';
  select cron.unschedule('sync-worldcup-data-every-2h');
  ```

## Bảo mật

- Edge Function **không** bật `verify_jwt` (được gọi nội bộ bởi pg_cron, không
  public cho trình duyệt). Thay vào đó tự kiểm tra header `x-cron-secret`.
- `API_FOOTBALL_KEY` và `CRON_SECRET` chỉ lưu trong Supabase Edge Function
  Secrets — không có trong GitHub, Browser, Next.js client, hay `.env.local`.

## ⚠️ Việc cần Hoang làm thủ công (không có tool MCP nào set được secret)

Chạy 1 trong 2 cách sau để function hoạt động thật (hiện tại đã deploy nhưng
sẽ trả lỗi "missing API_FOOTBALL_KEY" cho tới khi secrets được set):

**Cách 1 — Supabase CLI:**
```bash
supabase secrets set API_FOOTBALL_KEY=<api-football-key-của-Hoang> --project-ref zzodwwlrgodsujttrbkv
supabase secrets set CRON_SECRET=VZzsOkBQiA7NG0y83IlNKwSNf6anzN_Wez9276iRul4 --project-ref zzodwwlrgodsujttrbkv
```

**Cách 2 — Dashboard:** Project Settings → Edge Functions → Secrets → thêm
hai secret trên với đúng giá trị (giá trị `CRON_SECRET` phải khớp với giá trị
đã hard-code trong migration `setup_sync_worldcup_data_cron`, nếu muốn đổi thì
cần chạy lại `cron.schedule` với giá trị mới).

## Test thủ công

```bash
curl -X POST 'https://zzodwwlrgodsujttrbkv.supabase.co/functions/v1/sync-worldcup-data' \
  -H 'x-cron-secret: VZzsOkBQiA7NG0y83IlNKwSNf6anzN_Wez9276iRul4' \
  -H 'Content-Type: application/json' -d '{}'
```

Xem log: bảng `sync_log` (source = `api-football`) hoặc
`Supabase:get_logs` (service `edge-function`).

## Routes mới

- `/live` — tổng hợp trận đang diễn ra / sắp diễn ra / vừa kết thúc, mọi
  vòng đấu. `revalidate = 0`.
- `/matches/[id]` — chi tiết 1 trận, subscribe realtime lọc theo đúng id
  (`filter: id=eq.<id>`) thay vì tải lại toàn bảng.

Cả hai theo đúng pattern hiện có: Server Component tải dữ liệu ban đầu →
Client Component subscribe Realtime → cập nhật UI, không polling từ Browser.

## Việc còn lại

- 10/16 kết quả Vòng 32 còn thiếu vẫn cần nhập tay như trước cho tới khi các
  trận đó diễn ra và được đồng bộ tự động.
- (Không liên quan tới nâng cấp này) `Supabase:get_advisors` báo
  `advance_winner_to_next_match` là `SECURITY DEFINER` và có thể gọi qua RPC
  bởi `anon`/`authenticated` — nên cân nhắc revoke EXECUTE nếu không chủ đích
  cho phép gọi trực tiếp từ client.
