/* Trang chủ: danh sách bộ đề + tiến độ hoàn thành */
(function () {
  var $ = function (s) { return document.querySelector(s); };

  function stat(set) {
    var st = QUIZ.store.get(set.id) || {};
    var total = QUIZ.total(set);
    var answered = 0, ok = 0;
    if (Array.isArray(st.ans)) {
      st.ans.forEach(function (a, i) {
        if (a === -1) return;
        answered++;
        var q = set.kind === 'random'
          ? (st.items && st.items[i] ? QUIZ.sets[st.items[i].src].questions[st.items[i].idx] : null)
          : set.questions[i];
        if (q && a === q.a) ok++;
      });
    }
    return { total: total, answered: answered, ok: ok, best: st.best || null, done: answered === total && total > 0 };
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function tile(set) {
    var s = stat(set);
    var a = el('a', 'tile' + (set.kind === 'random' ? ' random' : '') + (s.done ? ' done' : ''));
    a.href = 'quiz.html?set=' + encodeURIComponent(set.id);

    var top = el('div', 'tile-top');
    top.appendChild(el('span', 'tile-title', (set.kind === 'random' ? '🎲 ' : '') + set.title));
    top.appendChild(el('span', 'badge', '✓'));
    a.appendChild(top);
    a.appendChild(el('div', 'tile-sub', set.sub || ''));

    var bar = el('div', 'bar' + (s.done ? ' ok' : ''));
    var fill = el('i'); fill.style.width = Math.round((s.answered / s.total) * 100) + '%';
    bar.appendChild(fill); a.appendChild(bar);

    var foot;
    if (s.answered > 0) {
      foot = s.answered + '/' + s.total + ' câu · ' + s.ok + ' đúng' + (s.done ? ' · Hoàn thành' : '');
    } else if (s.best) {
      foot = 'Cao nhất: ' + s.best.c + '/' + s.best.t + ' đúng';
    } else {
      foot = 'Chưa làm · ' + s.total + ' câu';
    }
    a.appendChild(el('div', 'tile-foot', foot));
    return a;
  }

  function overall() {
    var total = 0, answered = 0, ok = 0, sets = 0, setsDone = 0;
    QUIZ.order.forEach(function (id) {
      var set = QUIZ.sets[id];
      if (set.kind === 'random') return;
      var s = stat(set);
      total += s.total; answered += s.answered; ok += s.ok; sets++;
      if (s.done) setsDone++;
    });
    var pct = total ? Math.round((answered / total) * 100) : 0;
    $('#ovMain').textContent = 'Tiến độ tổng: ' + answered + '/' + total + ' câu (' + pct + '%)';
    $('#ovSub').textContent = 'Hoàn thành ' + setsDone + '/' + sets + ' đề' +
      (answered ? ' · Chính xác ' + Math.round((ok / answered) * 100) + '%' : '');
    $('#ovBar').style.width = pct + '%';
    $('#ovBarWrap').classList.toggle('ok', pct === 100);
  }

  function build() {
    var root = $('#groups'); root.innerHTML = '';
    QUIZ.groups.forEach(function (g) {
      var sec = el('section', 'group card');
      sec.appendChild(el('h3', null, g.title));
      sec.appendChild(el('p', 'desc', g.desc));
      var grid = el('div', 'tiles');
      QUIZ.order.forEach(function (id) {
        var set = QUIZ.sets[id];
        if (set.group === g.id) grid.appendChild(tile(set));
      });
      sec.appendChild(grid);
      root.appendChild(sec);
    });
    overall();
  }

  $('#resetAll').addEventListener('click', function () {
    if (confirm('Xoá toàn bộ tiến độ và điểm số đã lưu trên thiết bị này?')) { QUIZ.store.clearAll(); build(); }
  });

  // Quay lại từ trang làm bài (bfcache) → làm mới tiến độ
  window.addEventListener('pageshow', build);
  build();
})();
