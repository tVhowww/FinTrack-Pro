# PROJECT STATUS - FinTrack Pro

**Ngày rà soát:** 13/05/2026  
**Vai trò rà soát:** Technical Product Manager kiêm Lead Architect  
**Phạm vi:** Frontend Next.js, Backend Spring Boot Microservices, API Gateway, Docker/DevOps.

---

## 1. Kiến trúc & Tech Stack hiện tại

### Tổng quan công nghệ

| Lớp                 | Công nghệ/Thành phần                                                   | Ghi chú                                                                              |
| ------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Frontend            | Next.js 16, React 19, TypeScript, Tailwind CSS 4                       | App Router, client-side dashboard, middleware bảo vệ route                           |
| UI/UX               | Radix UI/shadcn-style components, lucide-react, next-themes, Sonner    | Dialog, table, select, theme toggle, toast                                           |
| Data fetching       | Axios, TanStack React Query                                            | `withCredentials=true`, interceptor refresh token, cache/invalidate theo module      |
| Charting            | Recharts                                                               | Balance trend, expense structure, highest spend                                      |
| Backend             | Java 21, Spring Boot, Spring Cloud                                     | Các service độc lập: identity, wallet, transaction, notification, discovery, gateway |
| API Gateway         | Spring Cloud Gateway WebFlux, Eureka Load Balancer, Redis Rate Limiter | Route tập trung, auth filter, CORS credentials                                       |
| Service discovery   | Netflix Eureka                                                         | `discovery-service` port 8761                                                        |
| Database            | PostgreSQL 16 Alpine                                                   | Database riêng cho Identity, Wallet, Transaction                                     |
| Migration           | Flyway                                                                 | `ddl-auto=validate`, schema qua `V1__init_schema.sql`                                |
| Cache/Session infra | Redis                                                                  | JWT blacklist, OTP, rate-limit, khóa chống double-click, exchange-rate cache         |
| Message broker      | Kafka + Zookeeper                                                      | Notification events, user-deleted events, transfer saga events                       |
| Inter-service calls | OpenFeign, WebClient                                                   | Gateway dùng reactive WebClient; domain services dùng Feign                          |
| AI                  | Spring AI + Google GenAI/Gemini                                        | Quét hóa đơn, cố vấn tài chính có tool/memory                                        |
| Export              | Apache POI                                                             | Xuất Excel lịch sử giao dịch                                                         |
| Container           | Docker Compose                                                         | Compose build toàn bộ service và hạ tầng local/prod-like                             |

### Sơ đồ service logic

```text
Browser Next.js
  -> API Gateway :8888
      -> Authentication filter đọc Authorization header hoặc HttpOnly cookie access_token
      -> gọi Identity Service /identity/auth/introspect bằng WebClient
      -> inject Authorization: Bearer <JWT> xuống service đích
          -> Identity Service :8080
          -> Wallet Service :8081
          -> Transaction Service :8082
          -> Notification Service :8083
```

### Luồng xác thực hiện tại

- Người dùng đăng nhập bằng username/password hoặc Google OAuth từ frontend.
- `identity-service` phát JWT và ghi vào cookie `access_token` với `HttpOnly`, `SameSite=Lax`, `path=/`, `maxAge=1h`; cờ `secure` phụ thuộc biến môi trường `COOKIE_SECURE`.
- Frontend không đọc token bằng JavaScript. Axios bật `withCredentials=true` để browser tự gửi cookie.
- API Gateway đọc token từ `Authorization` header trước, sau đó fallback sang cookie `access_token`.
- Gateway gọi `/identity/auth/introspect`; nếu hợp lệ thì thêm header `Authorization: Bearer <token>` cho downstream services.
- Khi gặp 401, frontend gọi `/identity/auth/refresh`, backend đọc cookie cũ, rotate JWT, blacklist JWT cũ trong Redis, rồi set cookie mới.
- Logout blacklist JWT hiện tại trong Redis và clear cookie.

### Luồng giao dịch/ví hiện tại

