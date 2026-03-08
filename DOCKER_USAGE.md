# TaskManager - Docker Kullanım Kılavuzu

## Gereksinimler

- Docker Desktop (WSL 2 entegrasyonu aktif)
- `.env` dosyası proje kök dizininde mevcut olmalı

## İlk Kurulum (İlk Build)

Tüm image'ları build edip container'ları başlatır. İlk seferde Maven dependency'leri indirildiği için uzun sürebilir, sonraki build'ler cache sayesinde çok daha hızlıdır.

```bash
docker compose up --build -d
```

## Günlük Kullanım

### Container'ları Başlatma (build olmadan)

```bash
docker compose up -d
```

### Container'ları Durdurma

Verileri koruyarak durdurur (volume'lar silinmez):

```bash
docker compose down
```

### Container'ları Durdurma + Verileri Silme

Tüm volume'ları (DB verileri, Kafka, Redis vb.) silerek temiz başlangıç yapar:

```bash
docker compose down -v
```

### Tek Bir Servisi Yeniden Başlatma

Sadece değişiklik yaptığınız servisi yeniden build edip başlatır:

```bash
docker compose up --build -d auth-service
docker compose up --build -d task-service
docker compose up --build -d notification-service
docker compose up --build -d api-gateway
```

### Servis Durumunu Kontrol Etme

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Servis Loglarını İzleme

```bash
# Tüm loglar
docker compose logs -f

# Belirli bir servisin logları
docker compose logs -f auth-service
docker compose logs -f task-service

# Son 100 satır
docker compose logs --tail 100 auth-service
```

## Servis Adresleri

| Servis               | Adres                    |
| -------------------- | ------------------------ |
| API Gateway          | http://localhost:8080     |
| Auth Service         | http://localhost:8081     |
| Task Service         | http://localhost:8082     |
| Notification Service | http://localhost:8083     |
| Kibana (Loglar)      | http://localhost:5601     |
| MinIO Console        | http://localhost:9001     |
| Elasticsearch        | http://localhost:9200     |

## Sorun Giderme

### Kafka başlamıyor (NodeExistsException)

Zookeeper'da eski broker node'u kalmış demektir. Volume'ları temizleyin:

```bash
docker compose down -v
docker compose up -d
```

### Build çok uzun sürüyor

İlk build'den sonra Maven cache'i BuildKit tarafından saklanır. Sonraki build'ler çok daha hızlı olacaktır. Cache'i temizlemeniz gerekirse:

```bash
docker builder prune --filter type=exec.cachemount -f
```

### Bir container sürekli restart ediyorsa

```bash
docker logs <container-adi>
```

komutuyla hatayı kontrol edin.
