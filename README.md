## Updates / Güncellemeler

<details>
<summary><strong>11.03.2026 — Backend Refactoring</strong></summary>

<details>
<summary>🇬🇧 English</summary>

Projenin temel özellikleri bittikten sonra kodu baştan gözden geçirdim. Bazı eksiklikleri kendim fark ettim, bazılarını da yapay zeka desteğiyle tespit ettik. Toplamda 5 adımlık bir plan çıkardık ve hepsini tamamladık.

**Issues I identified:**
- Service classes were tightly coupled. Controllers depended directly on concrete implementations instead of interfaces, violating SOLID principles.
- There was no API documentation. I was testing all endpoints through Postman, but there was no Swagger/OpenAPI integration for professional-level documentation.
- Error responses were inconsistent. Plain strings were returned instead of a structured format, which would make frontend error handling unreliable.
- There were no unit tests at all. Nothing to catch regressions.

**Issues identified with AI assistance:**
- Kafka consumers had no retry mechanism or Dead Letter Queue. A single failure meant lost messages with no recovery path.

**What we did (5 steps):**
1. **Service Interfaces**: Created 13 interfaces across all 3 services. Controllers and consumers now depend on abstractions, not implementations.
2. **Standardized Error Handling**: ErrorCode enums + ErrorResponse DTOs in all services. Consistent, structured error responses across the entire API.
3. **Swagger/OpenAPI**: Added `springdoc-openapi` to all services with JWT security scheme. All 8 controllers annotated with `@Tag`, `@Operation`, `@ApiResponse`. Now accessible via `/swagger-ui.html` on each service.
4. **Kafka DLQ & Retry**: Added `DefaultErrorHandler` with `DeadLetterPublishingRecoverer` to notification-service (3 retries, exponential backoff). Added send callbacks with error logging to task-service producer.
5. **Unit Tests**: 41 tests across 4 test classes (AuthServiceTest, UserServiceTest, TaskServiceTest, NotificationServiceTest) using JUnit 5 + Mockito.

</details>

<details>
<summary>🇹🇷 Türkçe</summary>

Projenin temel özellikleri bittikten sonra kodu baştan gözden geçirdim. Bazı eksiklikleri kendim fark ettim, bazılarını da yapay zeka desteğiyle tespit ettik. Toplamda 5 adımlık bir plan çıkardık ve hepsini tamamladık.

**Benim tespit ettiğim eksiklikler:**
- Servis sınıfları sıkı bağımlıydı. Controller'lar concrete implementasyonlara doğrudan bağımlıydı, interface kullanılmıyordu (SOLID prensiplerinin ihlali).
- API dokümantasyonu yoktu. Tüm endpoint'leri Postman üzerinden test ediyordum ancak profesyonel seviyede bir Swagger/OpenAPI entegrasyonu bulunmuyordu.
- Hata yanıtları tutarsızdı. Yapılandırılmış bir format yerine düz string döndürülüyordu. Bu durum frontend tarafında hata yönetimini güvenilmez hale getiriyordu.
- Hiç unit test yoktu. Regression'ları yakalayacak bir mekanizma bulunmuyordu.

**Yapay zekanın tespit ettiği eksiklikler:**
- Kafka consumer'larda retry mekanizması veya Dead Letter Queue yoktu. Tek bir hata, mesajın kurtarılamadan kaybolması anlamına geliyordu.

**Yapılanlar (5 adım):**
1. **Service Interface'leri**: 3 serviste toplam 13 interface oluşturuldu. Controller ve consumer'lar artık soyutlamalara bağımlı, somut sınıflara değil.
2. **Standart Hata Yönetimi**: Tüm servislerde ErrorCode enum + ErrorResponse DTO. API genelinde tutarlı, yapılandırılmış hata yanıtları.
3. **Swagger/OpenAPI**: Tüm servislere `springdoc-openapi` eklendi, JWT security scheme tanımlandı. 8 controller'a `@Tag`, `@Operation`, `@ApiResponse` annotation'ları eklendi. Her serviste `/swagger-ui.html` üzerinden erişilebilir.
4. **Kafka DLQ & Retry**: Notification service'e `DefaultErrorHandler` + `DeadLetterPublishingRecoverer` eklendi (3 retry, exponential backoff). Task service producer'a hata loglama callback'i eklendi.
5. **Unit Test'ler**: JUnit 5 + Mockito ile 4 test sınıfında toplam 41 test (AuthServiceTest, UserServiceTest, TaskServiceTest, NotificationServiceTest).

