const $ = (id) => document.getElementById(id);

const molecules = {
  water: {name:"Air", formula:"H₂O", geometry:"Bengkok", atoms:[["O",132,82,"o"],["H",77,49,"h"],["H",80,142,"h"]], bonds:[[132,98,77,65],[132,98,80,158]]},
  co2: {name:"Karbon dioksida", formula:"CO₂", geometry:"Linear", atoms:[["C",132,82,"c"],["O",58,82,"o"],["O",207,82,"o"]], bonds:[[132,98,58,98],[148,98,207,98]]},
  methane: {name:"Metana", formula:"CH₄", geometry:"Tetrahedral", atoms:[["C",132,82,"c"],["H",67,42,"h"],["H",199,42,"h"],["H",66,139,"h"],["H",200,139,"h"]], bonds:[[132,98,67,58],[145,98,199,58],[132,98,66,155],[145,98,200,155]]},
  ammonia: {name:"Amonia", formula:"NH₃", geometry:"Piramida trigonal", atoms:[["N",132,82,"n"],["H",70,48,"h"],["H",196,48,"h"],["H",132,151,"h"]], bonds:[[132,98,70,64],[145,98,196,64],[138,104,138,151]]},
  oxygen: {name:"Oksigen", formula:"O₂", geometry:"Diatomik", atoms:[["O",87,82,"o"],["O",174,82,"o"]], bonds:[[87,98,174,98]]}
};
const substances = {water:"Air (H₂O)",co2:"Karbon dioksida (CO₂)",methane:"Metana (CH₄)",ammonia:"Amonia (NH₃)",oxygen:"Oksigen (O₂)"};
let rotation = {x:-10,y:0}, dragging = false, last = {x:0,y:0}, zoom = 1, viewMode = "ball";

const featureData = [
 ["OK-VIS-001","Editor Struktur Molekul 3D","Buat dan edit struktur atom serta konektivitas ikatan.","visual","⚛"],
 ["OK-VIS-002","Render Atom Berbasis Unsur","Warna, radius, dan label visual atom.","visual","◉"],
 ["OK-VIS-003","Visualisasi Ikatan Kovalen","Tampilkan konektivitas dan orde ikatan.","visual","⌁"],
 ["OK-VIS-004","Visualisasi Interaksi Ionik","Petakan muatan dan interaksi elektrostatik.","visual","⊕"],
 ["OK-VIS-005","Pengukur Panjang Ikatan","Ukur jarak antarnukleus dan bandingkan referensi.","visual","↔"],
 ["OK-VIS-006","Pengukur Sudut Ikatan","Hitung sudut tiga atom yang dipilih.","visual","∠"],
 ["OK-REA-026","Perancang Campuran Zat A dan B","Atur spesies dan komposisi awal skenario.","reactor","⚗"],
 ["OK-REA-027","Neraca Massa Reaksi","Periksa kekekalan atom dalam persamaan.","reactor","≋"],
 ["OK-REA-030","Pengendali Suhu Virtual","Ubah parameter suhu model konseptual.","reactor","♨"],
 ["OK-REA-031","Pengendali Tekanan Sistem","Atur tekanan untuk model yang mendukungnya.","reactor","◴"],
 ["OK-REA-036","Kalkulator Entalpi Reaksi","Analisis perubahan entalpi dari data referensi.","reactor","Δ"],
 ["OK-REA-042","Simulasi Kesetimbangan Kimia","Hitung komposisi dari konstanta kesetimbangan.","reactor","⇌"],
 ["OK-SPC-051","Simulator Spektrum FTIR","Visualisasikan spektrum inframerah.","analysis","⌁"],
 ["OK-SPC-053","Simulator NMR Proton","Tampilkan sinyal ¹H NMR dari data/model.","analysis","∿"],
 ["OK-SPC-058","Simulator Spektrometri Massa","Tampilkan spektrum massa dan kandidat ion.","analysis","▥"],
 ["OK-SPC-067","Pencocokan Basis Data Spektrum","Bandingkan spektrum dengan referensi.","analysis","⌕"],
 ["OK-MAT-076","Editor Rantai Polimer","Buat model rantai dengan unit ulang.","material","⛓"],
 ["OK-MAT-081","Visualisasi Sel Satuan Kristal","Tampilkan kisi dan koordinat atom.","material","◇"],
 ["OK-MAT-091","Model Biopolimer Protein","Jelajahi struktur protein yang tersedia.","material","⌘"],
 ["OK-MAT-096","Prediksi Sifat Fisikokimia","Estimasi deskriptor dengan model terdokumentasi.","material","ƒ"],
 ["OK-SAF-101","Inventaris Bahaya Zat","Kelola klasifikasi bahaya dan sumbernya.","safety","!"],
 ["OK-SAF-102","Penampil Lembar Data Keselamatan","Tampilkan tautan SDS dan informasi keselamatan.","safety","▤"],
 ["OK-SAF-104","Penilaian Risiko Eksperimen","Susun matriks kemungkinan dan dampak.","safety","◇"],
 ["OK-SAF-105","Pemeriksa APD Digital","Tampilkan APD berdasarkan penilaian risiko.","safety","⬡"],
 ["OK-SAF-123","Pelacakan Riwayat Eksperimen","Catat parameter, versi, input, dan hasil.","safety","◷"]
];

