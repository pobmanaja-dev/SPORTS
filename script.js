/* ===== ข้อมูลรายการทำฟัน (แก้ราคาได้ที่นี่) ===== */
const TREATMENTS = [
  { id: 't1', name: 'ตรวจฟันทั่วไป',   desc: 'ตรวจสุขภาพช่องปาก',        price: 300,  min: 30 },
  { id: 't2', name: 'ขูดหินปูน',       desc: 'ขูดหินปูนและขัดฟัน',       price: 800,  min: 45 },
  { id: 't3', name: 'อุดฟัน',          desc: 'อุดฟันผุ (ต่อซี่)',         price: 1000, min: 45 },
  { id: 't4', name: 'ถอนฟัน',          desc: 'ถอนฟันทั่วไป',             price: 1200, min: 45 },
  { id: 't5', name: 'รักษารากฟัน',     desc: 'รักษารากฟัน (ต่อครั้ง)',    price: 4500, min: 60 },
  { id: 't6', name: 'ฟอกสีฟัน',        desc: 'ฟอกฟันขาวที่คลินิก',        price: 5500, min: 60 },
  { id: 't7', name: 'จัดฟัน (ปรึกษา)', desc: 'ปรึกษาและวางแผนจัดฟัน',     price: 500,  min: 30 },
  { id: 't8', name: 'เปลี่ยนโอริง', desc: 'เปลี่ยนโอริงใหม่', price: 1000, min: 15 }
];
const TIMES = ['09:00','10:00','11:00','13:00','14:00','15:00','16:00'];

/* ===== ตัวช่วยเก็บข้อมูลใน localStorage ===== */
const db = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const hash = s => btoa(unescape(encodeURIComponent(s))); // สาธิตเท่านั้น ระบบจริงต้องแฮชที่เซิร์ฟเวอร์
const baht = n => n.toLocaleString('th-TH') + ' บาท';
const fmtDate = d => new Date(d + 'T00:00').toLocaleDateString('th-TH', { dateStyle: 'long' });

let session = db.get('session', null);   // อีเมลผู้ใช้ที่ล็อกอิน
let sel = { treatment: null, date: '', time: '' };

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}
const user = () => db.get('users', {})[session];

/* ===== การนำทางระหว่างหน้า ===== */
function go(page) {
  const needLogin = ['profile', 'book', 'mine'];
  if (needLogin.includes(page) && !session) { toast('กรุณาเข้าสู่ระบบก่อน'); page = 'auth'; }
  if (page === 'book' && !user()?.profile) { toast('กรุณากรอกประวัติส่วนตัวก่อนจองคิว'); page = 'profile'; }
  $$('.page').forEach(p => p.classList.toggle('show', p.id === page));
  if (page === 'profile') fillProfile();
  if (page === 'book') resetBooking();
  if (page === 'mine') renderMine();
  window.scrollTo(0, 0);
}
function renderNav() {
  $('#nav').innerHTML = session
    ? `<button data-go="book">จองคิว</button><button data-go="mine">นัดหมายของฉัน</button>
       <button data-go="profile">ประวัติส่วนตัว</button><button id="logout">ออกจากระบบ</button>`
    : `<button data-go="auth">เข้าสู่ระบบ / สมัครสมาชิก</button>`;
}
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); go(g.dataset.go); }
  if (e.target.id === 'logout') { session = null; db.set('session', null); renderNav(); go('home'); toast('ออกจากระบบแล้ว'); }
});

/* ===== สมัครสมาชิก / เข้าสู่ระบบ ===== */
$$('.tab').forEach(t => t.onclick = () => {
  $$('.tab').forEach(x => x.classList.toggle('on', x === t));
  $('#loginForm').hidden = t.dataset.tab !== 'login';
  $('#regForm').hidden = t.dataset.tab !== 'register';
});
$('#regForm').onsubmit = e => {
  e.preventDefault();
  const email = $('#rEmail').value.trim().toLowerCase(), users = db.get('users', {});
  if ($('#rPass').value !== $('#rPass2').value) return $('#rErr').textContent = 'รหัสผ่านไม่ตรงกัน';
  if (users[email]) return $('#rErr').textContent = 'อีเมลนี้สมัครไว้แล้ว ลองเข้าสู่ระบบ';
  users[email] = { pass: hash($('#rPass').value), profile: null };
  db.set('users', users); login(email); toast('สมัครสมาชิกสำเร็จ'); go('profile');
};
$('#loginForm').onsubmit = e => {
    e.preventDefault();
    const email = $('#lEmail').value.trim().toLowerCase(),
          u = db.get('users', {})[email];

    if (!u || u.pass !== hash($('#lPass').value))
        return $('#lErr').textContent = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';

    login(email);

    toast('ยินดีต้อนรับเข้าสู่ระบบ');

    go(u.profile ? 'book' : 'profile');
};
function login(email) { session = email; db.set('session', email); renderNav(); }