</details>

</details>

<details>
<summary><strong>09.03.2026 — Team-based Structure & Docker Fixes</strong></summary>

<details>
<summary>🇬🇧 English</summary>

The backend has been updated to work on a team-based structure.
The integration of the changes into the frontend was carried out with AI assistance.

Docker logging fix:
- Added `x-logging` anchor in `docker-compose.yml`. Each container is now limited to max 50MB of logs (5 files × 10MB).
- Applied the logging limit to all 15 services.
- Reduced Spring Boot log levels from DEBUG to INFO for production (docker profile).
- Optimized `logback-spring.xml` files: root logs go only to Logstash in docker profile, reducing Docker JSON log growth.
- Removed unnecessary author comments added by AI from source files.

Missing:
- Notification system is not working correctly.
  - ADMIN_BROADCAST notifications are not reaching admin users; separate notifications need to be created for each admin.
  - Ticket system: teamIds field is saved to the ticket but notifications are not sent to team members.
  - Ticket system: Permission checks based on sender role and team membership are missing.
- There are some missing parts on the UI side.
- Some dashboard cards on the frontend are not clickable (ticket cards, request results, etc.).
- In Task Service, team access control for user requests (requestCreateTask, requestUpdateTask, requestCompleteTask) is not enforced on the backend side; the check exists on the frontend but is missing on the backend.

</details>

<details>
<summary>🇹🇷 Türkçe</summary>

Backend takım bazlı çalışacak şekilde güncellendi.
Yapılan değişikliklerin frontend tarafına entegrasyonu yapay zeka desteği ile gerçekleştirildi.

Docker log düzeltmesi:
- `docker-compose.yml`'e `x-logging` anchor eklendi. Her konteyner maksimum 50MB log tutabilir (5 dosya × 10MB).
- 15 servisin tamamına log boyut limiti uygulandı.
- Spring Boot log seviyeleri production (docker profili) için DEBUG'dan INFO'ya düşürüldü.
- `logback-spring.xml` dosyaları optimize edildi: docker profilinde root loglar sadece Logstash'e gider, Docker JSON log büyümesi azaltıldı.
- Yapay zekanın koyduğu gereksiz author yorumları kaynak dosyalardan silindi.

Eksikler:
- Bildirim sistemi doğru çalışmıyor.
  - ADMIN_BROADCAST bildirimleri admin kullanıcılara ulaşmıyor; her admin için ayrı bildirim oluşturulması gerekiyor.
  - Ticket sistemi: teamIds alanı ticket'a yazılıyor ancak takım üyelerine bildirim gönderilmiyor.
  - Ticket sistemi: Gönderen rolü ve takım üyeliği bazlı izin kontrolü eksik.
- UI tarafında bazı eksiklikler bulunuyor.
- Frontend'te dashboard kartlarının bir kısmı tıklanabilir değil (ticket kartları, talep sonuçları vb.).
- Task Service'te kullanıcı taleplerinde (requestCreateTask, requestUpdateTask, requestCompleteTask) takım erişim kontrolü backend tarafında yapılmıyor; frontend tarafında kontrol mevcut ancak backend'de eksik.

</details>

</details>

---

# 📋 TaskManager - Microservices Task Management System

> **Author:** Yusuf Alperen Bozkurt

---

> ### ⚠️ DEVELOPMENT IN PROGRESS / GELİŞTİRME DEVAM EDİYOR
> This is a **demo version**. Development is still in progress. If you want to use it, you will need to configure it according to your own environment and requirements.
>
> Bu bir **demo sürümüdür**. Geliştirme hala devam etmektedir. Kullanmak isterseniz kendi ortamınıza ve ihtiyaçlarınıza göre konfigüre etmeniz gerekmektedir.

---

## 📝 Project Story / Proje Hikayesi

**🇬🇧 EN**
I built a fully custom-designed task manager for a small company as a **modular monolith** and deployed it to production. Since I wanted to solidify my microservices knowledge and experience building an architecture from the ground up, I decided to develop this project. The **frontend** was added minimally — just enough to test the backend APIs in a live environment. It was not built with design or UX in mind.