- Transaction Service chịu trách nhiệm tạo/sửa/xóa giao dịch, thống kê, ngân sách, AI, export.
- Wallet Service chịu trách nhiệm ví và số dư. Transaction Service gọi Wallet Service qua Feign để cập nhật số dư.
- Transfer giữa ví dùng Saga đơn giản:
  - Transaction Service tạo 2 transaction PENDING và trừ ví nguồn.
  - Transaction Service bắn Kafka topic `transfer.debit-completed`.
  - Wallet Service nhận event và cộng ví đích.
  - Wallet Service bắn `transfer.credit-completed` hoặc `transfer.credit-failed`.
  - Transaction Service cập nhật trạng thái COMPLETED hoặc COMPENSATED/FAILED và hoàn tiền nếu cần.
- Notification Service nhận Kafka topic `notification-delivery` để gửi email.

---

## 2. Những tính năng ĐÃ hoàn thành (What's Done)

### Frontend

- Dashboard tài chính với tổng số dư, thu nhập, chi tiêu, tiết kiệm tháng hiện tại.
- Biểu đồ bằng Recharts:
  - Xu hướng thu/chi theo tháng.
  - Cơ cấu chi tiêu theo danh mục.
  - Giao dịch gần đây và khoản chi lớn nhất.
- Cơ chế **Master Eye** ẩn/hiện tiền tệ:
  - Global hide qua context `HideAmountProvider`.
  - Local reveal từng card/item khi Master Eye đang bật.
  - Lưu trạng thái vào `localStorage`.
- Dark mode qua `next-themes`.
- Auth UI:
  - Login/register.
  - Google login.
  - Forgot/reset password với OTP và countdown.
  - Middleware chặn truy cập dashboard khi chưa có cookie.
- CRUD UI cho:
  - Ví.
  - Giao dịch.
  - Danh mục.
  - Ngân sách.
- Transaction UX:
  - Table desktop, card mobile.
  - Filter, pagination, export Excel.
  - AI scan hóa đơn bằng ảnh/text/giọng nói.
  - Dialog chuyển tiền nội bộ giữa ví.
- React Query đã có cache, `staleTime`, invalidate sau mutation cho transactions/statistics/wallets.
- Axios interceptor có queue để tránh nhiều request refresh token đồng thời.

### Backend

- Identity Service:
  - Đăng ký, đăng nhập, Google OAuth login.
  - JWT HS512 với `userId` và `scope`.
  - HttpOnly cookie auth.
  - Token rotation, single-session theo `currentJwtId`.
  - Blacklist JWT trong Redis.
  - Forgot/reset password bằng OTP Redis + Kafka email.
  - User/Role/Permission cơ bản.
- API Gateway:
  - Route public/private cho identity, wallet, transaction, notification.
  - Authentication Gateway Filter đọc cookie/header và introspect token.
  - Propagate JWT xuống downstream.
  - CORS credential-aware.
  - Redis rate limiter theo IP.
- Wallet Service:
  - CRUD ví, soft delete.
  - Ví BASIC/SAVING, target amount/deadline.
  - Cập nhật số dư.
  - `@Version` optimistic locking trên entity `Wallet`.
  - Chống double-click tạo ví bằng Redis lock.
- Transaction Service:
  - CRUD giao dịch, soft delete.
  - Filter/pagination theo ví, loại, ngày, danh mục, keyword.
  - Tự động cập nhật số dư ví khi tạo/sửa/xóa giao dịch.
  - Transfer nội bộ qua Saga Kafka.
  - Category tree, category seeding.
  - Budget CRUD, tính spent/percentage.
  - Budget alert 80%/100% qua Kafka email, chống spam bằng Redis key.
  - Thống kê monthly, trend, structure, highest expenses, total balance.
  - Quy đổi tiền tệ theo base currency.
  - Đồng bộ exchange rates hằng ngày và cache Redis.
  - AI scan hóa đơn và AI advisor.
  - Export Excel.
- Notification Service:
  - Consume `notification-delivery`.
  - Gửi email notification/OTP/budget alert.
  - Farewell email khi user bị xóa.

### DevOps