/* ===== ประวัติส่วนตัว ===== */
function fillProfile() {
  const p = user()?.profile || {};
  $('#pFirst').value = p.first || ''; $('#pLast').value = p.last || '';
  $('#pBirth').value = p.birth || ''; $('#pPhone').value = p.phone || '';
  $('#pAllergy').value = p.allergy || ''; $('#pOk').textContent = '';
}
$('#profileForm').onsubmit = e => {
  e.preventDefault();
  const users = db.get('users', {});
  users[session].profile = {
    first: $('#pFirst').value.trim(), last: $('#pLast').value.trim(), birth: $('#pBirth').value,
    phone: $('#pPhone').value.trim(), allergy: $('#pAllergy').value.trim()
  };
  db.set('users', users); toast('บันทึกข้อมูลแล้ว'); go('book');
};

/* ===== จองคิว ===== */
function showStep(n) {
  [1, 2, 3].forEach(i => $('#step' + i).hidden = i !== n);
  $$('#steps li').forEach((li, i) => li.classList.toggle('on', i === n - 1));
}
function resetBooking() {
  sel = { treatment: null, date: '', time: '' };
  $('#treatments').innerHTML = TREATMENTS.map(t =>
    `<button type="button" class="tr" data-id="${t.id}"><b>${t.name}</b><span>${t.desc} · ${t.min} นาที</span><em>${baht(t.price)}</em></button>`).join('');
  const today = new Date().toISOString().slice(0, 10);
  $('#bDate').min = today; $('#bDate').value = ''; $('#slots').innerHTML = '';
  showStep(1);
}
$('#treatments').onclick = e => {
  const b = e.target.closest('.tr'); if (!b) return;
  sel.treatment = TREATMENTS.find(t => t.id === b.dataset.id);
  $$('.tr').forEach(x => x.classList.toggle('on', x === b));
};
$('#to2').onclick = () => sel.treatment ? showStep(2) : toast('กรุณาเลือกรายการทำฟัน');

$('#bDate').onchange = e => {
  sel.date = e.target.value; sel.time = '';
  if (new Date(sel.date + 'T00:00').getDay() === 0) {
    $('#slots').innerHTML = '<p class="err">คลินิกปิดวันอาทิตย์ กรุณาเลือกวันอื่น</p>'; sel.date = ''; return;
  }
  const taken = db.get('appts', []).filter(a => a.date === sel.date && a.status !== 'ยกเลิก').map(a => a.time);
  const nowHM = new Date().toTimeString().slice(0, 5), isToday = sel.date === new Date().toISOString().slice(0, 10);
  $('#slots').innerHTML = TIMES.map(t => {
    const bookedFull = (sel.date === '2026-10-24' && t === '14:00');

    const off =
        taken.includes(t) ||
        (isToday && t <= nowHM) ||
        bookedFull;

    return `<button type="button" class="slot" data-t="${t}" ${off ? 'disabled' : ''}>
        ${bookedFull ? '14:00 (เต็ม)' : t}
    </button>`;
}).join('');
};
$('#slots').onclick = e => {
  const b = e.target.closest('.slot'); if (!b || b.disabled) return;
  sel.time = b.dataset.t; $$('.slot').forEach(x => x.classList.toggle('on', x === b));
};
$('#to3').onclick = () => {
  if (!sel.date || !sel.time) return toast('กรุณาเลือกวันและเวลา');
  const p = user().profile;
  $('#summary').innerHTML = `
    <div><span>ผู้ป่วย</span><span>${p.first} ${p.last}</span></div>
    <div><span>การรักษา</span><span>${sel.treatment.name}</span></div>
    <div><span>วันเวลา</span><span>${fmtDate(sel.date)} ${sel.time} น.</span></div>
    <div class="total"><span>ยอดชำระ</span><span>${baht(sel.treatment.price)}</span></div>`;
  $('#qrAmt').textContent = baht(sel.treatment.price); drawQr(sel.treatment.price);
  $('#payErr').textContent = ''; showStep(3);
};
$$('[data-back]').forEach(b => b.onclick = () => showStep(+b.dataset.back));