**🇹🇷 TR**
Küçük bir firma için tamamen kendilerine özel tasarlanmış bir görev yönetim sistemi geliştirdim, **modüler monolith** mimarisiyle canlıya aldım. Mikroservis bilgilerimi pekiştirmek ve bir mimariyi sıfırdan ayağa kaldırmak istediğim için bu projeyi geliştirmeye karar verdim. **Frontend kısmı**, sadece backend API'lerini canlı ortamda test etmek için minimal düzeyde eklenmiştir — tasarım veya kullanıcı deneyimi odaklı bir geliştirme yapılmamıştır.

---

## 📌 Notes / Notlar

**🇬🇧 EN**
I documented the problems I encountered during Docker setup and their solutions in [`DOCKER_USAGE.md`](./DOCKER_USAGE.md). If you want to adapt this project for your own use and build on top of it, feel free to do so. If you have any questions, don't hesitate to reach out to me.

> ⚠️ **Important:** You must manually create the `.env` file in the project root directory. You can simply copy and paste the contents of [`.env.example`](./.env.example) to quickly set up a test environment.

**🇹🇷 TR**
Docker kurulumu sırasında karşılaştığım sorunları ve çözümlerini [`DOCKER_USAGE.md`](./DOCKER_USAGE.md) dosyasında paylaştım. Projeyi kendinize uyarlayıp geliştirmek isterseniz tamamen özgürsünüz. Herhangi bir sorunuz olursa bana ulaşmaktan çekinmeyin.

> ⚠️ **Önemli:** Proje kök dizininde `.env` dosyasını manuel olarak oluşturmanız gerekmektedir. Hızlıca test ortamı kurmak için [`.env.example`](./.env.example) dosyasının içeriğini kopyalayıp yapıştırabilirsiniz.

---

<details>
<summary><strong>🇬🇧 English</strong></summary>

### 📖 About the Project

TaskManager is a comprehensive task management system built with microservices architecture. Users can create, assign, track tasks and manage approval workflows. The system consists of 4 independent microservices, 8 infrastructure components and a modern React frontend.

### 🏗️ Architecture

```
TaskManager/
├── backend/
│   ├── api-gateway/            # API Gateway - Single entry point
│   ├── auth-service/           # Authentication and authorization
│   ├── task-service/           # Task management (CRUD + approval flow)
│   ├── notification-service/   # Notifications and support tickets
│   └── infrastructure/         # Logstash pipeline configuration
├── frontend/                   # React + TypeScript UI
├── docker-compose.yml          # Service orchestration file
├── .env                        # Environment variables
└── DOCKER_USAGE.md             # Docker usage guide
```

### 🔧 Technologies and Versions

#### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Java | 21 | Main programming language |
| Spring Boot | 3.4.3 | Microservice framework |
| Spring Cloud Gateway | 2024.0.1 | API routing, rate limiting, CORS |
| Spring Security | 3.4.3 | Authentication and authorization |
| Spring Data JPA | 3.4.3 | PostgreSQL ORM layer |
| Spring Data MongoDB | 3.4.3 | MongoDB access layer |
| Spring Kafka | 3.4.3 | Event-driven inter-service communication |
| JJWT | 0.12.6 | JWT token generation and validation |
| MinIO Java SDK | 8.5.14 | File upload/download operations |
| Lombok | - | Boilerplate code reduction |
| Logstash Logback Encoder | 8.0 | Centralized log formatting |
| Maven | - | Build and dependency management |

#### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI component library |
| TypeScript | 5.9.3 | Type-safe JavaScript |
| Vite | 7.3.1 | Build tool and dev server |
| Tailwind CSS | 4.2.1 | Utility-first CSS framework |
| Zustand | 5.0.11 | Global state management |
| Axios | 1.13.6 | HTTP client |
| React Router DOM | 7.13.1 | Page routing |
| React Icons | 5.6.0 | Icon library |
| ESLint | 9.39.1 | Code quality control |

#### Infrastructure (Docker)

| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 17 | Database for Auth and Task services (2 separate instances) |
| MongoDB | 8 | Database for Notification service |
| Redis | 7 (Alpine) | Token cache, rate limiting, general cache |
| Apache Kafka | 7.7.1 (Confluent) | Async inter-service messaging |
| Apache Zookeeper | 7.7.1 (Confluent) | Kafka coordination service |
| MinIO | Latest | S3-compatible file storage |
| Elasticsearch | 8.17.0 | Centralized log storage and search |
| Logstash | 8.17.0 | Log collection and processing pipeline |
| Kibana | 8.17.0 | Log visualization dashboard |
| Docker & Docker Compose | - | Containerization and orchestration |

### 🧩 Microservices

