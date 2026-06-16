# SahaTakipWeb — Docker ile canlıya alma

Backend gibi GitHub'dan çekip `docker-compose` ile çalıştırın.

## Sunucuda ilk kurulum

### 1) Host Nginx'i kapatın (isteğe bağlı)

Web container dışarıda **5173** portunda yayınlanır (içeride Nginx 80):

```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
```

UFW ve hosting panelinde **5173/tcp** açın (80 dışarı açılmayacak):

```bash
sudo ufw allow 5173/tcp
```

### 2) Repoyu klonlayın

```bash
cd /opt
sudo git clone https://github.com/BestDeveloper2025/SahaTakipWeb.git
cd SahaTakipWeb
```

### 3) Build ve başlat

```bash
docker-compose up -d --build
```

### 4) Kontrol

```bash
docker ps | grep sahatakip-web
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5173/
```

Tarayıcı: `http://77.92.152.65:5173/`

## Güncelleme (yeni kod push sonrası)

```bash
cd /opt/SahaTakipWeb
git pull
docker-compose up -d --build
```

## Notlar

- Backend ayrı dizinde (`/opt/BestServiceTracking`) çalışmaya devam eder; API `host.docker.internal:3004` üzerinden proxy edilir.
- `VITE_API_BASE` değişecekse `docker-compose.yml` içindeki `build.args` güncelleyip yeniden build edin.
- Domain veya farklı IP kullanıyorsanız aynı argümanı kendi adresinizle değiştirin.