/* ===== สร้าง QR พร้อมเพย์แบบล็อกยอด (EMV / Thai QR Payment) ===== */
const PP_ID = '0066641292354'; // รหัสพร้อมเพย์ที่อ่านจาก QR ของร้าน (รูปแบบ 0066 + เบอร์โทร 9 หลัก)
function crc16(s) {
  let c = 0xFFFF;
  for (let i = 0; i < s.length; i++) {
    c ^= s.charCodeAt(i) << 8;
    for (let k = 0; k < 8; k++) c = (c & 0x8000) ? ((c << 1) ^ 0x1021) : (c << 1);
    c &= 0xFFFF;
  }
  return c.toString(16).toUpperCase().padStart(4, '0');
}
function ppPayload(amount) {
  const id = '0016A000000677010111' + '0113' + PP_ID;
  const amt = amount.toFixed(2);
  const body = '000201' + '010212' + '29' + String(id.length).padStart(2, '0') + id +
    '5303764' + '54' + String(amt.length).padStart(2, '0') + amt + '5802TH' + '6304';
  return body + crc16(body);
}
function drawQr(amount) {
  const box = $('#qrBox'); box.innerHTML = '';
  const ok = typeof QRCode !== 'undefined';
  box.hidden = !ok; $('#qrFallback').hidden = ok;   // ถ้าโหลดไลบรารีไม่ได้ ใช้รูป QR เดิมแทน
  if (ok) new QRCode(box, { text: ppPayload(amount), width: 240, height: 240, correctLevel: QRCode.CorrectLevel.M });
}

/* ===== ชำระเงิน ===== */
$$('input[name=pay]').forEach(r => r.onchange = () => {
  $('#payQr').hidden = document.querySelector('input[name=pay]:checked').value !== 'qr';
});
$('#confirm').onclick = () => {
  const method = document.querySelector('input[name=pay]:checked').value;
  const appts = db.get('appts', []);
  if (appts.some(a => a.date === sel.date && a.time === sel.time && a.status !== 'ยกเลิก'))
    return $('#payErr').textContent = 'คิวนี้เพิ่งถูกจองไป กรุณาเลือกเวลาใหม่';
  appts.push({
    id: Date.now(), email: session, treatment: sel.treatment.name, price: sel.treatment.price,
    date: sel.date, time: sel.time, method, status: method === 'qr' ? 'รอตรวจสอบยอดโอน' : 'รอชำระที่คลินิก'
  });
  if (!confirm('ยืนยันการจองคิวใช่หรือไม่?')) return;
  db.set('appts', appts);
toast('จองคิวสำเร็จแล้วจ้า');
go('mine');
};

/* ===== นัดหมายของฉัน ===== */
function renderMine() {
  const list = db.get('appts', []).filter(a => a.email === session).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  $('#myList').innerHTML = list.length ? list.map(a => `
    <div class="appt"><div><b>${a.treatment}</b><small>${fmtDate(a.date)} ${a.time} น. · ${baht(a.price)}</small></div>
      <div><span class="badge ${a.status.includes('รอ') ? 'wait' : ''}">${a.status}</span>
      ${a.status !== 'ยกเลิก' ? `<button class="btn danger" data-cancel="${a.id}">ยกเลิก</button>` : ''}</div></div>`).join('')
    : '<p>ยังไม่มีนัดหมาย <a href="#" data-go="book">จองคิวแรกของคุณ</a></p>';
}
$('#myList').onclick = e => {
  const id = e.target.dataset.cancel; if (!id || !confirm('ยืนยันการยกเลิกนัดจองคิวใช่หรือไม่')) return;
  const appts = db.get('appts', []); appts.find(a => a.id == id).status = 'ยกเลิก';
  db.set('appts', appts); renderMine(); toast('ทำการยกเลิกนัดแล้ว');
};

/* ===== เริ่มต้น ===== */
if (session && !user()) session = null;
renderNav(); go('home');