#### 1. API Gateway (Port: 8080)
Single entry point for the entire system. All requests go through here.
- JWT token validation (at gateway level)
- Request routing to the appropriate service
- Redis-based rate limiting
- CORS management
- Centralized logging

#### 2. Auth Service (Port: 8081)
User authentication and authorization service.
- User registration and login (JWT-based)
- Access token + Refresh token mechanism
- Role-based authorization (USER, ADMIN, SUPER_ADMIN)
- Account locking after failed login attempts (5 attempts)
- Password reset
- Token management in Redis (blacklist + refresh token storage)
- Publishing user events via Kafka
- **22 REST endpoints**

#### 3. Task Service (Port: 8082)
Task management service with approval workflow mechanism.
- Task CRUD operations
- Admin: Direct task creation/update/deletion
- User: Submit approval request → Admin approval → Execution
- Task assignment and team leader management
- File attachment upload/download with MinIO (max 50MB)
- Redis caching
- Publishing task events via Kafka
- **18 REST endpoints**

#### 4. Notification Service (Port: 8083)
Notification and support ticket service.
- Listening to Kafka events and creating notifications
- Notification listing, marking as read
- Support ticket system
- HTML email template notifications (optional)
- Async processing support
- **10 REST endpoints**

### 📊 Project Statistics

| Metric | Value |
|--------|-------|
| Total Microservices | 4 |
| Total Infrastructure Services | 9 (including 2x PostgreSQL) |
| Total Docker Containers | 13 |
| Total REST Endpoints | 50 |
| Kafka Topics | 8 |
| Frontend Pages | 8 |
| Frontend Routes | 8 (1 public, 7 protected) |
| Databases | 3 (2x PostgreSQL + 1x MongoDB) |

### 🔄 Kafka Event Flow

Inter-service communication is handled through 8 Kafka topics:

| Topic | Publisher | Consumer | Description |
|-------|-----------|----------|-------------|
| `user-registered` | Auth Service | Notification Service | New user registration |
| `user-updated` | Auth Service | Notification Service | User info update |
| `task-created` | Task Service | Notification Service | New task creation |
| `task-updated` | Task Service | Notification Service | Task update |
| `task-deleted` | Task Service | Notification Service | Task deletion |
| `task-assigned` | Task Service | Notification Service | Task assignment |
| `task-approval-requested` | Task Service | Notification Service | Approval request |
| `task-approval-reviewed` | Task Service | Notification Service | Approval result |

### 🔐 Security Architecture

```
Client → API Gateway (JWT validation) → Microservice
                ↓
        Redis (Rate Limiting)
```

- **JWT:** Access token (15 min) + Refresh token (7 days)
- **Role Hierarchy:** SUPER_ADMIN > ADMIN > USER
- **Account Locking:** Automatic lock after 5 failed login attempts
- **Token Blacklist:** Access token is blacklisted in Redis on logout
- **Gateway Header Auth:** Gateway forwards validated user info to downstream services via headers

### 🚀 Setup and Running

#### Requirements
- Docker Desktop (WSL 2 enabled)
- `.env` file in the project root directory

#### Starting
```bash
# First run (with build)
docker compose up --build -d

# Subsequent runs
docker compose up -d
```

#### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

#### Service URLs

| Service | URL |
|---------|-----|
| API Gateway | http://localhost:8080 |
| Auth Service | http://localhost:8081 |
| Task Service | http://localhost:8082 |
| Notification Service | http://localhost:8083 |
| Kibana (Log Dashboard) | http://localhost:5601 |
| MinIO Console | http://localhost:9001 |
| Elasticsearch | http://localhost:9200 |

### 📄 Frontend Pages

| Page | Description |
|------|-------------|
| Login | User authentication |
| Dashboard | Home page - overview |
| Tasks | Task list and management |
| Task Detail | Task details, attachments, status |
| Approvals | Approval request management |
| Users | User management (admin) |
| Notifications | Notification center |
| Profile | Profile editing and password change |

</details>

---

<details>
<summary><strong>🇹🇷 Türkçe</strong></summary>

### 📖 Proje Hakkında

TaskManager, mikroservis mimarisiyle geliştirilmiş kapsamlı bir görev yönetim sistemidir. Kullanıcılar görev oluşturabilir, atayabilir, takip edebilir ve onay süreçlerini yönetebilir. Sistem, 4 bağımsız mikroservis, 8 altyapı bileşeni ve modern bir React arayüzünden oluşmaktadır.

