(function (A) {
  const D = A.AbilityData, TAU = Math.PI * 2, REGEN = 6; // regen energi per detik

  function fx(s, x, y, r0, r1, dur, c) { if (s.fx.length < 24) s.fx.push({ x, y, r0, r1, t: 0, dur, c }); }

  // Damage ke musuh dari kemampuan (menghitung kill dan skor).
  function hurt(s, e, dmg) {
    if (e.dead) return;
    e.hp -= dmg; e.flash = 0.1; e.aggro = true;
    if (e.hp <= 0) { e.dead = true; A.Scoring.onKill(s, e); }
  }

  // Kemampuan yang aktif pada slot: dipaksa mode/misi, dilarang, atau dari loadout pemain.
  function slotsFor(s) {
    const m = s.mode, r = s.rules || {}, forced = r.forced || m.forcedAbilities;
    if (forced) return forced.slice(0, 2);
    if (m.noAbilities || r.noAbilities) return [];
    let l = A.Storage.getLoadout();
    if (m.allowedAbilities) l = l.filter(id => m.allowedAbilities.indexOf(id) >= 0);
    return l;
  }

  const EFFECT = {
    dash(s) {
      const p = s.player, m = A.Input.getMove();
      let dx = m.x, dy = m.y;
      if (!dx && !dy) { dx = Math.cos(p.aim); dy = Math.sin(p.aim); }
      const l = Math.hypot(dx, dy) || 1;
      p.dash = { t: 0.17, vx: dx / l * 820, vy: dy / l * 820 };
      p.invuln = Math.max(p.invuln, 0.3);
      fx(s, p.x, p.y, 10, 34, 0.25, '34,228,255');
    },
    shield(s) { s.player.shieldT = D.shield.dur; fx(s, s.player.x, s.player.y, 10, 40, 0.3, '122,162,255'); },
    pulse(s) {
      const p = s.player;
      for (const e of s.enemies) {
        const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
        if (d >= 150) continue;
        hurt(s, e, 30);
        if (!e.dead && !e.d.boss) { e.x += dx / d * 40; e.y += dy / d * 40; }
      }
      fx(s, p.x, p.y, 10, 150, 0.35, '255,61,242');
    },
    mine(s) { s.mines.push({ x: s.player.x, y: s.player.y, r: 10, life: 25, armed: 0.5 }); },
    slow(s) { if (s.fields.length >= 2) s.fields.shift(); s.fields.push({ x: s.player.x, y: s.player.y, r: 120, t: D.slow.dur }); },
    heal(s) { const st = s.player.stats; st.health = Math.min(st.maxHealth, st.health + 35); fx(s, s.player.x, s.player.y, 8, 36, 0.4, '77,255,154'); }
  };

  function use(s, slot) {
    const id = s.slots[slot];
    if (!id) return false;
    const d = D[id], p = s.player;
    if (s.cd[slot] > 0 || p.stats.energy < d.cost) return false;
    if (id === 'heal' && (s.mode.noHeal || s.rules.noHeal)) return false;
    if (id === 'mine' && s.mines.length >= 3) return false;
    p.stats.energy -= d.cost; s.cd[slot] = d.cd; s.cdMax[slot] = d.cd;
    s.abilCount++; s.abilUses[id] = (s.abilUses[id] || 0) + 1;
    EFFECT[id](s);
    return true;
  }

  function update(s, dt) {
    const p = s.player;
    p.stats.energy = Math.min(p.stats.maxEnergy, p.stats.energy + REGEN * p.mods.energy * dt);
    if (s.cd[0] > 0) s.cd[0] -= dt;
    if (s.cd[1] > 0) s.cd[1] -= dt;
    for (const slot of A.Input.takeAbilities()) use(s, slot);
    if (p.shieldT > 0) p.shieldT -= dt;

    for (const m of s.mines) {
      m.life -= dt;
      if (m.armed > 0) { m.armed -= dt; continue; }
      for (const e of s.enemies) {
        if (e.dead || Math.hypot(e.x - m.x, e.y - m.y) > m.r + e.r + 22) continue;
        for (const t of s.enemies) if (!t.dead && Math.hypot(t.x - m.x, t.y - m.y) < 80 + t.r) hurt(s, t, 55);
        fx(s, m.x, m.y, 8, 80, 0.3, '255,154,60'); m.life = 0; break;
      }
    }
    s.mines = s.mines.filter(m => m.life > 0);
    for (const f of s.fields) f.t -= dt;
    s.fields = s.fields.filter(f => f.t > 0);
    for (const f of s.fx) f.t += dt;
    s.fx = s.fx.filter(f => f.t < f.dur);
  }

  function slowMul(s, e) {
    for (const f of s.fields) if (Math.hypot(e.x - f.x, e.y - f.y) < f.r) return 0.45;
    return 1;
  }

  function drawBelow(ctx, s) {
    for (const f of s.fields) {
      ctx.fillStyle = 'rgba(111,247,255,.09)'; ctx.strokeStyle = 'rgba(111,247,255,.5)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
    }
    for (const m of s.mines) {
      ctx.fillStyle = m.armed > 0 || Math.floor(m.life * 3) % 2 ? '#ff9a3c' : '#7a4a1c';
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, TAU); ctx.fill();
    }
  }

  function drawAbove(ctx, s) {
    const p = s.player;
    if (p.shieldT > 0) {
      ctx.strokeStyle = 'rgba(122,162,255,' + (p.shieldT < 0.8 ? 0.4 : 0.9) + ')'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 8, 0, TAU); ctx.stroke();
    }
    for (const f of s.fx) {
      const k = f.t / f.dur;
      ctx.strokeStyle = 'rgba(' + f.c + ',' + (1 - k) + ')'; ctx.lineWidth = 4 * (1 - k) + 1;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r0 + (f.r1 - f.r0) * k, 0, TAU); ctx.stroke();
    }
  }

  A.Abilities = { slotsFor, use, update, slowMul, hurt, drawBelow, drawAbove };
})(window.Arena);