- `docker/docker-compose.yml` đã dựng được stack local/prod-like:
  - Eureka Discovery.
  - PostgreSQL riêng cho identity/wallet/transaction.
  - pgAdmin.
  - Redis.
  - Zookeeper + Kafka.
  - Identity, Wallet, Transaction, Notification, API Gateway.
- Các service có Dockerfile riêng.
- Cấu hình qua `.env`/environment variables.
- Database schema quản lý bằng Flyway.

---

## 3. Nợ kỹ thuật & Lỗi tiềm ẩn cần xử lý

### P0 - Rủi ro nhất quán dữ liệu tiền

| Vấn đề                                              | Bằng chứng                                                                                                                                                         | Tác động                                                                                                            | Khuyến nghị                                                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Gọi HTTP/Feign đồng bộ bên trong `@Transactional`   | `TransactionCommandService.create/update/delete/transfer` gọi `walletClient.updateBalance`; `WalletService.adjustBalance` gọi `transactionClient.createAdjustment` | Transaction DB có thể rollback trong khi Wallet DB đã commit, hoặc ngược lại. Đây là lỗi rất nhạy với dữ liệu tiền. | Tách side-effect khỏi DB transaction. Dùng Saga/Outbox nhất quán, idempotency key, retry/compensation rõ ràng. |
| Publish Kafka trong transaction DB cục bộ           | `TransactionCommandService.transfer`, `AuthenticationService.forgotPassword`, `BudgetAlertEngine`                                                                  | Event có thể được gửi dù transaction DB rollback, hoặc DB commit nhưng event fail.                                  | Áp dụng Transactional Outbox + outbox relay cho Kafka.                                                         |
| Saga transfer chưa idempotent                       | Consumer xử lý theo `sagaId` nhưng chưa có inbox/dedup table                                                                                                       | Kafka retry hoặc duplicate message có thể cộng/trừ tiền lặp.                                                        | Thêm idempotency theo `sagaId + eventType`, unique constraint và processed-event table.                        |
| Optimistic lock có nhưng thiếu retry/handling chuẩn | `Wallet` có `@Version`, nhưng `updateBalance` không catch `ObjectOptimisticLockingFailureException`; caller qua Feign có thể nhận lỗi chung                        | Race condition được phát hiện nhưng UX/API có thể thất bại không kiểm soát; chưa có retry an toàn.                  | Bắt lỗi optimistic lock, trả mã lỗi nghiệp vụ 409, retry có giới hạn cho cập nhật số dư có idempotency.        |

### P1 - Hiệu năng và khả năng mở rộng

| Vấn đề                                               | Bằng chứng                                                                        | Tác động                                                                        | Khuyến nghị                                                                                                                       |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Chưa có index cho bảng lớn `transactions`            | Migration `transaction-service/V1__init_schema.sql` chỉ tạo bảng, không tạo index | Query dashboard/statistics/filter sẽ chậm khi dữ liệu tăng.                     | Thêm index: `(wallet_id, date)`, `(wallet_id, type, date)`, `(category_id)`, `(saga_id)`, partial index `WHERE is_deleted=false`. |
| Statistics đang kéo toàn bộ rows rồi tính trong Java | `TransactionStatisticsService` dùng `findAll(spec)` rồi loop/sort/group in-memory | Với nhiều giao dịch, dashboard tốn RAM/CPU và chậm.                             | Đưa aggregate xuống SQL/JPA query: `SUM/GROUP BY/LIMIT`, có currency strategy rõ hơn.                                             |
| `findHighestExpensesByWalletIds` JPQL có `LIMIT 5`   | JPQL chuẩn không hỗ trợ `LIMIT` theo cách này                                     | Có thể lỗi runtime tùy provider/version.                                        | Dùng `PageRequest.of(0, 5, Sort...)` hoặc native query.                                                                           |
| Redis lock TTL 3 giây, không release chủ động        | `lock:create_transaction`, `lock:transfer_transaction`, `lock:create_wallet`      | Nếu xử lý quá 3 giây, request thứ hai vẫn lọt; nếu fail sớm, user phải chờ TTL. | Dùng lock per-wallet/per-action, value token, release bằng compare-and-delete, TTL dài hơn p99 latency.                           |
| Gateway rate limit theo IP                           | `ipKeyResolver`                                                                   | Nhiều user sau NAT bị chia chung quota; attacker đổi IP vẫn né được.            | Sau auth, rate-limit theo userId; public endpoint theo IP + device fingerprint.                                                   |