### 🏗️ Mimari Yapı

```
TaskManager/
├── backend/
│   ├── api-gateway/            # API Gateway - Tek giriş noktası
│   ├── auth-service/           # Kimlik doğrulama ve yetkilendirme
│   ├── task-service/           # Görev yönetimi (CRUD + onay akışı)
│   ├── notification-service/   # Bildirim ve destek talepleri
│   └── infrastructure/         # Logstash pipeline konfigürasyonu
├── frontend/                   # React + TypeScript arayüz
├── docker-compose.yml          # Tüm servislerin orkestrasyon dosyası
├── .env                        # Ortam değişkenleri
└── DOCKER_USAGE.md             # Docker kullanım kılavuzu
```

### 🔧 Kullanılan Teknolojiler ve Sürümleri

#### Backend

| Teknoloji | Sürüm | Kullanım Amacı |
|-----------|-------|----------------|
| Java | 21 | Ana programlama dili |
| Spring Boot | 3.4.3 | Mikroservis framework'ü |
| Spring Cloud Gateway | 2024.0.1 | API yönlendirme, rate limiting, CORS |
| Spring Security | 3.4.3 | Kimlik doğrulama ve yetkilendirme |
| Spring Data JPA | 3.4.3 | PostgreSQL ORM katmanı |
| Spring Data MongoDB | 3.4.3 | MongoDB erişim katmanı |
| Spring Kafka | 3.4.3 | Servisler arası event-driven iletişim |
| JJWT | 0.12.6 | JWT token üretimi ve doğrulama |
| MinIO Java SDK | 8.5.14 | Dosya yükleme/indirme işlemleri |
| Lombok | - | Boilerplate kod azaltma |
| Logstash Logback Encoder | 8.0 | Merkezi log formatlaması |
| Maven | - | Build ve bağımlılık yönetimi |

#### Frontend

| Teknoloji | Sürüm | Kullanım Amacı |
|-----------|-------|----------------|
| React | 19.2.0 | UI bileşen kütüphanesi |
| TypeScript | 5.9.3 | Tip güvenli JavaScript |
| Vite | 7.3.1 | Build aracı ve dev server |
| Tailwind CSS | 4.2.1 | Utility-first CSS framework'ü |
| Zustand | 5.0.11 | Global state yönetimi |
| Axios | 1.13.6 | HTTP istemcisi |
| React Router DOM | 7.13.1 | Sayfa yönlendirme |
| React Icons | 5.6.0 | İkon kütüphanesi |
| ESLint | 9.39.1 | Kod kalite kontrolü |

#### Altyapı (Docker)

| Teknoloji | Sürüm | Kullanım Amacı |
|-----------|-------|----------------|
| PostgreSQL | 17 | Auth ve Task servislerinin veritabanı (2 ayrı instance) |
| MongoDB | 8 | Notification servisinin veritabanı |
| Redis | 7 (Alpine) | Token cache, rate limiting, genel cache |
| Apache Kafka | 7.7.1 (Confluent) | Servisler arası asenkron mesajlaşma |
| Apache Zookeeper | 7.7.1 (Confluent) | Kafka koordinasyon servisi |
| MinIO | Latest | S3 uyumlu dosya depolama |
| Elasticsearch | 8.17.0 | Merkezi log depolama ve arama |
| Logstash | 8.17.0 | Log toplama ve işleme pipeline'ı |
| Kibana | 8.17.0 | Log görselleştirme dashboard'u |
| Docker & Docker Compose | - | Konteynerizasyon ve orkestrasyon |

### 🧩 Mikroservisler

#### 1. API Gateway (Port: 8080)
Sistemin tek giriş noktası. Tüm istekler buradan geçer.
- JWT token doğrulama (gateway seviyesinde)
- İstekleri ilgili servise yönlendirme
- Redis tabanlı rate limiting
- CORS yönetimi
- Merkezi loglama

#### 2. Auth Service (Port: 8081)
Kullanıcı kimlik doğrulama ve yetkilendirme servisi.
- Kullanıcı kaydı ve giriş (JWT tabanlı)
- Access token + Refresh token mekanizması
- Rol tabanlı yetkilendirme (USER, ADMIN, SUPER_ADMIN)
- Başarısız giriş denemelerinde hesap kilitleme (5 deneme)
- Şifre sıfırlama
- Redis'te token yönetimi (blacklist + refresh token saklama)
- Kafka ile kullanıcı event'leri yayınlama
- **22 REST endpoint**

