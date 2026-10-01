(async () => {
var HFS = 'https://startruckkorea-dev.github.io/hfs/', ORG = new URL(HFS).origin, TPL_KEY = 'hfs.collect.tpl.v1';
if (!/(^|\.)flex\.team$/.test(location.hostname)) { alert('flex.team 구성원 화면(https://flex.team/people/users)에서 눌러 주세요.'); return; }
if (window.__hfsRun) { try { window.__hfsRun.focus(); } catch (e) {} return; }
var hfsWin = window.open(HFS, 'hfs');
if (!hfsWin) { alert('HFS 창이 열리지 않았습니다 — 브라우저의 팝업 차단을 이 사이트에서 풀고 다시 눌러 주세요.'); return; }
try { hfsWin.focus(); } catch (e) {}
window.__hfsRun = hfsWin;
var diag = [], lastProg = null, finished = false;
var log = function (t) { diag.push(new Date().toTimeString().slice(0, 8) + ' ' + t); };
var prog = function (stage, extra) { lastProg = Object.assign({ type: 'hfs-flex-progress', stage: stage }, extra || {}); try { if (!hfsWin.closed) hfsWin.postMessage(lastProg, ORG); } catch (e) {} };
var beat = setInterval(function () { if (finished || !lastProg) return; if (hfsWin.closed) { clearInterval(beat); window.__hfsRun = null; return; } try { hfsWin.postMessage(lastProg, ORG); } catch (e) {} }, 1000);
var done = function () { finished = true; clearInterval(beat); window.__hfsRun = null; };
var fail = function (text) { log('실패: ' + text); prog('error', { text: text, diag: diag.join('\n') }); done(); };
var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
var tval = function (t) { return t && typeof t === 'object' ? (t.value || t.count || t.total || 0) : (t || 0); };
var pathOf = function (u) { try { return new URL(u, location.href).pathname; } catch (e) { return u; } };
var F = window.fetch;
log('시작 ' + location.href); prog('capture');
var users = new Map(), total = 0;
var emailsOf = function (j) { return ((j && (j.list || (j.data && j.data.list))) || []).map(function (u) { return u && u.basicInfo && u.basicInfo.email ? String(u.basicInfo.email).trim().toLowerCase() : ''; }).filter(Boolean); };
var add = function (j) { var L = (j && (j.list || (j.data && j.data.list))) || []; L.forEach(function (u) { var e = u && u.basicInfo && u.basicInfo.email; if (e) users.set(String(e).trim().toLowerCase(), u); }); if (j && tval(j.total)) total = tval(j.total); return j; };
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
if (v.length >= 20) { for (var i = 0; i < vals.length; i++) { var c = vals[i]; var at = v.indexOf(c.val); if (at >= 0 && c.val.length >= 20) { src = { store: c.store, key: c.key, path: c.path, prefix: v.slice(0, at), suffix: v.slice(at + c.val.length) }; break; } } }
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
var loadTpl = function () { try { var t = JSON.parse(localStorage.getItem(TPL_KEY) || 'null'); if (!t || !t.url || !t.slot) return null; var h = rebuildHeaders(t.headers || {}); if (!h) return null; return { url: t.url, method: t.method, headers: h, body: t.body, slot: t.slot }; } catch (e) { return null; } };
var saveTpl = function (T, slot) { try { localStorage.setItem(TPL_KEY, JSON.stringify({ url: T.url, method: T.method, headers: bindHeaders(T.headers), body: T.body, slot: slot, at: Date.now() })); } catch (e) {} };
var dropTpl = function () { try { localStorage.removeItem(TPL_KEY); } catch (e) {} };
var setPath = function (o, path, v) { var cur = o; for (var i = 0; i < path.length - 1; i++) { if (cur[path[i]] == null || typeof cur[path[i]] !== 'object') cur[path[i]] = {}; cur = cur[path[i]]; } cur[path[path.length - 1]] = v; };
var place = function (T, c, val) {
var url = T.url, headers = Object.assign({}, T.headers), body = T.body;
if (c.kind === 'body') { var o = {}; try { o = T.body ? JSON.parse(T.body) : {}; } catch (e) { o = {}; } setPath(o, c.path, val == null ? null : val); body = JSON.stringify(o); }
else if (c.kind === 'query') { var u = new URL(url, location.href); if (val == null) u.searchParams.delete(c.key); else u.searchParams.set(c.key, val); url = u.toString(); }
else { if (val == null) delete headers[c.key]; else headers[c.key] = val; }
return { url: url, headers: headers, body: body };
};
var send = async function (T, q) {
var res = await F(q.url, { method: T.method, headers: q.headers, body: (T.method === 'GET' || T.method === 'HEAD') ? undefined : q.body, credentials: 'include' });
if (!res.ok) throw new Error('HTTP ' + res.status);
return res.json();
};
var readAll = async function (T) {
var cont = null, pages = 0, prevSize = -1;
for (var pg = 0; pg < 100; pg++) {
var j = add(await send(T, place(T, T.slot, cont))); pages++;
prog('read', { count: users.size, total: total, pages: pages });
if (!j || !j.hasNext || !j.continuation || j.continuation === cont) break;
if (users.size === prevSize && pg > 0) throw new Error('같은 페이지가 되풀이됨');
prevSize = users.size; cont = j.continuation;
}
log('읽기 ' + pages + '페이지 · ' + users.size + '명');
return users.size > 0;
};
var ok = false;
var T = loadTpl();
if (T) { log('저장된 틀 사용: ' + T.method + ' ' + pathOf(T.url)); try { ok = await readAll(T); } catch (e) { log('저장된 틀 실패: ' + e.message + ' → 다시 잡는다'); dropTpl(); users = new Map(); total = 0; } }
if (!ok) {
var caps = [], liveRes = [];
var hdrs = function (src) { var h = {}; if (src) { if (Array.isArray(src)) src.forEach(function (kv) { h[kv[0]] = kv[1]; }); else if (typeof src.forEach === 'function') src.forEach(function (v, k) { h[k] = v; }); else Object.assign(h, src); } return h; };
window.fetch = async function (input, init) {
var url = typeof input === 'string' ? input : (input && input.url) || '', pre = null;
if (/search-users/i.test(url)) {
try { var body = init && init.body; if (body == null && input && typeof input.clone === 'function') { try { body = await input.clone().text(); } catch (e) {} }
pre = { url: url, method: ((init && init.method) || (input && input.method) || 'GET').toUpperCase(), headers: hdrs((init && init.headers) || (input && input.headers)), body: typeof body === 'string' ? body : null }; } catch (e) {}
}
var res = await F.apply(this, arguments);
if (pre) { try { res.clone().json().then(function (j) { caps.push({ req: pre, res: j }); liveRes.push(j); }).catch(function () {}); } catch (e) {} }
return res;
};
var XO = XMLHttpRequest.prototype.open, XS = XMLHttpRequest.prototype.send, XH = XMLHttpRequest.prototype.setRequestHeader;
XMLHttpRequest.prototype.open = function (m, u) { this.__hfs = { method: String(m).toUpperCase(), url: String(u), headers: {} }; return XO.apply(this, arguments); };
XMLHttpRequest.prototype.setRequestHeader = function (k, v) { if (this.__hfs) this.__hfs.headers[k] = v; return XH.apply(this, arguments); };
XMLHttpRequest.prototype.send = function (b) {
var r = this.__hfs, x = this;
if (r && /search-users/i.test(r.url)) { r.body = typeof b === 'string' ? b : null; x.addEventListener('load', function () { try { var j = JSON.parse(x.responseText); caps.push({ req: r, res: j }); liveRes.push(j); } catch (e) {} }); }
return XS.apply(this, arguments);
};
var scrollers = function () { return Array.prototype.filter.call(document.querySelectorAll('*'), function (el) { var s = getComputedStyle(el); return /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 40; }); };
var nudge = function () {
scrollers().forEach(function (el) { el.scrollTop = Math.min(el.scrollTop + el.clientHeight * 0.9, el.scrollHeight); var last = el.lastElementChild; try { if (last && el.scrollTop + el.clientHeight >= el.scrollHeight - 5) last.scrollIntoView({ block: 'end' }); } catch (e) {} el.dispatchEvent(new Event('scroll', { bubbles: true })); });
window.scrollBy(0, window.innerHeight * 0.9);
};
var setInput = function (el, v) { try { var d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'); d.set.call(el, v); } catch (e) { el.value = v; } el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
var retrigger = async function () {
var inp = Array.prototype.find.call(document.querySelectorAll('input[type="search"],input[type="text"],input:not([type])'), function (el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && /검색|search|이름|name/i.test((el.placeholder || '') + ' ' + (el.getAttribute('aria-label') || '')); });
if (!inp) return false;
log('검색 칸으로 다시 요청'); inp.focus(); setInput(inp, 'a'); await sleep(1500); setInput(inp, ''); await sleep(2500); return true;
};
for (var i = 0; i < 25 && !caps.length; i++) { nudge(); await sleep(400); }
if (!caps.length) { await retrigger(); for (var i2 = 0; i2 < 15 && !caps.length; i2++) { nudge(); await sleep(400); } }
if (!caps.length) { fail('Flex 구성원 목록 요청을 잡지 못했습니다. Flex 탭을 새로고침한 뒤 북마크를 다시 눌러 주세요.'); return; }
var C = caps[0].req, R = caps[0].res;
var bodyObj = null; try { bodyObj = C.body ? JSON.parse(C.body) : null; } catch (e) {}
log('요청 잡음: ' + C.method + ' ' + pathOf(C.url) + ' · 본문 ' + (bodyObj ? 'JSON(' + Object.keys(bodyObj).join(',') + ')' : (C.body ? '문자열' : '없음')) + ' · 헤더 ' + Object.keys(C.headers).join(','));
log('응답: list ' + ((R && R.list) || []).length + ' · hasNext ' + (R && R.hasNext) + ' · total ' + tval(R && R.total));
var tokish = function (v) { return typeof v === 'string' && /^[A-Za-z0-9_-]{20,}$/.test(v); };
var cands = [];
(function walk(o, path) { if (!o || typeof o !== 'object') return; Object.keys(o).forEach(function (k) { var v = o[k], p = path.concat(k); if (tokish(v)) cands.push({ kind: 'body', path: p }); else if (v && typeof v === 'object') walk(v, p); }); })(bodyObj, []);
try { new URL(C.url, location.href).searchParams.forEach(function (v, k) { if (tokish(v)) cands.push({ kind: 'query', key: k }); }); } catch (e) {}
Object.keys(C.headers).forEach(function (k) { if (!/^(authorization|cookie|x-csrf|content|accept|user-agent)/i.test(k) && tokish(C.headers[k])) cands.push({ kind: 'header', key: k }); });
if (bodyObj && !cands.some(function (c) { return c.kind === 'body' && c.path.length === 1 && c.path[0] === 'continuation'; })) cands.push({ kind: 'body', path: ['continuation'] });
cands.push({ kind: 'query', key: 'continuation' });
var cname = function (c) { return c.kind === 'body' ? '본문 ' + c.path.join('.') : c.kind === 'query' ? 'query ' + c.key : '헤더 ' + c.key; };
var slot = null, known = emailsOf(R);
for (var ci = 0; ci < cands.length && !slot; ci++) {
var c = cands[ci];
try {
var probe;
if (R && R.hasNext && R.continuation) { probe = await send(C, place(C, c, R.continuation)); if (emailsOf(probe).some(function (e) { return known.indexOf(e) < 0; })) { slot = c; add(probe); } else log('후보 ' + cname(c) + ': 새 사람 없음'); }
else { probe = await send(C, place(C, c, null)); var em = emailsOf(probe); if (em.length && em.some(function (e) { return known.indexOf(e) < 0; })) slot = c; else log('후보 ' + cname(c) + ': 첫 페이지 아님'); }
} catch (e) { log('후보 ' + cname(c) + ': ' + e.message); }
}
log(slot ? 'continuation 자리: ' + cname(slot) : 'continuation 자리를 못 찾음 → 화면을 내리며 모으기');
if (slot) { C.slot = slot; saveTpl(C, slot); try { ok = await readAll(C); } catch (e) { log('읽기 실패: ' + e.message); } }
if (!ok) {
liveRes.splice(0).forEach(add);
var last = -1, still = 0;
for (var k = 0; k < 300 && still < 10; k++) { nudge(); await sleep(400); liveRes.splice(0).forEach(add); if (users.size === last) still++; else { still = 0; last = users.size; } prog('read', { count: users.size, total: total, scroll: true }); }
log('화면 내리며 모음: ' + users.size + '명');
}
}
if (!users.size) { fail('구성원을 읽지 못했습니다. Flex 탭을 새로고침한 뒤 북마크를 다시 눌러 주세요.'); return; }
var payload = { type: 'hfs-flex-users', users: Array.from(users.values()), total: total, at: Date.now() }, acked = false;
window.addEventListener('message', function (ev) { if (ev.origin === ORG && ev.data && ev.data.type === 'hfs-flex-ack') { acked = true; log('HFS 받음'); done(); } });
prog('send', { count: users.size, total: total, partial: !!(total && users.size < total) });
for (var n = 0; n < 600 && !acked; n++) {
if (hfsWin.closed) { done(); return; }
try { hfsWin.postMessage(payload, ORG); } catch (e) {}
await sleep(1000);
}
if (!acked) { done(); }
})();
