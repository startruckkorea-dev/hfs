(async () => {
var HFS = 'https://startruckkorea-dev.github.io/hfs/', ORG = new URL(HFS).origin, TPL_KEY = 'hfs.collect.tpl.v1';
if (!/(^|\.)flex\.team$/.test(location.hostname)) { alert('flex.team 구성원 화면(https://flex.team/people/users)에서 눌러 주세요.'); return; }
var V = 12;
var main = async function (ctx) {
ctx = ctx || {};
var AUTO = !!ctx.auto, KEY = String(ctx.key || '');
if (window.__hfsRun) {
if (AUTO) { try { ctx.win.postMessage({ type: 'hfs-flex-progress', stage: 'error', v: V, auto: true, key: KEY, busy: true, text: 'Flex 탭에서 수집이 이미 진행 중입니다' }, ORG); } catch (e) {} }
else { try { window.__hfsRun.focus(); } catch (e) {} }
return;
}
var hfsWin = AUTO ? ctx.win : window.open(HFS, 'hfs');
if (!hfsWin) { alert('HFS 창이 열리지 않았습니다 — 브라우저의 팝업 차단을 이 사이트에서 풀고 다시 눌러 주세요.'); return; }
if (!AUTO) { try { hfsWin.focus(); } catch (e) {} }
window.__hfsRun = hfsWin;
window.__hfsHome = hfsWin;
var diag = [], lastProg = null, finished = false, onAck = null;
var log = function (t) { diag.push(new Date().toTimeString().slice(0, 8) + ' ' + t); };
var RID = Math.random().toString(36).slice(2);
var prog = function (stage, extra) { lastProg = Object.assign({ type: 'hfs-flex-progress', stage: stage, v: V, rid: RID, auto: AUTO, key: KEY, diag: diag.join('\n') }, extra || {}); try { if (!hfsWin.closed) hfsWin.postMessage(lastProg, ORG); } catch (e) {} };
var beat = setInterval(function () { if (finished || !lastProg) return; if (hfsWin.closed) { clearInterval(beat); window.__hfsRun = null; return; } try { hfsWin.postMessage(lastProg, ORG); } catch (e) {} }, 1000);
var done = function () { finished = true; clearInterval(beat); window.__hfsRun = null; if (onAck) { window.removeEventListener('message', onAck); onAck = null; } };
var fail = function (text) { log('실패: ' + text); prog('error', { text: text, diag: diag.join('\n') }); done(); };
var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
var tval = function (t) { return t && typeof t === 'object' ? (t.value || t.count || t.total || 0) : (t || 0); };
var pathOf = function (u) { try { return new URL(u, location.href).pathname; } catch (e) { return u; } };
var F = window.fetch;
log('시작 v' + V + (AUTO ? ' (자동 ' + KEY + ')' : '') + ' ' + location.href); prog('capture');
var users = new Map(), total = 0;
var listOf = function (j) { return (j && (j.list || (j.data && j.data.list))) || []; };
var emailsOf = function (j) { return listOf(j).map(function (u) { return u && u.basicInfo && u.basicInfo.email ? String(u.basicInfo.email).trim().toLowerCase() : ''; }).filter(Boolean); };
var add = function (j) { listOf(j).forEach(function (u) { var e = u && u.basicInfo && u.basicInfo.email; if (e) users.set(String(e).trim().toLowerCase(), u); }); if (j && tval(j.total)) total = tval(j.total); return j; };
var complete = function () { return users.size > 0 && (!total || users.size >= total); };
var storeVals = function () {
var out = [];
[['localStorage', localStorage], ['sessionStorage', sessionStorage]].forEach(function (p) {
var st = p[1]; try {
for (var i = 0; i < st.length; i++) { var k = st.key(i), v = st.getItem(k); if (!v) continue;
if (v.length >= 20) out.push({ store: p[0], key: k, path: null, val: v });
try { var o = JSON.parse(v); (function walk(x, path) { if (!x || typeof x !== 'object') return; Object.keys(x).forEach(function (kk) { var vv = x[kk]; if (typeof vv === 'string' && vv.length >= 20) out.push({ store: p[0], key: k, path: path.concat(kk), val: vv }); else if (vv && typeof vv === 'object') walk(vv, path.concat(kk)); }); })(o, []); } catch (e) {}
}
} catch (e) {}
});
return out;
};
var bindHeaders = function (headers) {
var vals = storeVals(), out = {};
Object.keys(headers).forEach(function (h) {
var v = String(headers[h]), src = null;
if (v.length >= 20) { for (var i = 0; i < vals.length; i++) { var c = vals[i]; var at = v.indexOf(c.val); if (at >= 0) { src = { store: c.store, key: c.key, path: c.path, prefix: v.slice(0, at), suffix: v.slice(at + c.val.length) }; break; } } }
out[h] = { value: v, src: src };
});
return out;
};
var rebuildHeaders = function (bound) {
var out = {};
for (var h in bound) {
var b = bound[h];
if (b.src) {
var st = b.src.store === 'localStorage' ? localStorage : sessionStorage, raw = st.getItem(b.src.key); if (!raw) return null;
var cur = raw; if (b.src.path) { try { cur = b.src.path.reduce(function (o, k) { return o == null ? null : o[k]; }, JSON.parse(raw)); } catch (e) { return null; } if (typeof cur !== 'string' || !cur) return null; }
out[h] = b.src.prefix + cur + b.src.suffix;
} else out[h] = b.value;
}
return out;
};
var loadTpl = function () { try { var t = JSON.parse(localStorage.getItem(TPL_KEY) || 'null'); if (!t || !t.url || !t.slot) return null; var h = rebuildHeaders(t.headers || {}); if (!h) return null;
var f = null; if (t.first) { var fh = rebuildHeaders(t.first.headers || {}); if (!fh) return null; f = { url: t.first.url, method: t.first.method, headers: fh, body: t.first.body }; }
return { url: t.url, method: t.method, headers: h, body: t.body, slot: t.slot, first: f }; } catch (e) { return null; } };
var saveTpl = function (T, slot) { try { var o = { url: T.url, method: T.method, headers: bindHeaders(T.headers), body: T.body, slot: slot, at: Date.now() };
if (T.first) o.first = { url: T.first.url, method: T.first.method, headers: bindHeaders(T.first.headers), body: T.first.body };
localStorage.setItem(TPL_KEY, JSON.stringify(o)); } catch (e) {} };
var dropTpl = function () { try { localStorage.removeItem(TPL_KEY); } catch (e) {} };
var setPath = function (o, path, v) { var cur = o; for (var i = 0; i < path.length - 1; i++) { if (cur[path[i]] == null || typeof cur[path[i]] !== 'object') cur[path[i]] = {}; cur = cur[path[i]]; } cur[path[path.length - 1]] = v; };
var place = function (T, c, val) {
var url = T.url, headers = Object.assign({}, T.headers), body = T.body;
if (c.kind === 'body') { var o = {}; try { o = T.body ? JSON.parse(T.body) : {}; } catch (e) { o = {}; } setPath(o, c.path, val == null ? null : val); body = JSON.stringify(o); }
else if (c.kind === 'query') { var u = new URL(url, location.href); if (val == null) u.searchParams.delete(c.key); else u.searchParams.set(c.key, val); url = u.toString(); }
else { if (val == null) delete headers[c.key]; else headers[c.key] = val; }
return { url: url, headers: headers, body: body };
};
var lastRt = 0;
var freshHeaders = function (hd) { var o = Object.assign({}, hd); Object.keys(o).forEach(function (k) { if (/^x-request-time$/i.test(k)) { var v = String(o[k]); if (/^\d{13}$/.test(v)) { lastRt = Math.max(Date.now(), lastRt + 1); o[k] = String(lastRt); } else if (/^\d{10}$/.test(v)) o[k] = String(Math.floor(Date.now() / 1000)); } }); return o; };
var send = async function (T, q) {
var res = await F(q.url, { method: T.method, headers: freshHeaders(q.headers), body: (T.method === 'GET' || T.method === 'HEAD') ? undefined : q.body, credentials: 'include' });
if (!res.ok) throw new Error('HTTP ' + res.status);
return res.json();
};
var readAll = async function (T) {
users = new Map(); total = 0;
var cont = null, pages = 0, prevSize = -1;
for (var pg = 0; pg < 100; pg++) {
var j = (pg === 0 && T.first) ? add(await send(T.first, { url: T.first.url, headers: T.first.headers, body: T.first.body })) : add(await send(T, place(T, T.slot, cont))); pages++;
log('  p' + pages + ': ' + listOf(j).length + '명 · hasNext ' + (j && j.hasNext) + ' · 누적 ' + users.size);
prog('read', { count: users.size, total: total, pages: pages });
if (!j || !j.hasNext || !j.continuation || j.continuation === cont) break;
if (users.size === prevSize && pg > 0) throw new Error('같은 페이지가 되풀이됨');
prevSize = users.size; cont = j.continuation;
}
log('읽기 ' + pages + '페이지 · ' + users.size + '명' + (total ? ' / ' + total : ''));
if (!complete()) throw new Error('전체 ' + total + '명 중 ' + users.size + '명만 읽힘');
return true;
};
var learn = function (cs) {
var conts = []; cs.forEach(function (x) { var v = x.res && x.res.continuation; if (typeof v === 'string' && v.length >= 6 && conts.indexOf(v) < 0) conts.push(v); });
if (!conts.length) return null;
var has = function (q) { var s = ''; try { s = (q.url || '') + '\n' + (q.body || '') + '\n' + JSON.stringify(q.headers || {}); } catch (e) {} return conts.some(function (v) { return s.indexOf(v) >= 0 || s.indexOf(encodeURIComponent(v)) >= 0; }); };
var first = null; for (var a = 0; a < cs.length && !first; a++) { var q0 = cs[a].req; if (q0 && !has(q0) && cs[a].res && listOf(cs[a].res).length) first = q0; }
for (var i = 0; i < cs.length; i++) {
var q = cs[i].req; if (!q) continue; var hit = null;
for (var k = 0; k < conts.length && !hit; k++) {
var v = conts[k];
try { new URL(q.url, location.href).searchParams.forEach(function (val, key) { if (!hit && val === v) hit = { kind: 'query', key: key }; }); } catch (e) {}
if (!hit && q.body) { try { (function walk(o, path) { if (hit || !o || typeof o !== 'object') return; Object.keys(o).forEach(function (kk) { if (hit) return; var vv = o[kk]; if (vv === v) hit = { kind: 'body', path: path.concat(kk) }; else if (vv && typeof vv === 'object') walk(vv, path.concat(kk)); }); })(JSON.parse(q.body), []); } catch (e) {} }
if (!hit) Object.keys(q.headers || {}).forEach(function (hn) { if (!hit && String(q.headers[hn]) === v) hit = { kind: 'header', key: hn }; });
}
if (hit) return { T: { url: q.url, method: q.method, headers: q.headers, body: q.body, slot: hit, first: first }, slot: hit };
}
return null;
};
var slotName = function (s) { return s.kind === 'body' ? '본문 ' + s.path.join('.') : s.kind === 'query' ? 'query ' + s.key : '헤더 ' + s.key; };
var tryLearn = async function (cs, why) {
var L = learn(cs); if (!L) { log('자리 배우기(' + why + '): 다음 페이지 요청에서 continuation 값을 찾지 못함 · 잡힌 요청 ' + cs.length + '건'); return false; }
log('자리 배우기(' + why + '): ' + slotName(L.slot) + (L.T.first ? ' · 첫 페이지 요청 따로' : ''));
var keepU = users, keepT = total, good = false;
try { good = await readAll(L.T); } catch (e) { log('배운 자리로 다시 읽기 실패: ' + e.message); }
if (good) { saveTpl(L.T, L.slot); log('틀 저장 — 다음부터는 화면 없이 바로 읽는다'); return true; }
users = keepU; total = keepT; return false;
};
var hdrs = function (src) { var h = {}; if (src) { if (Array.isArray(src)) src.forEach(function (kv) { h[kv[0]] = kv[1]; }); else if (typeof src.forEach === 'function') src.forEach(function (v, k) { h[k] = v; }); else Object.assign(h, src); } return h; };
var installHook = function (w, sink) {
var WF = w.fetch;
w.fetch = async function (input, init) {
var url = typeof input === 'string' ? input : (input && input.url) || '', pre = null;
if (/search-users/i.test(url)) {
try { var body = init && init.body; if (body == null && input && typeof input.clone === 'function') { try { body = await input.clone().text(); } catch (e) {} }
pre = { url: new URL(url, w.location.href).href, method: ((init && init.method) || (input && input.method) || 'GET').toUpperCase(), headers: hdrs((init && init.headers) || (input && input.headers)), body: typeof body === 'string' ? body : null }; } catch (e) {}
}
var res = await WF.apply(this, arguments);
if (pre) { try { res.clone().json().then(function (j) { var k = sink(); k.caps.push({ req: pre, res: j }); k.liveRes.push(j); }).catch(function () {}); } catch (e) {} }
return res;
};
var X = w.XMLHttpRequest.prototype, XO = X.open, XS = X.send, XH = X.setRequestHeader;
X.open = function (m, u) { this.__hfs = { method: String(m).toUpperCase(), url: new URL(String(u), w.location.href).href, headers: {} }; return XO.apply(this, arguments); };
X.setRequestHeader = function (k, v) { if (this.__hfs) this.__hfs.headers[k] = v; return XH.apply(this, arguments); };
X.send = function (b) {
var r = this.__hfs, x = this;
if (r && /search-users/i.test(r.url)) { r.body = typeof b === 'string' ? b : null; x.addEventListener('load', function () { try { var j = JSON.parse(x.responseText); var k = sink(); k.caps.push({ req: r, res: j }); k.liveRes.push(j); } catch (e) {} }); }
return XS.apply(this, arguments);
};
};
var scrollersOf = function (doc) { return Array.prototype.filter.call(doc.querySelectorAll('*'), function (el) { var s = doc.defaultView.getComputedStyle(el); return /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 40; }); };
var nudgeIn = function (w) {
try { scrollersOf(w.document).forEach(function (el) { el.scrollTop = Math.min(el.scrollTop + el.clientHeight * 0.9, el.scrollHeight); var last = el.lastElementChild; try { if (last && el.scrollTop + el.clientHeight >= el.scrollHeight - 5) last.scrollIntoView({ block: 'end' }); } catch (e) {} el.dispatchEvent(new w.Event('scroll', { bubbles: true })); }); w.scrollBy(0, w.innerHeight * 0.9); } catch (e) {}
};
var frame = null;
var closeFrame = function () { try { if (frame) frame.remove(); } catch (e) {} frame = null; };
var freshCapture = function (sink) {
return new Promise(function (resolve) {
var fr = document.createElement('iframe'), finished2 = false, blocked = false, hookedDoc = null, t0 = Date.now();
fr.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms');
fr.setAttribute('aria-hidden', 'true'); fr.setAttribute('tabindex', '-1');
fr.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;opacity:0;pointer-events:none;border:0;z-index:-1';
var end = function () { if (finished2) return; finished2 = true; clearInterval(iv); if (blocked || !hookedDoc) { try { fr.remove(); } catch (e) {} } else frame = fr; resolve(); };
fr.addEventListener('load', function () { try { if (!fr.contentDocument) blocked = true; } catch (e) { blocked = true; } });
document.body.appendChild(fr);
fr.src = location.origin + '/people/users';
var iv = setInterval(function () {
var now = Date.now() - t0;
try {
var w = fr.contentWindow;
if (w && w.document && w.document !== hookedDoc && /people/.test(w.location.pathname)) { installHook(w, sink); hookedDoc = w.document; log('iframe 가로채기 설치(' + w.document.readyState + ', ' + now + 'ms)'); }
if (hookedDoc && now > 2500 && sink().caps.length < 2) nudgeIn(w);
} catch (e) {}
var nc = sink().caps.length;
if (nc >= 2 || (nc === 1 && now > 12000) || (blocked && now > 1500) || now > 22000) { log('iframe 잡기: ' + nc + '건' + (blocked ? ' · 막힘' : '')); end(); }
}, 4);
});
};
var hookTab = function () { if (!window.__hfsHooked) { installHook(window, function () { return window.__hfsSink; }); window.__hfsHooked = true; } };
var tabCapture = async function (sink) {
hookTab();
for (var i = 0; i < 25 && !sink().caps.length; i++) { nudgeIn(window); await sleep(400); }
log('탭 잡기: ' + sink().caps.length + '건');
};
var ok = false, best = new Map(), keepBest = function () { if (users.size > best.size) best = new Map(users); };
var T = loadTpl();
if (T) { log('저장된 틀 사용: ' + T.method + ' ' + pathOf(T.url)); try { ok = await readAll(T); } catch (e) { keepBest(); log('저장된 틀 실패: ' + e.message + (AUTO ? ' → 틀은 둔다(자동)' : ' → 다시 잡는다')); if (!AUTO) dropTpl(); } }
if (!ok) {
var caps = [], liveRes = [], sink = function () { return window.__hfsSink; };
window.__hfsSink = { caps: caps, liveRes: liveRes };
await freshCapture(sink);
if (!caps.length && !AUTO) await tabCapture(sink);
if (!caps.length) { fail('Flex 구성원 목록을 불러오지 못했습니다. Flex 탭을 새로고침한 뒤 북마크를 다시 눌러 주세요.'); return; }
var tokish = function (v) { return typeof v === 'string' && /^[A-Za-z0-9_-]{20,}$/.test(v); };
var reqHasTok = function (q) {
var found = false; try { (function walk(o) { if (found || !o || typeof o !== 'object') return; Object.keys(o).forEach(function (k) { if (tokish(o[k])) found = true; else if (o[k] && typeof o[k] === 'object') walk(o[k]); }); })(q.body ? JSON.parse(q.body) : null); } catch (e) {}
try { new URL(q.url, location.href).searchParams.forEach(function (v) { if (tokish(v)) found = true; }); } catch (e) {}
Object.keys(q.headers || {}).forEach(function (k) { if (!/^(authorization|cookie|x-csrf|content|accept|user-agent)/i.test(k) && tokish(q.headers[k])) found = true; });
return found;
};
var pick = caps.find(function (c) { return reqHasTok(c.req); }) || caps.find(function (c) { return c.res && c.res.hasNext && c.res.continuation; }) || caps[caps.length - 1];
var C = pick.req, R = pick.res;
var bodyObj = null; try { bodyObj = C.body ? JSON.parse(C.body) : null; } catch (e) {}
log('요청: ' + C.method + ' ' + pathOf(C.url) + ' · 본문 ' + (bodyObj ? 'JSON(' + Object.keys(bodyObj).join(',') + ')' : (C.body ? '문자열' : '없음')) + ' · 헤더 ' + Object.keys(C.headers).join(','));
log('응답: list ' + listOf(R).length + ' · hasNext ' + (R && R.hasNext) + ' · total ' + tval(R && R.total));
var cands = [], keyish = /continu|cursor|next|after|page.?token/i, seen = {};
var push = function (c) { var id = c.kind + ':' + (c.path ? c.path.join('.') : c.key); if (!seen[id]) { seen[id] = 1; cands.push(c); } };
(function walk(o, path) { if (!o || typeof o !== 'object') return; Object.keys(o).forEach(function (k) { var v = o[k], p = path.concat(k); if (tokish(v)) push({ kind: 'body', path: p }); else if (v && typeof v === 'object') walk(v, p); }); })(bodyObj, []);
(function walk(o, path) { if (!o || typeof o !== 'object') return; Object.keys(o).forEach(function (k) { var v = o[k], p = path.concat(k); if (keyish.test(k) && (v == null || typeof v !== 'object')) push({ kind: 'body', path: p }); else if (v && typeof v === 'object') walk(v, p); }); })(bodyObj, []);
try { new URL(C.url, location.href).searchParams.forEach(function (v, k) { if (tokish(v) || keyish.test(k)) push({ kind: 'query', key: k }); }); } catch (e) {}
Object.keys(C.headers).forEach(function (k) { if (!/^(authorization|cookie|x-csrf|content|accept|user-agent)/i.test(k) && (tokish(C.headers[k]) || keyish.test(k))) push({ kind: 'header', key: k }); });
(function walk(o, path) { if (!o || typeof o !== 'object') return; Object.keys(o).forEach(function (k) { var v = o[k], p = path.concat(k); if (v === null) push({ kind: 'body', path: p }); else if (v && typeof v === 'object') walk(v, p); }); })(bodyObj, []);
if (bodyObj) push({ kind: 'body', path: ['continuation'] });
push({ kind: 'query', key: 'continuation' });
var cname = function (c) { return c.kind === 'body' ? '본문 ' + c.path.join('.') : c.kind === 'query' ? 'query ' + c.key : '헤더 ' + c.key; };
var slot = null, known = emailsOf(R);
for (var ci = 0; ci < cands.length && !slot; ci++) {
var c = cands[ci];
try {
var probe;
if (R && R.hasNext && R.continuation) { probe = await send(C, place(C, c, R.continuation)); if (emailsOf(probe).some(function (e) { return known.indexOf(e) < 0; })) slot = c; else log('후보 ' + cname(c) + ': 새 사람 없음'); }
else { probe = await send(C, place(C, c, null)); var em = emailsOf(probe); if (em.length && em.some(function (e) { return known.indexOf(e) < 0; })) slot = c; else log('후보 ' + cname(c) + ': 첫 페이지 아님'); }
} catch (e) { log('후보 ' + cname(c) + ': ' + e.message); }
}
log(slot ? 'continuation 자리: ' + cname(slot) : 'continuation 자리를 못 찾음');
if (slot) { C.slot = slot; try { ok = await readAll(C); saveTpl(C, slot); } catch (e) { keepBest(); log('읽기 실패: ' + e.message); } }
if (!ok && caps.length >= 2) ok = await tryLearn(caps, '잡힌 요청');
if (!ok && !AUTO) {
users = new Map(); total = 0; caps.forEach(function (c) { add(c.res); }); liveRes.splice(0);
hookTab();
var lastNext = true; caps.forEach(function (c) { if (c.res && c.res.hasNext === false) lastNext = false; });
var toBottom = function (w) { try { scrollersOf(w.document).forEach(function (el) { el.scrollTop = el.scrollHeight; var last = el.lastElementChild; try { if (last) last.scrollIntoView({ block: 'end' }); } catch (e) {} el.dispatchEvent(new w.Event('scroll', { bubbles: true })); }); w.scrollTo(0, w.document.documentElement.scrollHeight); } catch (e) {} };
var idle = 0, t0 = Date.now(), retry = 0;
for (;;) {
while (Date.now() - t0 < 600000 && !complete() && lastNext && idle < 4) {
if (frame) toBottom(frame.contentWindow); toBottom(window);
var before = users.size, got = false;
for (var w8 = 0; w8 < 25; w8++) { await sleep(200); var nr = liveRes.splice(0); if (nr.length) { nr.forEach(function (j) { add(j); if (j && j.hasNext === false) lastNext = false; }); got = true; break; } }
if (got && users.size > before) idle = 0; else if (!document.hidden) idle++;
prog('read', { count: users.size, total: total, scroll: true, hidden: !!document.hidden });
}
if (complete() || retry >= 2 || Date.now() - t0 > 500000) break;
retry++; log('모자람(' + users.size + '/' + total + ') → iframe 다시 ' + retry);
closeFrame(); var c0 = caps.length; await freshCapture(sink); caps.slice(c0).forEach(function (c) { add(c.res); }); liveRes.splice(0);
lastNext = true; idle = 0;
}
log('천천히 내리며 모음: ' + users.size + '명' + (total ? ' / ' + total : '') + ' · 마지막 페이지 ' + (!lastNext) + ' · ' + Math.round((Date.now() - t0) / 1000) + '초');
if (complete()) { var gotU = users, gotT = total; await tryLearn(caps, '내리며 잡은 요청'); users = gotU; total = gotT; }
if (best.size > users.size) { users = best; log('앞서 읽은 ' + best.size + '명을 쓴다'); }
}
closeFrame();
}
if (AUTO && !ok) { fail('자동 수집: 저장된 연결로 끝까지 읽지 못했습니다(' + users.size + (total ? '/' + total : '') + '명). Flex 로그인이 풀렸거나 화면이 바뀌었을 수 있습니다 — Flex 탭에서 「HFS 수집」 을 한 번 다시 눌러 주세요.'); return; }
if (!users.size) { fail('구성원을 읽지 못했습니다. Flex 탭을 새로고침한 뒤 북마크를 다시 눌러 주세요.'); return; }
var payload = { type: 'hfs-flex-users', users: Array.from(users.values()), total: total, at: Date.now(), v: V, rid: RID, auto: AUTO, key: KEY }, acked = false;
onAck = function (ev) { if (ev.origin === ORG && ev.data && ev.data.type === 'hfs-flex-ack') { acked = true; log('HFS 받음'); done(); } };
window.addEventListener('message', onAck);
log('보냄: ' + users.size + '명' + (total ? ' / ' + total : ''));
prog('send', { count: users.size, total: total, partial: !complete() });
for (var n = 0; n < 600 && !acked; n++) {
if (hfsWin.closed) { done(); return; }
try { hfsWin.postMessage(payload, ORG); } catch (e) {}
await sleep(1000);
}
if (!acked) { done(); }
};
var R = window.__hfsResident;
if (!R) {
R = window.__hfsResident = { main: main, v: V };
window.addEventListener('message', function (ev) {
if (ev.origin !== ORG || !ev.data || ev.data.type !== 'hfs-collect-request') return;
if (!window.__hfsHome || ev.source !== window.__hfsHome) return;
window.__hfsResident.main({ auto: true, win: ev.source, key: ev.data.key });
});
var hello = function () { var w = window.__hfsHome; if (!w || w.closed) return; try { w.postMessage({ type: 'hfs-flex-hello', v: window.__hfsResident.v, tpl: !!localStorage.getItem(TPL_KEY), busy: !!window.__hfsRun, at: Date.now() }, ORG); } catch (e) {} };
R.hello = hello;
setInterval(hello, 20000);
} else { R.main = main; R.v = V; }
await main({ auto: false });
try { R.hello(); } catch (e) {}
})();
