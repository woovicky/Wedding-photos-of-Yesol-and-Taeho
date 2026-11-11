(async () => {
  'use strict';
  const A=window.Archive, esc=A.escape, $=s=>document.querySelector(s);
  let data=A.clone(window.ALBUM_DATA), draft=false; const objectURLs=[]; const resolved=new Map();
  if(new URLSearchParams(location.search).has('draft')){
    try {const d=await A.get('state','album');if(d){data=A.validate(d);draft=true;for(const path of A.filePaths(data)){const b=await A.get('files',path);if(b){const u=URL.createObjectURL(b);objectURLs.push(u);resolved.set(path,u)}}}}catch(e){$('#notice').textContent=e.message;$('#notice').classList.add('show')}
  }
  const url=path=>resolved.get(path)||path;
  const photos=A.allPhotos(data);let shownPhotos=[],viewerIndex=0,touchX=null,swiped=false,lastFocus=null,hashBefore='';
  $('#brand').textContent=data.title;$('#menu-brand').textContent=data.title;$('#footer-title').textContent=data.title;document.title=data.title+' — PHOTO ARCHIVE';
  $('#header-count').textContent='['+String(photos.length).padStart(3,'0')+']';$('#menu-all').textContent='['+String(photos.length).padStart(3,'0')+'] VIEW ALL';
  $('#menu-albums').innerHTML=data.albums.map(a=>`<a class="menu-album-link" href="#album/${encodeURIComponent(a.id)}"><span>${esc(a.title)}</span><small>[${String(a.photos.length).padStart(3,'0')}]</small></a>`).join('');
  function lock(){document.body.style.overflow='hidden'}function unlock(){document.body.style.overflow=''}
  $('#menu-open').onclick=()=>{$('#menu').showModal();lock()};$('#menu-close').onclick=()=>{$('#menu').close();unlock()};$('#menu').addEventListener('cancel',unlock);$('#menu').addEventListener('click',e=>{if(e.target.closest('a')){$('#menu').close();unlock();if(e.target.closest('a').hash===location.hash)render()}});
  $('#back-top').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
  function placeholder(a,i){return `<div class="placeholder color-${i}"><span class="position-mark">${String(data.albums.indexOf(a)+1).padStart(2,'0')} / ${String(i+1).padStart(2,'0')}</span><span class="frame-cross" aria-hidden="true"></span>${i===1?'<span class="empty-caption">사진을 기다리는 자리</span>':''}<span class="placeholder-label">${esc(a.title)}</span></div>`}
  function photoImage(p,full=false){return `<img src="${esc(url(full?p.src:p.thumb||p.src))}" alt="${esc(p.caption||p.filename||'앨범 사진')}" loading="lazy" decoding="async" draggable="false" style="object-position:${['top','bottom'].includes(p.position)?p.position:'center'}">`}
  function photoRatio(p){const r=Number(p.width)/Number(p.height);return Number.isFinite(r)&&r>0?Math.max(.1,Math.min(10,r)):2/3}
  function render(){
    if($('#viewer').open)closeViewer(false);const hash=decodeURIComponent(location.hash.slice(1));const root=$('#content');
    document.title=data.title+' — PHOTO ARCHIVE';
    if(hash==='about'){
      root.innerHTML=`<section class="about-page"><span class="about-kicker">A PERSONAL PHOTO ARCHIVE / ABOUT</span><h1>${esc(data.title).replace(/ /g,'<br>')}</h1><p class="about-description">${esc(data.description||'우리의 날들을 모아둔 사진집.')}</p><div class="about-counts"><span>[${String(data.albums.length).padStart(2,'0')}] ALBUMS</span><span>[${String(photos.length).padStart(3,'0')}] PHOTOGRAPHS</span><span>TO BE CONTINUED.</span></div></section>`;
    }else if(hash==='all'||hash.startsWith('album/')){
      const album=hash==='all'?null:data.albums.find(a=>a.id===hash.slice(6));
      if(hash!=='all'&&!album){root.innerHTML='<div class="album-empty"><span>NOT FOUND.</span><p>이 앨범을 찾을 수 없어요.</p><a href="#">[BACK TO INDEX]</a></div>';return}
      shownPhotos=album?photos.filter(p=>p.albumId===album.id):photos;
      root.innerHTML=`<section class="page-heading"><a class="back-link" href="#">← BACK TO INDEX</a><div class="page-title"><h1>${esc(album?album.title:'ALL PHOTOGRAPHS')}</h1><span class="counter">[${String(shownPhotos.length).padStart(3,'0')}]</span></div><p class="page-description">${esc(album?album.description||album.subtitle:'함께한 모든 순간들.')}</p></section>`+(shownPhotos.length?`<section class="photo-grid" aria-label="${esc(album?.subtitle||'전체 사진')}">${shownPhotos.map((p,i)=>`<figure class="photo-card"><button data-photo="${i}" aria-label="${esc((p.caption||p.filename||'사진')+' 크게 보기')}">${photoImage(p)}</button><figcaption><span class="photo-number">[${String(i+1).padStart(3,'0')}]</span><span class="caption-text">${esc(p.caption||'')}</span></figcaption></figure>`).join('')}</section>`:`<div class="album-empty"><span>[ NO PHOTOS YET ]</span><p>이곳에 우리의 사진을 차곡차곡 담을 예정이에요.</p></div>`);
      root.querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>openViewer(Number(b.dataset.photo),b));
    }else{
      root.innerHTML=`<section class="index-intro"><p>${esc(data.description||'우리의 날들을 모아둔 사진집.')}</p><span class="intro-right">[${String(data.albums.length).padStart(2,'0')}] ALBUMS<br>TOGETHER, ALWAYS.</span></section>`+data.albums.map((a,n)=>`<section class="album-band"><div class="album-title-row"><div class="album-title-group"><span class="album-num">[${String(n+1).padStart(2,'0')}]</span><h2><a href="#album/${encodeURIComponent(a.id)}">${esc(a.title)}</a></h2></div><a class="view-link" href="#album/${encodeURIComponent(a.id)}" aria-label="${esc(a.subtitle||a.title)} 앨범 보기">[VIEW]</a></div><div class="album-carousel ${a.photos.length?'':'is-empty'}" data-carousel="${esc(a.id)}" role="region" aria-roledescription="carousel" aria-label="${esc(a.subtitle||a.title)} 사진, 좌우로 넘겨보세요" tabindex="0">${a.photos.length?a.photos.map((p,i)=>`<button class="carousel-photo" data-carousel-photo="${i}" style="--photo-ratio:${photoRatio(p)}" aria-label="${esc((p.caption||p.filename||'사진')+' 크게 보기')}">${photoImage(p)}</button>`).join(''):[0,1,2].map(i=>`<div class="carousel-placeholder">${placeholder(a,i)}</div>`).join('')}</div><div class="album-meta"><span class="korean">${esc(a.subtitle||a.description||'')}</span><div class="carousel-meta">${a.photos.length>1?'<span class="swipe-hint">SWIPE</span><button class="carousel-nav" data-carousel-prev aria-label="이전 사진으로 스크롤">←</button>':''}<span>[${String(a.photos.length).padStart(3,'0')}] PHOTOGRAPHS</span>${a.photos.length>1?'<button class="carousel-nav" data-carousel-next aria-label="다음 사진으로 스크롤">→</button>':''}</div></div></section>`).join('')+(data.albums.length?'':'<div class="empty-index">아직 앨범이 없어요.</div>');
    }
    root.querySelectorAll('[data-carousel]').forEach(setupCarousel);
    if(draft){const banner=document.createElement('div');banner.className='editor-kicker';banner.innerHTML='<span>[LOCAL PREVIEW] 이 기기에서만 보이는 편집본이에요.</span><a href="edit.html">[BACK TO EDITOR ↗]</a>';root.prepend(banner)}
  }
  function setupCarousel(track){
    const album=data.albums.find(a=>a.id===track.dataset.carousel);if(!album)return;
    const band=track.closest('.album-band'),prev=band.querySelector('[data-carousel-prev]'),nextButton=band.querySelector('[data-carousel-next]');
    const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function update(){const end=Math.max(0,track.scrollWidth-track.clientWidth);if(prev)prev.disabled=track.scrollLeft<=2;if(nextButton)nextButton.disabled=track.scrollLeft>=end-2;}
    function step(dir){track.scrollBy({left:dir*track.clientWidth*.75,behavior:reduced()?'instant':'smooth'})}
    if(prev)prev.onclick=()=>step(-1);if(nextButton)nextButton.onclick=()=>step(1);
    track.addEventListener('scroll',update,{passive:true});
    track.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();step(e.key==='ArrowLeft'?-1:1)}});
    let startX=0,startY=0,startScroll=0,activePointer=null,dragged=false,suppressClick=false;
    track.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.button!==0)return;activePointer=e.pointerId;startX=e.clientX;startY=e.clientY;startScroll=track.scrollLeft;dragged=false;suppressClick=false;});
    track.addEventListener('pointermove',e=>{if(e.pointerId!==activePointer)return;const dx=e.clientX-startX,dy=e.clientY-startY;if(!dragged&&Math.abs(dx)>6&&Math.abs(dx)>Math.abs(dy)){dragged=true;suppressClick=true;track.setPointerCapture(e.pointerId);track.classList.add('is-dragging');}if(dragged){e.preventDefault();track.scrollLeft=startScroll-dx;}});
    function finish(e){if(e.pointerId!==activePointer)return;activePointer=null;track.classList.remove('is-dragging');if(track.hasPointerCapture(e.pointerId))track.releasePointerCapture(e.pointerId);setTimeout(()=>{suppressClick=false},0);}
    track.addEventListener('pointerup',finish);track.addEventListener('pointercancel',finish);
    track.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();}},true);
    track.querySelectorAll('[data-carousel-photo]').forEach(button=>button.onclick=()=>{shownPhotos=photos.filter(p=>p.albumId===album.id);openViewer(Number(button.dataset.carouselPhoto),button)});
    requestAnimationFrame(update);
  }
  function showPhoto(){const p=shownPhotos[viewerIndex];if(!p)return;$('#viewer-stage').classList.remove('zoomed');$('#viewer-zoom').textContent='[ZOOM +]';$('#viewer-image').src=url(p.src);$('#viewer-image').alt=p.caption||p.filename||'앨범 사진';$('#viewer-caption').textContent=p.caption||'';$('#viewer-album').textContent=p.albumTitle;$('#viewer-count').textContent='['+String(viewerIndex+1).padStart(3,'0')+' / '+String(shownPhotos.length).padStart(3,'0')+']';$('#viewer-download').href=url(p.original||p.src);$('#viewer-download').download=p.original?p.filename||p.id+'.jpg':p.id+'.jpg';$('#viewer-prev').hidden=shownPhotos.length<2;$('#viewer-next').hidden=shownPhotos.length<2;}
  function openViewer(i,trigger){lastFocus=trigger;viewerIndex=i;showPhoto();$('#viewer').showModal();lock()}
  function closeViewer(restore=true){$('#viewer').close();unlock();if(restore&&lastFocus?.isConnected)lastFocus.focus();$('#viewer-image').removeAttribute('src')}
  function next(delta){viewerIndex=(viewerIndex+delta+shownPhotos.length)%shownPhotos.length;showPhoto()}
  $('#viewer-close').onclick=()=>closeViewer();$('#viewer').addEventListener('cancel',()=>{unlock();$('#viewer-image').removeAttribute('src')});$('#viewer-prev').onclick=()=>next(-1);$('#viewer-next').onclick=()=>next(1);
  function zoom(){const state=$('#viewer-stage').classList.toggle('zoomed');$('#viewer-zoom').textContent=state?'[ZOOM −]':'[ZOOM +]';$('#viewer-zoom').setAttribute('aria-label',state?'사진 축소':'사진 확대')}
  $('#viewer-zoom').onclick=zoom;$('#viewer-image').onclick=()=>{if(!swiped)zoom();swiped=false};$('#viewer').addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();next(-1)}if(e.key==='ArrowRight'){e.preventDefault();next(1)}});
  $('#viewer-stage').addEventListener('touchstart',e=>{touchX=e.touches[0].clientX;swiped=false},{passive:true});$('#viewer-stage').addEventListener('touchend',e=>{if(!$('#viewer-stage').classList.contains('zoomed')&&touchX!==null){const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>55){swiped=true;next(dx>0?-1:1)}}touchX=null},{passive:true});
  window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0)});window.addEventListener('pagehide',()=>objectURLs.forEach(u=>URL.revokeObjectURL(u)));render();
})();
