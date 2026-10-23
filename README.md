# Mufa Arena

Game #4 Mufa Games. HTML5 + CSS3 + JavaScript murni, Canvas 2D, tanpa aset eksternal.

## Menjalankan
Buka `index.html` di browser, atau upload folder ini ke hosting statis (mis. GitHub Pages).

## Status pengembangan
- [x] Tahap 1 — Arena dan gerakan
- [x] Tahap 2 — Pertarungan dasar
- [x] Tahap 3 — Mode dasar (Arena Classic, Time Attack, Endless Survival, Crystal Hunt)
- [x] Tahap 4 — Mode objektif (Zone Control, Core Escort, Shadow Run, Closing Ring)
- [x] Tahap 5 — Kemampuan dan tantangan (Boss Rush, Build & Survive, Hazard Lab, Tactical Trials, 6 kemampuan)
- [x] Tahap 6 — Progres dan UI final (partikel, 12 achievement, statistik, pengaturan, lanjutkan)
- [ ] Tahap 7 — Pengujian dan rilis

## Tutorial
Pengunjung pertama langsung masuk tutorial interaktif 5 langkah. Tutorial juga tersedia sebagai mode "Tutorial" dan tombol "Cara bermain" di menu utama.

## Boss, build, dan progres
Boss Rush punya 8 level (1 boss per level). Endless Survival memunculkan boss tiap 5 wave dan memberi upgrade tanpa batas slot. Tutorial, tombol kemampuan, dan notifikasi tampil di dock di bawah arena, bukan di atas canvas. Progres (rekor, level, achievement, statistik, pengaturan) disimpan di localStorage.

## Kemampuan dan level
Enam kemampuan (Dash, Shield, Pulse, Mine, Slow Field, Heal) dipilih maksimal 2 lewat menu "Kemampuan". Zone Control, Core Escort, Shadow Run, Hazard Lab, dan Tactical Trials memakai sistem level: level berikutnya terbuka setelah level sebelumnya dimenangkan.

## Kontrol
| Aksi | Desktop | Mobile |
|---|---|---|
| Gerak | WASD / panah | Joystick kiri |
| Bidik | Mouse | Joystick kanan |
| Tembak | Klik / Space (otomatis jika musuh searah bidikan) | Joystick kanan |
| Kemampuan | Shift (slot 1), Q atau E (slot 2) | Tombol bulat |
| Pause | Esc / P | Tombol II |
