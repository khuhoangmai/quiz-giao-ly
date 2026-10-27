/* Lõi dùng chung: đăng ký bộ đề, lưu tiến độ, âm thanh */
(function () {
  var P = 'gl-mt-v1:';

  var QUIZ = (window.QUIZ = {
    sets: {},
    order: [],
    groups: [
      { id: 'dc', title: '1. Đề cương', desc: '45 câu trong đề cương ôn tập' },
      { id: 'tn', title: '2. Trắc nghiệm khách quan', desc: 'Bộ câu hỏi giáo lý tổng giáo phận · 180 câu (6 đề × 30 câu)' },
      { id: 'dt', title: '3. Điền từ vào chỗ chấm', desc: 'Hoàn thành câu Kinh Thánh · 300 câu (10 đề × 30 câu)' },
      { id: 'ls', title: '4. Lược sử Giáo phận Thái Bình', desc: 'Cập nhật theo Kỷ yếu 80 năm thành lập · 70 câu' }
    ],
    register: function (s) {
      this.sets[s.id] = s;
      this.order.push(s.id);
    },
    total: function (s) {
      return s.kind === 'random' ? s.count : s.questions.length;
    }
  });

  /* ---------- Lưu tiến độ (localStorage, có try/catch) ---------- */
  QUIZ.store = {
    get: function (id) {
      try { return JSON.parse(localStorage.getItem(P + id)); } catch (e) { return null; }
    },
    set: function (id, v) {
      try { localStorage.setItem(P + id, JSON.stringify(v)); } catch (e) { /* bỏ qua */ }
    },
    clearAll: function () {
      try {
        Object.keys(localStorage).forEach(function (k) {
          if (k.indexOf(P) === 0 && k !== P + 'sound') localStorage.removeItem(k);
        });
      } catch (e) { /* bỏ qua */ }
    }
  };

  /* ---------- Âm thanh (Web Audio, không cần tệp mp3) ---------- */
  var ctx = null;
  function audio() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (C) { try { ctx = new C(); } catch (e) { ctx = null; } }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function note(c, freq, start, dur, type, vol) {
    var o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(start); o.stop(start + dur + 0.03);
  }

  var soundOn = true;
  try { soundOn = localStorage.getItem(P + 'sound') !== '0'; } catch (e) { /* mặc định bật */ }

  QUIZ.sound = {
    get on() { return soundOn; },
    toggle: function () {
      soundOn = !soundOn;
      try { localStorage.setItem(P + 'sound', soundOn ? '1' : '0'); } catch (e) { /* bỏ qua */ }
      if (soundOn) this.play(true);
      return soundOn;
    },
    /* đúng: 3 nốt đi lên vui tai; sai: tiếng trầm "bụp" đi xuống */
    play: function (ok) {
      if (!soundOn) return;
      var c = audio(); if (!c) return;
      var t = c.currentTime;
      if (ok) {
        note(c, 659.25, t, 0.16, 'triangle', 0.28);
        note(c, 830.61, t + 0.09, 0.16, 'triangle', 0.28);
        note(c, 1046.5, t + 0.18, 0.32, 'triangle', 0.3);
      } else {
        var o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(230, t);
        o.frequency.exponentialRampToValueAtTime(95, t + 0.38);
        f.type = 'lowpass'; f.frequency.value = 900;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.32, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
        o.connect(f); f.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.45);
      }
    },
    unlock: function () { audio(); }
  };

  /* Tiện ích */
  QUIZ.shuffle = function (a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };
})();