#### 3. Task Service (Port: 8082)
Görev yönetimi servisi. Onay akışı mekanizması içerir.
- Görev CRUD işlemleri
- Admin: Direkt görev oluşturma/güncelleme/silme
- User: Onay talebi gönderme → Admin onayı → İşlem
- Görev atama ve takım lideri yönetimi
- MinIO ile dosya eki yükleme/indirme (max 50MB)
- Redis cache
- Kafka ile görev event'leri yayınlama
- **18 REST endpoint**

#### 4. Notification Service (Port: 8083)
Bildirim ve destek talebi servisi.
- Kafka event'lerini dinleme ve bildirim oluşturma
- Bildirim listeleme, okundu işaretleme
- Destek talebi (ticket) sistemi
- HTML e-posta şablonları ile bildirim gönderme (opsiyonel)
- Asenkron işlem desteği
- **10 REST endpoint**

### 📊 Proje İstatistikleri

| Metrik | Değer |
|--------|-------|
| Toplam Mikroservis | 4 |
| Toplam Altyapı Servisi | 9 (2x PostgreSQL dahil) |
| Toplam Docker Container | 13 |
| Toplam REST Endpoint | 50 |
| Kafka Topic Sayısı | 8 |
| Frontend Sayfa Sayısı | 8 |
| Frontend Route Sayısı | 8 (1 public, 7 protected) |
| Veritabanı Sayısı | 3 (2x PostgreSQL + 1x MongoDB) |

### 🔄 Kafka Event Akışı

Servisler arası iletişim 8 Kafka topic'i üzerinden sağlanır:

| Topic | Yayınlayan | Dinleyen | Açıklama |
|-------|-----------|----------|----------|
| `user-registered` | Auth Service | Notification Service | Yeni kullanıcı kaydı |
| `user-updated` | Auth Service | Notification Service | Kullanıcı bilgisi güncelleme |
| `task-created` | Task Service | Notification Service | Yeni görev oluşturma |
| `task-updated` | Task Service | Notification Service | Görev güncelleme |
| `task-deleted` | Task Service | Notification Service | Görev silme |
| `task-assigned` | Task Service | Notification Service | Görev atama |
| `task-approval-requested` | Task Service | Notification Service | Onay talebi |
| `task-approval-reviewed` | Task Service | Notification Service | Onay sonucu |

### 🔐 Güvenlik Mimarisi

```
İstemci → API Gateway (JWT doğrulama) → Mikroservis
                ↓
        Redis (Rate Limiting)
```

- **JWT:** Access token (15 dk) + Refresh token (7 gün)
- **Rol Hiyerarşisi:** SUPER_ADMIN > ADMIN > USER
- **Hesap Kilitleme:** 5 başarısız girişten sonra otomatik kilitleme
- **Token Blacklist:** Çıkış yapıldığında access token Redis'te blacklist'e eklenir
- **Gateway Header Auth:** Gateway, doğrulanmış kullanıcı bilgisini header ile downstream servislere iletir

### 🚀 Kurulum ve Çalıştırma

#### Gereksinimler
- Docker Desktop (WSL 2 aktif)
- `.env` dosyası proje kök dizininde

#### Başlatma
```bash
# İlk çalıştırma (build dahil)
docker compose up --build -d

# Sonraki çalıştırmalar
docker compose up -d
```

#### Frontend Geliştirme
```bash
cd frontend
npm install
npm run dev
```

#### Servis Adresleri

| Servis | URL |
|--------|-----|
| API Gateway | http://localhost:8080 |
| Auth Service | http://localhost:8081 |
| Task Service | http://localhost:8082 |
| Notification Service | http://localhost:8083 |
| Kibana (Log Dashboard) | http://localhost:5601 |
| MinIO Console | http://localhost:9001 |
| Elasticsearch | http://localhost:9200 |

### 📄 Frontend Sayfaları

| Sayfa | Açıklama |
|-------|----------|
| Login | Kullanıcı girişi |
| Dashboard | Ana sayfa - genel bakış |
| Tasks | Görev listesi ve yönetimi |
| Task Detail | Görev detayı, ekler, durum |
| Approvals | Onay talepleri yönetimi |
| Users | Kullanıcı yönetimi (admin) |
| Notifications | Bildirim merkezi |
| Profile | Profil düzenleme ve şifre değiştirme |

</details>
