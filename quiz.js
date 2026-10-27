/* Trang làm bài: quiz.html?set=<id> */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var LETTERS = ['A', 'B', 'C', 'D'];

  var setId = new URLSearchParams(location.search).get('set');
  var set = QUIZ.sets[setId];
  if (!set) { location.replace('index.html'); return; }
  var group = QUIZ.groups.filter(function (g) { return g.id === set.group; })[0];

  var S;                 // trạng thái hiện tại: {items, ans, cur, best, last}
  var persist = true;    // false khi đang luyện lại các câu sai
  var backup = null;     // lưu bài chính khi vào chế độ luyện câu sai
  var justAnswered = false;

  /* ---------- Khởi tạo ---------- */
  function fill(n) { var a = []; for (var i = 0; i < n; i++) a.push(-1); return a; }

  function fixedItems() {
    return set.questions.map(function (_, i) { return { src: setId, idx: i }; });
  }

  function drawRandom() {
    var pool = [];
    set.pool.forEach(function (pid) {
      var ps = QUIZ.sets[pid];
      if (ps) ps.questions.forEach(function (_, i) { pool.push({ src: pid, idx: i }); });
    });
    return QUIZ.shuffle(pool).slice(0, set.count);
  }

  function init(fresh) {
    persist = true; backup = null;
    var saved = QUIZ.store.get(setId) || {};
    var keep = { best: saved.best, last: saved.last };
    if (set.kind === 'random') {
      if (!fresh && Array.isArray(saved.items) && saved.items.length && Array.isArray(saved.ans)) {
        S = { items: saved.items, ans: saved.ans, cur: saved.cur || 0, best: keep.best, last: keep.last };
      } else {
        var items = drawRandom();
        S = { items: items, ans: fill(items.length), cur: 0, best: keep.best, last: keep.last };
      }
    } else {
      var n = set.questions.length;
      if (!fresh && Array.isArray(saved.ans) && saved.ans.length === n) {
        S = { items: fixedItems(), ans: saved.ans, cur: saved.cur || 0, best: keep.best, last: keep.last };
      } else {
        S = { items: fixedItems(), ans: fill(n), cur: 0, best: keep.best, last: keep.last };
      }
    }
    if (S.cur >= S.items.length) S.cur = 0;
    save();
    $('#retryBanner').hidden = true;
    $('#result').hidden = true;
    render();
  }

  function save() {
    if (!persist) return;
    var o = { ans: S.ans, cur: S.cur, best: S.best, last: S.last };
    if (set.kind === 'random') o.items = S.items;
    QUIZ.store.set(setId, o);
  }

  /* ---------- Truy xuất ---------- */
  function getQ(it) { return QUIZ.sets[it.src].questions[it.idx]; }
  function counts() {
    var answered = 0, ok = 0;
    S.items.forEach(function (it, i) {
      if (S.ans[i] !== -1) { answered++; if (S.ans[i] === getQ(it).a) ok++; }
    });
    return { answered: answered, ok: ok, bad: answered - ok, total: S.items.length };
  }

  /* ---------- Hiển thị ---------- */
  function render() {
    var q = getQ(S.items[S.cur]);
    var it = S.items[S.cur];
    var a = S.ans[S.cur];
    var answered = a !== -1;
    var n = S.items.length;

    // meta
    var meta = $('#qmeta'); meta.innerHTML = '';
    meta.appendChild(chip('Câu ' + (S.cur + 1) + ' / ' + n, ''));
    if (set.kind === 'random' || q.n !== S.cur + 1 || !persist) {
      var srcTitle = QUIZ.sets[it.src].short || QUIZ.sets[it.src].title;
      meta.appendChild(chip(srcTitle + ' · câu ' + q.n, 'soft'));
    }

    $('#qtext').textContent = q.q;

    // đáp án
    var box = $('#opts'); box.innerHTML = '';
    q.o.forEach(function (text, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'opt'; b.dataset.i = i;
      var l = document.createElement('span'); l.className = 'letter'; l.textContent = LETTERS[i];
      var t = document.createElement('span'); t.className = 'txt'; t.textContent = text;
      var m = document.createElement('span'); m.className = 'mark'; m.setAttribute('aria-hidden', 'true');
      b.appendChild(l); b.appendChild(t); b.appendChild(m);
      if (answered) {
        b.disabled = true;
        if (i === q.a) { b.classList.add('correct'); m.textContent = '✓'; if (justAnswered) b.classList.add('pop'); }
        else if (i === a) { b.classList.add('wrong'); m.textContent = '✗'; if (justAnswered) b.classList.add('shake'); }
        else b.classList.add('dim');
      } else {
        b.addEventListener('click', function () { choose(i); });
      }
      box.appendChild(b);
    });

    // phản hồi
    var fb = $('#feedback'); fb.innerHTML = '';
    if (answered) {
      var d = document.createElement('div');
      if (a === q.a) {
        d.className = 'box good'; d.textContent = '✓ Chính xác!';
      } else {
        d.className = 'box fail';
        d.textContent = '✗ Chưa đúng. Đáp án đúng: ' + LETTERS[q.a] + '. ' + q.o[q.a];
      }
      fb.appendChild(d);
    }
    justAnswered = false;

    // nút điều hướng
    var c = counts();
    $('#prev').disabled = S.cur === 0;
    var next = $('#next');
    var last = S.cur === n - 1;
    next.classList.remove('pulse');
    if (last && c.answered === n) { next.textContent = 'Xem kết quả ›'; next.classList.add('pulse'); }
    else if (last) { next.textContent = 'Đến câu chưa làm ›'; }
    else { next.textContent = 'Câu tiếp ›'; }

    renderProgress(c);
    renderDots();
  }

  function chip(text, cls) {
    var s = document.createElement('span');
    s.className = 'chip' + (cls ? ' ' + cls : ''); s.textContent = text; return s;
  }

  function renderProgress(c) {
    var pct = c.total ? Math.round((c.answered / c.total) * 100) : 0;
    $('#stAnswered').textContent = 'Đã làm ' + c.answered + '/' + c.total;
    $('#stOk').textContent = '✓ Đúng ' + c.ok;
    $('#stBad').textContent = '✗ Sai ' + c.bad;
    $('#stPct').textContent = pct + '% hoàn thành';
    $('#barFill').style.width = pct + '%';
    $('#bar').classList.toggle('ok', pct === 100);
    $('#finishBtn').hidden = c.answered !== c.total;
  }

  function renderDots() {
    var wrap = $('#dots'); wrap.innerHTML = '';
    S.items.forEach(function (it, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'dot'; b.textContent = i + 1;
      b.setAttribute('aria-label', 'Đi tới câu ' + (i + 1));
      if (S.ans[i] !== -1) b.classList.add(S.ans[i] === getQ(it).a ? 'ok' : 'bad');
      if (i === S.cur) b.classList.add('cur');
      b.addEventListener('click', function () { go(i); });
      wrap.appendChild(b);
    });
  }

  /* ---------- Hành động ---------- */
  function choose(i) {
    if (S.ans[S.cur] !== -1) return;
    var q = getQ(S.items[S.cur]);
    S.ans[S.cur] = i;
    var ok = i === q.a;
    QUIZ.sound.unlock();
    QUIZ.sound.play(ok);
    if (navigator.vibrate) { try { navigator.vibrate(ok ? 25 : [70, 40, 70]); } catch (e) { /* bỏ qua */ } }
    justAnswered = true;
    save();
    render();
  }

  function go(i) {
    if (i < 0 || i >= S.items.length) return;
    S.cur = i; save(); render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function next() {
    var n = S.items.length, c = counts();
    if (S.cur < n - 1) return go(S.cur + 1);
    if (c.answered === n) return showResult();
    var first = S.ans.indexOf(-1);
    if (first !== -1) go(first);
  }

  /* ---------- Kết quả ---------- */
  function showResult() {
    var c = counts();
    var pct = Math.round((c.ok / c.total) * 100);

    if (persist) {
      S.last = { c: c.ok, t: c.total };
      if (!S.best || c.ok / c.total > S.best.c / S.best.t) S.best = { c: c.ok, t: c.total };
      save();
    }

    $('#ring').style.setProperty('--p', pct);
    $('#ringText').textContent = pct + '%';
    $('#resTitle').textContent =
      pct === 100 ? 'Tuyệt vời! Đúng tất cả!' :
      pct >= 90 ? 'Xuất sắc!' :
      pct >= 75 ? 'Rất tốt!' :
      pct >= 50 ? 'Khá ổn, cố lên nhé!' : 'Hãy ôn lại và thử lần nữa nhé!';
    $('#resSub').textContent = 'Bạn trả lời đúng ' + c.ok + '/' + c.total + ' câu' +
      (persist && S.best ? ' · Điểm cao nhất: ' + S.best.c + '/' + S.best.t : '');

    // danh sách câu sai
    var wl = $('#wrongList'); wl.innerHTML = '';
    var wrongs = [];
    S.items.forEach(function (it, i) { if (S.ans[i] !== getQ(it).a) wrongs.push(i); });
    if (wrongs.length) {
      var det = document.createElement('details');
      var sm = document.createElement('summary'); sm.textContent = 'Xem ' + wrongs.length + ' câu làm sai';
      det.appendChild(sm);
      wrongs.forEach(function (i) {
        var q = getQ(S.items[i]);
        var d = document.createElement('div'); d.className = 'wl-item';
        var a = document.createElement('div'); a.className = 'q'; a.textContent = 'Câu ' + (i + 1) + ': ' + q.q;
        var y = document.createElement('div'); y.className = 'you';
        y.textContent = '✗ Bạn chọn: ' + (S.ans[i] === -1 ? '(chưa trả lời)' : LETTERS[S.ans[i]] + '. ' + q.o[S.ans[i]]);
        var r = document.createElement('div'); r.className = 'right';
        r.textContent = '✓ Đáp án: ' + LETTERS[q.a] + '. ' + q.o[q.a];
        d.appendChild(a); d.appendChild(y); d.appendChild(r); det.appendChild(d);
      });
      wl.appendChild(det);
    }

    $('#btnRetryWrong').hidden = wrongs.length === 0;
    $('#btnAgain').textContent = set.kind === 'random' ? 'Bốc 30 câu mới' : 'Làm lại từ đầu';
    $('#btnAgain').hidden = !persist;
    $('#btnBackMain').hidden = persist;
    $('#result').hidden = false;
    renderProgress(c);
  }

  function retryWrong() {
    var wrongItems = S.items.filter(function (it, i) { return S.ans[i] !== getQ(it).a; });
    if (!wrongItems.length) return;
    if (persist) backup = S;
    persist = false;
    S = { items: wrongItems, ans: fill(wrongItems.length), cur: 0 };
    $('#result').hidden = true;
    $('#retryBanner').hidden = false;
    render();
    window.scrollTo({ top: 0 });
  }

  function backToMain() {
    if (!backup) return init(false);
    S = backup; backup = null; persist = true;
    $('#retryBanner').hidden = true;
    $('#result').hidden = true;
    render();
  }

  function again() {
    $('#result').hidden = true;
    init(true);
    window.scrollTo({ top: 0 });
  }

  /* ---------- Gắn sự kiện ---------- */
  function setup() {
    $('#kicker').textContent = (group ? group.title : '') + (set.sub ? ' · ' + set.sub : '');
    $('#setTitle').textContent = set.title;
    document.title = set.title + ' – Ôn tập Giáo lý';

    var sb = $('#soundBtn');
    function paintSound() {
      sb.textContent = QUIZ.sound.on ? '🔊' : '🔇';
      sb.setAttribute('aria-pressed', QUIZ.sound.on ? 'true' : 'false');
    }
    paintSound();
    sb.addEventListener('click', function () { QUIZ.sound.toggle(); paintSound(); });

    $('#prev').addEventListener('click', function () { go(S.cur - 1); });
    $('#next').addEventListener('click', next);
    $('#finishBtn').addEventListener('click', showResult);
    $('#btnRetryWrong').addEventListener('click', retryWrong);
    $('#btnAgain').addEventListener('click', again);
    $('#btnBackMain').addEventListener('click', backToMain);
    $('#btnClose').addEventListener('click', function () { $('#result').hidden = true; });
    $('#restartBtn').addEventListener('click', function () {
      if (confirm('Làm lại từ đầu? Tiến độ của bộ này sẽ được xoá (điểm cao nhất vẫn giữ).')) again();
    });

    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (!$('#result').hidden) { if (e.key === 'Escape') $('#result').hidden = true; return; }
      var k = e.key.toLowerCase();
      var idx = 'abcd'.indexOf(k);
      if (idx === -1 && '1234'.indexOf(k) !== -1 && k.length === 1) idx = +k - 1;
      if (idx !== -1 && k.length === 1) { choose(idx); return; }
      if (e.key === 'ArrowRight' || e.key === 'Enter') { if (document.activeElement.tagName !== 'BUTTON' || e.key === 'ArrowRight') { e.preventDefault(); next(); } }
      else if (e.key === 'ArrowLeft') { go(S.cur - 1); }
    });

    init(false);
  }

  setup();
})();
