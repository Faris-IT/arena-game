# Mengunggah ke GitHub: arena-game

Ganti `Faris-IT` jika nama akunmu berbeda (URL Pages memakai huruf kecil: `faris-it.github.io`).

## 1. Buat repo dan unggah

**Cara cepat (GitHub CLI `gh`):**
```bash
cd arena-game
git init -b main
git add .
git commit -m "feat: Mufa Arena v1.0.0"
gh repo create Faris-IT/arena-game --public --source=. --remote=origin --push \
  --description "Game arena arcade-survival di browser: 12 mode, 8 boss, 6 kemampuan. HTML5 Canvas + JavaScript murni, tanpa library. Main di desktop dan HP." \
  --homepage "https://faris-it.github.io/arena-game/"
```

**Cara manual:** buat repo kosong bernama `arena-game` di github.com/new (tanpa README), lalu:
```bash
git remote add origin https://github.com/Faris-IT/arena-game.git
git push -u origin main
```

## 2. Aktifkan GitHub Pages (website)
Settings → Pages → **Build and deployment → Source: GitHub Actions**. Workflow `pages.yml` akan men-deploy setiap push ke `main`.
Dengan `gh`: `gh api -X POST repos/Faris-IT/arena-game/pages -f build_type=workflow`

Setelah deploy selesai, game ada di **https://faris-it.github.io/arena-game/**

## 3. Isi bagian "About" (roda gigi di kanan atas halaman repo)
- **Description**
  `Game arena arcade-survival di browser: 12 mode, 8 boss, 6 kemampuan. HTML5 Canvas + JavaScript murni, tanpa library. Main di desktop dan HP.`
- **Website**: `https://faris-it.github.io/arena-game/`
- **Topics**
  `html5-game` `canvas-game` `javascript-game` `browser-game` `arcade-game` `survival-game` `boss-rush` `wave-survival` `top-down-shooter` `vanilla-javascript` `html5-canvas` `no-dependencies` `mobile-friendly` `touch-controls` `indie-game` `game-development` `github-pages` `indonesia`
- Centang **Releases** dan **Deployments** agar tampil di sidebar.

Dengan `gh`:
```bash
gh repo edit Faris-IT/arena-game --add-topic html5-game,canvas-game,javascript-game,browser-game,arcade-game,survival-game,boss-rush,wave-survival,top-down-shooter,vanilla-javascript,html5-canvas,no-dependencies,mobile-friendly,touch-controls,indie-game,game-development,github-pages,indonesia
```

## 4. Social preview (gambar saat tautan dibagikan)
Settings → General → **Social preview → Upload an image** → pilih `docs/social-preview.png` (1280×640). Hanya bisa lewat web, tidak ada perintah `gh`-nya.

## 5. Rilis v1.0.0
File `arena-game-v1.0.0.zip` (hanya file game) dilampirkan sebagai aset rilis.
```bash
git tag v1.0.0
git push origin v1.0.0
gh release create v1.0.0 arena-game-v1.0.0.zip \
  --title "Mufa Arena v1.0.0" --notes-file docs/RELEASE_NOTES.md
```
Lewat web: Releases → Draft a new release → tag `v1.0.0` → tempel isi `docs/RELEASE_NOTES.md` → lampirkan zip → Publish.

## 6. Tips supaya repo makin menarik
1. **Ganti gambar cuplikan dengan hasil rekaman asli.** Rekam 10–15 detik permainan (ShareX/ScreenToGif di Windows, atau perekam layar HP), simpan sebagai `docs/demo.gif` (di bawah 10 MB), lalu tambahkan di README tepat di bawah tombol "Main sekarang": `![Demo](docs/demo.gif)`.
2. **Pin repo** ini di profilmu (Customize your pins).
3. **README profil**: buat repo bernama sama dengan username (`Faris-IT/Faris-IT`) berisi `README.md`, tampilkan arena-game di bagian proyek.
4. Aktifkan **Discussions** (Settings → Features) untuk saran boss atau level.
5. Beri label di Issues: `bug`, `enhancement`, `good first issue`, `level-baru`, `boss-baru`.
6. Commit rapi (`feat:`, `fix:`, `docs:`), dan catat tiap rilis di `CHANGELOG.md`.
7. Bagikan tautan Pages (bukan tautan repo) saat promosi: orang bisa langsung main, dan gambar social preview akan tampil.
8. Uji tautan Pages di HP sebelum dibagikan, terutama kontrol sentuh.

## Catatan
- Isi `og:image` dan `og:url` di `index.html` mengarah ke `faris-it.github.io/arena-game`. Ubah jika username atau nama repo berbeda.
- Gambar di `docs/screenshots/` dirender dari kode (`npm run screenshots`); ganti dengan tangkapan layar browser jika mau.