### P1 - Frontend

| Vấn đề                                                                | Bằng chứng                                                                       | Tác động                                                                    | Khuyến nghị                                                                |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Object URL preview hóa đơn chưa revoke                                | `TransactionDialog` tạo `URL.createObjectURL(file)` và chỉ `setPreviewUrl(null)` | Có thể rò bộ nhớ khi scan nhiều ảnh trong một phiên.                        | `URL.revokeObjectURL` khi đổi ảnh, đóng dialog, unmount.                   |
| Polling transfer chạy trong mutation, không hủy khi component unmount | `useTransactions.transferMutation` polling tối đa 10 lần bằng `setTimeout`       | Không phải leak vô hạn, nhưng request vẫn có thể chạy sau khi UI rời trang. | Dùng abort/cancel flag hoặc backend status subscription/SSE/WebSocket.     |
| Callback/object chưa memo hóa ở một số trang lớn                      | `TransactionsPage` tạo `queryParams`, handlers, columns mỗi render               | Với bảng lớn/form phức tạp có thể render thừa.                              | `useMemo` cho query params/columns, `useCallback` cho handlers truyền sâu. |
| `useHideAmount` value functions tạo lại mỗi render                    | Context provider không memoize value                                             | Tất cả consumer re-render khi provider render.                              | Dùng `useCallback`/`useMemo` cho context value nếu dashboard mở rộng.      |

### P1 - Security/Correctness

- Cookie `SameSite=Lax` phù hợp local/simple navigation, nhưng nếu frontend/backend khác domain production cần rà lại `SameSite=None; Secure=true`.
- Public endpoint detection trong Gateway dùng `path::contains`; nên đổi sang matcher chính xác để tránh route ngoài ý muốn chứa cùng chuỗi.
- Internal secret đang được Gateway add header; các downstream có `InternalAccessFilter`, nhưng cần đảm bảo mọi internal endpoint thật sự bị chặn nếu gọi trực tiếp.
- Một số file comment/log hiển thị mojibake khi đọc trên terminal, cần chuẩn hóa UTF-8 để tránh tài liệu/log tiếng Việt bị lỗi mã hóa.
- Dependency backend đang có dấu hiệu trộn version: parent Spring Boot 4.x nhưng một số dependency khai báo explicit 3.x/4.0.2. Nên để BOM quản lý version để giảm rủi ro incompatibility.

### P2 - Vận hành & quan sát hệ thống

- Chưa thấy CI/CD pipeline.
- Chưa có distributed tracing giữa Gateway -> services -> Kafka.
- Chưa có centralized logging/metrics dashboard.
- Docker Compose chưa khai báo healthcheck cho Kafka/Redis/service app đầy đủ.
- Chưa có Testcontainers/integration tests cho luồng tiền liên service.
- Chưa có OpenAPI gateway aggregation hoặc API contract tests.

---

## 4. Backlog & Lộ trình tiếp theo

### Ưu tiên P0/P1 - Kiến trúc tiền và độ tin cậy

- [x] Thiết kế lại luồng Transaction-Wallet theo Saga/Outbox, không gọi Feign cập nhật số dư trực tiếp trong transaction DB cục bộ.
- [x] Thêm `idempotencyKey` cho create transaction, transfer, adjust balance.
- [x] Thêm processed-event/inbox table để consumer Kafka idempotent theo `eventId`/`sagaId`.
- [x] Chuẩn hóa optimistic locking: trả HTTP 409, retry có giới hạn, log correlation id.
- [x] Thêm migration index cho `transactions`, `wallets`, `budgets`, `categories`, `exchange_rates`.
- [ ] Viết integration tests cho create/update/delete transaction, insufficient balance, concurrent update, transfer success/failure/duplicate event.
- [x] Tách notification/email side effect khỏi transaction chính bằng Outbox.