function renderMolecule(key) {
  const m = molecules[key] || molecules.water;
  $("viewerTitle").textContent = `${m.name.toLocaleUpperCase("id-ID")} / ${m.formula}`;
  $("atomCount").textContent = m.atoms.length;
  $("bondCount").textContent = m.bonds.length;
  $("geometry").textContent = m.geometry;
  $("formula").textContent = m.formula;
  const canvas = $("moleculeCanvas");
  canvas.innerHTML = "";
  const assembly = document.createElement("div");
  assembly.className = "mol-assembly";
  assembly.style.transform = `scale(${zoom}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;
  m.bonds.forEach(([x1,y1,x2,y2]) => {
    const bond = document.createElement("div");
    bond.className = "mol-bond";
    const dx=x2-x1, dy=y2-y1, len=Math.sqrt(dx*dx+dy*dy);
    bond.style.left=`${x1}px`; bond.style.top=`${y1}px`;
    bond.style.width=`${len}px`; bond.style.transform=`rotate(${Math.atan2(dy,dx)*180/Math.PI}deg)`;
    if(viewMode==="space"){bond.style.opacity=".2";bond.style.height="5px";}
    assembly.appendChild(bond);
  });
  m.atoms.forEach(([symbol,x,y,cls],i) => {
    const atom=document.createElement("div");
    atom.className=`mol-atom ${cls}${viewMode==="space"?" space":""}`;
    const scale=Number($("atomScale").value)/100;
    const base=cls==="h"?35:cls==="c"?49:cls==="n"?47:53;
    const size=base*scale*(viewMode==="space"?1.32:1);
    atom.style.width=`${size}px`;atom.style.height=`${size}px`;
    atom.style.left=`${x-size/2}px`;atom.style.top=`${y-size/2}px`;
    atom.style.transform=`translateZ(${i%2===0?14:-14}px)`;
    atom.textContent=symbol;
    if($("showLabels").checked){const label=document.createElement("small");label.textContent=`${symbol}${i+1}`;atom.appendChild(label);}
    assembly.appendChild(atom);
  });
  canvas.appendChild(assembly);
}
function updateRotation() {
  const assembly=document.querySelector(".mol-assembly");
  if(assembly) assembly.style.transform=`scale(${zoom}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;
}
$("moleculeSelect").addEventListener("change",e=>renderMolecule(e.target.value));
$("atomScale").addEventListener("input",e=>{$("atomScaleValue").textContent=`${e.target.value}%`;renderMolecule($("moleculeSelect").value);});
$("rotationSpeed").addEventListener("input",e=>$("rotationValue").textContent=`${(e.target.value/10).toFixed(1)}×`);
$("showLabels").addEventListener("change",()=>renderMolecule($("moleculeSelect").value));
$("autoRotate").addEventListener("change",e=>{if(e.target.checked) startRotation();});
$("resetView").addEventListener("click",()=>{rotation={x:-10,y:0};zoom=1;renderMolecule($("moleculeSelect").value);});
$("viewBall").addEventListener("click",()=>{viewMode="ball";$("viewBall").classList.add("active");$("viewSpace").classList.remove("active");renderMolecule($("moleculeSelect").value);});
$("viewSpace").addEventListener("click",()=>{viewMode="space";$("viewSpace").classList.add("active");$("viewBall").classList.remove("active");renderMolecule($("moleculeSelect").value);});
const stage=$("moleculeCanvas");
stage.addEventListener("pointerdown",e=>{dragging=true;last={x:e.clientX,y:e.clientY};stage.setPointerCapture(e.pointerId);});
stage.addEventListener("pointermove",e=>{if(!dragging)return;rotation.y+=(e.clientX-last.x)*.7;rotation.x-=(e.clientY-last.y)*.7;last={x:e.clientX,y:e.clientY};updateRotation();});
stage.addEventListener("pointerup",()=>dragging=false);
stage.addEventListener("pointercancel",()=>dragging=false);
stage.addEventListener("wheel",e=>{e.preventDefault();zoom=Math.max(.55,Math.min(1.65,zoom+(e.deltaY<0?.08:-.08)));updateRotation();},{passive:false});
let autoTimer;
function startRotation(){clearInterval(autoTimer);autoTimer=setInterval(()=>{if($("autoRotate").checked&&!dragging){rotation.y+=Number($("rotationSpeed").value)*.035;updateRotation();}},30);}
$("screenshotBtn").addEventListener("click",()=>{
  const m=molecules[$("moleculeSelect").value];
  const svgParts=[`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="100%" height="100%" fill="#101c2e"/><text x="35" y="45" fill="#63e6dc" font-family="Arial" font-size="18">ORIGO KIMIA / MOLECULAR EXPLORER</text><text x="35" y="80" fill="#edf4ff" font-family="Arial" font-size="24">${m.name} — ${m.formula}</text>`];
  const sx=x=>x*1.5+180, sy=y=>y*1.5+90;
  m.bonds.forEach(([x1,y1,x2,y2])=>svgParts.push(`<line x1="${sx(x1)}" y1="${sy(y1)}" x2="${sx(x2)}" y2="${sy(y2)}" stroke="#9bb6c9" stroke-width="12" stroke-linecap="round"/>`));
  const colors={h:"#d8e8f6",o:"#ff6571",c:"#7b93ad",n:"#9b8bff"};
  m.atoms.forEach(([symbol,x,y,cls],i)=>{svgParts.push(`<circle cx="${sx(x)}" cy="${sy(y)}" r="${cls==="h"?23:34}" fill="${colors[cls]}"/><text x="${sx(x)}" y="${sy(y)+5}" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="17" fill="#101c2e">${symbol}</text>`);if($("showLabels").checked)svgParts.push(`<text x="${sx(x)}" y="${sy(y)+48}" text-anchor="middle" fill="#c5d7e7" font-family="Arial" font-size="13">${symbol}${i+1}</text>`);});
  svgParts.push(`<text x="35" y="465" fill="#8fa2bb" font-family="Arial" font-size="13">Visualisasi edukatif — bukan hasil simulasi kuantum tervalidasi.</text></svg>`);
  const blob=new Blob([svgParts.join("")],{type:"image/svg+xml"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`origo-kimia-${$("moleculeSelect").value}.svg`;a.click();URL.revokeObjectURL(url);
});

function updateSliderLabels(){
  $("temperatureValue").textContent=`${$("temperature").value} °C`;
  $("pressureValue").textContent=`${(Number($("pressure").value)/10).toFixed(1)} bar`;
  $("resultTemp").textContent=$("temperatureValue").textContent;
  $("resultPressure").textContent=$("pressureValue").textContent;
}
$("temperature").addEventListener("input",updateSliderLabels);
$("pressure").addEventListener("input",updateSliderLabels);
$("simulateBtn").addEventListener("click",()=>{
  const a=$("substanceA").value,b=$("substanceB").value;
  $("resultIcon").textContent="◈";
  $("resultTitle").textContent=`${substances[a]} + ${substances[b]}`;
  $("resultText").textContent=a===b
    ?"Kedua pilihan mewakili spesies yang sama. Demo ini menampilkan skenario komposisi, bukan perubahan reaksi."
    :"Dua komponen telah dimasukkan ke skenario konseptual. Untuk menyimpulkan apakah reaksi terjadi dan produk apa yang terbentuk, diperlukan model kimia, kondisi fase, parameter energi, serta validasi ilmiah yang tidak tersedia pada demo ini.";
  $("resultTemp").textContent=$("temperatureValue").textContent;
  $("resultPressure").textContent=$("pressureValue").textContent;
  $("resultStatus").textContent="Konseptual";
});
function renderModules(){
  const filter=document.querySelector(".filter.active")?.dataset.filter||"all";
  const query=$("moduleSearch").value.trim().toLocaleLowerCase("id-ID");
  const items=featureData.filter(f=>(filter==="all"||f[3]===filter)&&(!query||f.join(" ").toLocaleLowerCase("id-ID").includes(query)));
  const grid=$("moduleGrid");grid.innerHTML="";
  if(!items.length){grid.innerHTML='<div class="empty-state">Tidak ada fitur yang cocok dengan pencarian.</div>';return;}
  items.forEach(([id,name,desc,cat,icon])=>{
    const card=document.createElement("article");card.className="module-card";
    const top=document.createElement("div");top.className="module-card-top";
    const ic=document.createElement("span");ic.className="module-icon";ic.textContent=icon;
    const code=document.createElement("span");code.className="module-id";code.textContent=id;
    top.append(ic,code);
    const h=document.createElement("h3");h.textContent=name;
    const p=document.createElement("p");p.textContent=desc;
    const category=document.createElement("span");category.className="module-category";category.textContent={visual:"Visualisasi",reactor:"Reaktor & termodinamika",analysis:"Spektroskopi & analisis",material:"Material & biokimia",safety:"Keselamatan"}[cat];
    card.append(top,h,p,category);grid.appendChild(card);
  });
}
$("moduleFilters").addEventListener("click",e=>{const btn=e.target.closest("[data-filter]");if(!btn)return;document.querySelectorAll(".filter").forEach(b=>b.classList.toggle("active",b===btn));renderModules();});
$("moduleSearch").addEventListener("input",renderModules);
$("themeBtn").addEventListener("click",()=>document.body.classList.toggle("light-theme"));
renderMolecule("water");startRotation();updateSliderLabels();renderModules();
           
