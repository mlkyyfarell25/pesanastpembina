(function(){
  const root=document.getElementById('app');
  const rows=Array.isArray(window.PESAN_DATA)?window.PESAN_DATA:[];
  const slug=s=>s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const groups={}; rows.forEach(r=>{(groups[r.to]??=[]).push(r)});
  const names=Object.keys(groups);
  const params=new URLSearchParams(location.search); const target=params.get('to');
  function formatDate(v){const d=new Date(v); if(Number.isNaN(d.getTime())) return v||''; return d.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});}
  if(!target){
    root.innerHTML=`<section class="hero"><div class="eyebrow">SEBUAH PESAN</div><h1>Pesan Untukmu</h1><p>Pilih nama untuk membuka kumpulan pesan.</p></section><section class="recipient-list">${names.map(n=>`<a class="recipient-card" href="?to=${encodeURIComponent(slug(n))}"><div class="icon">💌</div><h2>${esc(n)}</h2><div class="count">${groups[n].length} pesan</div><span class="arrow">Buka pesan →</span></a>`).join('')}</section><p style="text-align:center;margin-top:35px"><a class="back" href="admin.html">Admin · Import data dari Excel</a></p>`;
    return;
  }
  const name=names.find(n=>slug(n)===target);
  if(!name){root.innerHTML='<div class="empty">Pesan tidak ditemukan.<br><a class="back" href="index.html">Kembali</a></div>';return;}
  root.innerHTML=`<section class="letter"><a class="top-link" href="index.html">← Semua penerima</a><div class="letter-head"><div class="eyebrow">PESAN UNTUK</div><h1>${esc(name)}</h1><p>${groups[name].length} pesan yang ditulis khusus untukmu</p></div><section class="message-grid">${groups[name].map(r=>`<article class="message-card"><div class="from">Dari ${esc(r.name)}</div><div class="date">${esc(formatDate(r.timestamp))}</div><div class="message">${esc(r.message)}</div><div class="heart">♡</div></article>`).join('')}</section></section>`;
})();