### Product features để thành app tài chính hoàn chỉnh

- [ ] Recurring transactions: lương, tiền thuê nhà, subscription.
- [ ] Debt/loan tracking: cho vay, đi vay, lịch trả nợ.
- [ ] Financial goals nâng cao: nhiều mục tiêu, đóng góp định kỳ, dự báo ngày đạt mục tiêu.
- [ ] Multi-account import: upload CSV/Excel từ ngân hàng, mapping cột, chống trùng giao dịch.
- [ ] Rules engine tự động phân loại giao dịch theo merchant/nội dung.
- [ ] Budget rollover: ngân sách dư/thâm hụt chuyển sang tháng sau.
- [ ] Shared wallets/family finance: phân quyền thành viên, audit log.
- [ ] Attachment management: lưu hóa đơn/biên lai, preview, liên kết giao dịch.
- [ ] Cashflow forecast: dự báo dòng tiền 30/60/90 ngày.
- [ ] Net worth dashboard: tài sản, nợ, mục tiêu, biểu đồ tài sản ròng.
- [ ] Notification center trong app, không chỉ email.
- [ ] Mobile/PWA support: installable app, offline-first cho nhập giao dịch nhanh.

### Data & Analytics

- [ ] Chuẩn hóa currency conversion: lưu `originalAmount`, `originalCurrency`, `baseAmount`, `rateSnapshot`.
- [ ] Tạo materialized view hoặc summary table cho dashboard tháng.
- [ ] Thêm audit trail cho mọi thay đổi số dư ví.
- [ ] Thêm reconciliation job so sánh `wallet.balance` với tổng transaction hợp lệ.
- [ ] Thêm data retention/backup/restore strategy.

### Security

- [ ] CSRF protection cho cookie-based auth hoặc double-submit CSRF token.
- [x] Nâng cookie production thành `Secure=true`, rà `SameSite` theo domain thực tế.
- [x] Chính xác hóa public route matcher ở Gateway.
- [x] Rate limit theo userId cho private API, IP cho public API.
- [ ] Secrets management: không dùng `.env` rời trong production; chuyển sang Vault/Secret Manager/Kubernetes Secret.
- [ ] Thêm account lockout/risk checks cho login và OTP.

### Frontend quality

- [x] Revoke object URL trong AI receipt preview.
- [x] Memoize query params/columns/handlers ở các page table lớn.
- [x] Hủy polling transfer khi component unmount hoặc chuyển sang SSE/WebSocket.
- [ ] Thêm skeleton/loading/error states thống nhất cho dashboard.
- [ ] Thêm E2E tests bằng Playwright cho login, CRUD ví, CRUD giao dịch, transfer.
- [ ] Thêm accessibility pass cho dialog/form/table.

### DevOps & Observability

- [ ] CI pipeline: lint frontend, build frontend, Maven test/build từng service.
- [ ] Docker image build + vulnerability scan.
- [ ] CD pipeline theo environment: dev/staging/prod.
- [ ] Distributed tracing với OpenTelemetry + Zipkin/Tempo.
- [ ] Metrics với Prometheus + Grafana.
- [ ] Centralized logging với Loki/ELK.
- [ ] Kafka UI và dead-letter topic cho consumer lỗi.
- [ ] Health/readiness probes cho từng service.
- [ ] Contract tests giữa Gateway/Identity/Wallet/Transaction.

---

## Kết luận điều hành

FinTrack Pro đã vượt qua mức prototype UI đơn giản: hệ thống có microservices đầy đủ, Gateway, discovery, auth bằng HttpOnly cookie, Kafka notification, Redis, dashboard thống kê, ví/giao dịch/ngân sách, AI scan hóa đơn và transfer saga. Nền tảng sản phẩm đã khá giàu tính năng.

Điểm cần xử lý trước khi coi là production-grade là **tính nhất quán dữ liệu tiền**. Các luồng hiện tại vẫn trộn DB transaction cục bộ với Feign/Kafka side effects, nên cần ưu tiên Outbox/Saga/idempotency/index/test concurrency trước khi mở rộng feature lớn.
