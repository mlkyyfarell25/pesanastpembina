(function(){
 const box=document.getElementById('pasteBox'), fileInput=document.getElementById('excelFile'), importBtn=document.getElementById('importBtn'), clearBtn=document.getElementById('clearBtn'), status=document.getElementById('status'), preview=document.getElementById('preview'), exportArea=document.getElementById('exportArea'), downloadBtn=document.getElementById('downloadBtn');
 let imported=[];
 const clean=v=>String(v??'').replace(/\u00a0/g,' ').replace(/\r/g,'').trim();
 const norm=h=>clean(h).toLowerCase().normalize('NFKC').replace(/[：:]/g,'').replace(/[“”"']/g,'').replace(/\s+/g,' ');
 function mapHeaders(headers){
   const h=headers.map(norm);
   const find=(tests)=>{for(let i=0;i<h.length;i++){if(tests.some(t=>h[i]===t || h[i].includes(t))) return i;}return -1;};
   return {
     timestamp:find(['timestamp','waktu','tanggal','date']),
     name:find(['nama lengkap','nama']),
     to:find(['kakak penguji / asisten pembina','kakak penguji/asisten pembina','kakak penguji','asisten pembina','dituju','untuk','penerima']),
     message:find(['kesan dan pesan','kesan & pesan','pesan dan kesan','pesan','kesan'])
   };
 }
 function fromHTML(html){
   const doc=new DOMParser().parseFromString(html,'text/html');
   const table=doc.querySelector('table'); if(!table)return null;
   return [...table.querySelectorAll('tr')].map(tr=>[...tr.children].map(td=>clean(td.textContent)));
 }
 function fromTSV(text){
   const rows=text.replace(/\r/g,'').split('\n').filter(r=>r.trim()!=='');
   return rows.map(r=>r.includes('\t') ? r.split('\t').map(clean) : r.split(/\s{2,}/).map(clean));
 }
 function parse(text,html){
   const table=html?fromHTML(html):null;
   const matrix=table&&table.length>1?table:fromTSV(text);
   if(!matrix.length)return [];
   // Excel sometimes puts an invisible BOM at the start of the first header.
   matrix[0][0]=clean(matrix[0][0]).replace(/^\uFEFF/,'');
   const m=mapHeaders(matrix[0]);
   if(m.name<0||m.to<0||m.message<0){
     throw new Error('Header Excel belum terbaca. Pastikan baris pertama yang kamu copy berisi: Timestamp | Nama Lengkap | Kakak Penguji / Asisten Pembina | Kesan dan Pesan.');
   }
   return matrix.slice(1).map(row=>({
      timestamp:m.timestamp>=0?clean(row[m.timestamp]):'',
      name:clean(row[m.name]),
      to:clean(row[m.to]),
      message:clean(row[m.message])
   })).filter(r=>r.name||r.to||r.message);
 }
 box.addEventListener('paste',e=>{
   const html=e.clipboardData.getData('text/html');
   if(html){ box.dataset.html=html; }
   else delete box.dataset.html;
   // Do not preventDefault: letting the browser paste plain text avoids some Excel/Chrome clipboard quirks.
 });
 fileInput.addEventListener('change', async ()=>{
   const file=fileInput.files[0]; if(!file)return;
   try{
     if(!window.XLSX) throw new Error('Library Excel belum termuat. Pastikan perangkat terhubung ke internet lalu refresh halaman.');
     const data=await file.arrayBuffer();
     const wb=XLSX.read(data,{type:'array',cellDates:true});
     const ws=wb.Sheets[wb.SheetNames[0]];
     const matrix=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});
     if(!matrix.length) throw new Error('File Excel kosong.');
     matrix[0]=matrix[0].map(clean);
     const m=mapHeaders(matrix[0]);
     if(m.name<0||m.to<0||m.message<0) throw new Error('Kolom Excel belum terbaca. Pastikan ada kolom Nama Lengkap, Kakak Penguji / Asisten Pembina, dan Kesan dan Pesan.');
     imported=matrix.slice(1).map(row=>({timestamp:m.timestamp>=0?clean(row[m.timestamp]):'',name:clean(row[m.name]),to:clean(row[m.to]),message:clean(row[m.message])})).filter(r=>r.name||r.to||r.message);
     showResult();
   }catch(err){showError(err.message);}
 });
 function showResult(){
   if(!imported.length) throw new Error('Belum ada data.');
   const groups={}; imported.forEach(r=>(groups[r.to]??=[]).push(r));
   status.className='status'; status.style.background=''; status.style.color=''; status.textContent=`Berhasil membaca ${imported.length} pesan dari ${Object.keys(groups).length} penerima.`;
   preview.innerHTML=`<div class="preview-title">Preview penerima</div><div class="mini-grid">${Object.entries(groups).map(([n,arr])=>`<div class="mini"><strong>${escapeHtml(n)}</strong><span>${arr.length} pesan</span></div>`).join('')}</div>`;
   exportArea.classList.remove('hidden');
 }
 function showError(msg){status.className='status';status.style.background='#fff0ee';status.style.color='#7a2e26';status.textContent=msg;exportArea.classList.add('hidden');}
 importBtn.onclick=()=>{
   try{
     imported=parse(box.value,box.dataset.html);
     showResult();
   }catch(err){showError(err.message);}
 };
 clearBtn.onclick=()=>{box.value='';delete box.dataset.html;status.className='status hidden';preview.innerHTML='';exportArea.classList.add('hidden');imported=[];};
 downloadBtn.onclick=()=>{const content='window.PESAN_DATA = '+JSON.stringify(imported,null,2)+';\n'; const blob=new Blob([content],{type:'text/javascript;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='data.js'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
 function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
})();
