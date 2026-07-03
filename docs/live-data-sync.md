# Live Data Sync — World Cup 2026 (v2.0)

> ⚠️ **TRẠNG THÁI HIỆN TẠI: SẴN SÀNG NHƯNG CHƯA KÍCH HOẠT.**
> Edge Function đã deploy, đã test end-to-end thành công (auth + gọi
> API-FOOTBALL đều OK), nhưng **cron job đã bị `unschedule`** theo quyết định
> của Hoang ngày 2026-07-02, vì gói FREE của API-FOOTBALL không có dữ liệu
> mùa giải 2026 (xem phần "Vấn đề đã phát hiện" bên dưới). Dữ liệu trận đấu
> tiếp tục được nhập tay như trước cho tới khi quyết định nâng cấp gói.

Nâng cấp non-breaking bổ sung pipeline đồng bộ tỉ số tự động từ API-FOOTBALL,
theo `WorldCup2026_Upgrade_Runtime_Architecture_v2.0.md`. Không thay đổi
workflow Development hay kiến trúc Runtime hiện có.

## ⛔ Vấn đề đã phát hiện — lý do tạm dừng

Gói **FREE** của API-FOOTBALL trả về lỗi khi gọi `/fixtures?league=1&season=2026`:

```
"errors": { "plan": "Free plans do not have access to this season, try from 2022 to 2024." }
```

Tức là gói FREE chỉ có dữ liệu mùa giải 2022–2024, không có 2026. Đây là giới
hạn thương mại cố định từ nhà cung cấp, không phải lỗi code hay cấu hình.
Muốn có dữ liệu thật, cần nâng cấp lên gói **Pro (~$19/tháng, 7.500
requests/ngày, đầy đủ mọi mùa giải)** tại https://www.api-football.com/pricing.

## Cách kích hoạt lại khi sẵn sàng (không cần sửa code / redeploy)

1. Nâng cấp gói API-FOOTBALL lên Pro (hoặc cao hơn).
2. Nếu API key thay đổi, cập nhật secret:
   ```bash
   supabase secrets set API_FOOTBALL_KEY=<key-mới> --project-ref zzodwwlrgodsujttrbkv
   ```
3. Lên lịch lại cron job bằng câu SQL sau (chạy trong Supabase SQL Editor
   hoặc nhờ Claude chạy qua `Supabase:execute_sql`):
   ```sql
   select cron.schedule(
     'sync-worldcup-data-every-2h',
     '0 */2 * * *',
     $cron$
     select net.http_post(
       url := 'https://zzodwwlrgodsujttrbkv.supabase.co/functions/v1/sync-worldcup-data',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'x-cron-secret', 'VZzsOkBQiA7NG0y83IlNKwSNf6anzN_Wez9276iRul4'
       ),
       body := '{}'::jsonb
     );
     $cron$
   );
   ```
4. Test thủ công trước khi đợi cron (xem phần "Test thủ công" bên dưới) để
   xác nhận `fixtures_fetched > 0`.

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

- Lịch khi kích hoạt: `0 */2 * * *` (12 lần/ngày) qua `pg_cron` + `pg_net`.
  **Hiện đã unschedule** — xem hướng dẫn kích hoạt lại ở trên.
- Ngân sách API: 1 request/lần chạy × 12 = 12 requests/ngày, dư nhiều so với
  giới hạn 100/ngày của gói FREE (khi có quyền truy cập season) — còn dư địa
  để chạy tay khi cần debug.
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
- `CRON_SECRET` hiện tại: `VZzsOkBQiA7NG0y83IlNKwSNf6anzN_Wez9276iRul4`
  (đã set trên Edge Function, đã xác nhận khớp qua test thủ công ngày
  2026-07-02, status 200).

## Test thủ công

```bash
curl -X POST 'https://zzodwwlrgodsujttrbkv.supabase.co/functions/v1/sync-worldcup-data' \
  -H 'x-cron-secret: VZzsOkBQiA7NG0y83IlNKwSNf6anzN_Wez9276iRul4' \
  -H 'Content-Type: application/json' -d '{}'
```

Hoặc chạy trực tiếp qua SQL (không cần rời Supabase):
```sql
select net.http_post(
  url := 'https://zzodwwlrgodsujttrbkv.supabase.co/functions/v1/sync-worldcup-data',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', 'VZzsOkBQiA7NG0y83IlNKwSNf6anzN_Wez9276iRul4'
  ),
  body := '{}'::jsonb
);
-- rồi xem kết quả tại:
select * from net._http_response order by created desc limit 1;
```

Xem log: bảng `sync_log` (source = `api-football`) hoặc
`Supabase:get_logs` (service `edge-function`). Function có sẵn debug logging:
khi `fixtures_fetched = 0`, `error_message` trong `sync_log` sẽ chứa nguyên
văn lỗi/response từ API-FOOTBALL để chẩn đoán nhanh.

## Routes mới (đã hoạt động độc lập với sync, không phụ thuộc cron)

- `/live` — tổng hợp trận đang diễn ra / sắp diễn ra / vừa kết thúc, mọi
  vòng đấu. `revalidate = 0`.
- `/matches/[id]` — chi tiết 1 trận, subscribe realtime lọc theo đúng id
  (`filter: id=eq.<id>`) thay vì tải lại toàn bảng.

Cả hai theo đúng pattern hiện có: Server Component tải dữ liệu ban đầu →
Client Component subscribe Realtime → cập nhật UI, không polling từ Browser.
Hai route này vẫn hữu ích ngay cả khi sync tự động chưa bật — chúng hiển thị
đúng dữ liệu đang có trong `knockout_matches` (kể cả khi nhập tay) và tự cập
nhật realtime ngay khi có UPDATE thủ công qua SQL.

## Việc còn lại

- 10/16 kết quả Vòng 32 còn thiếu vẫn cần nhập tay như trước.
- Khi quyết định nâng cấp gói API-FOOTBALL: làm theo "Cách kích hoạt lại" ở
  trên.
- (Không liên quan tới nâng cấp này) `Supabase:get_advisors` báo
  `advance_winner_to_next_match` là `SECURITY DEFINER` và có thể gọi qua RPC
  bởi `anon`/`authenticated` — nên cân nhắc revoke EXECUTE nếu không chủ đích
  cho phép gọi trực tiếp từ client.
