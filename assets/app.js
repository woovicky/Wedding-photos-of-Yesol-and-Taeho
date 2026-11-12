/* Photo coordinates are centered in the viewer; scale is relative to fit-to-screen. */
function createPhotoViewport(maxScale=6){
  let width=1,height=1,fitWidth=1,fitHeight=1,scale=1,x=0,y=0;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const snapshot=()=>({width,height,fitWidth,fitHeight,scale,x,y});
  function set(nextScale,nextX,nextY){
    scale=clamp(nextScale,1,maxScale);
    const bx=Math.max(0,(fitWidth*scale-width)/2),by=Math.max(0,(fitHeight*scale-height)/2);
    x=clamp(nextX,-bx,bx);y=clamp(nextY,-by,by);return snapshot();
  }
  function resize(w,h,imageWidth,imageHeight){
    if(w<=0||h<=0||imageWidth<=0||imageHeight<=0)return snapshot();
    const oldW=fitWidth,oldH=fitHeight; width=w;height=h;
    const fit=Math.min(w/imageWidth,h/imageHeight);fitWidth=imageWidth*fit;fitHeight=imageHeight*fit;
    return set(scale,x*fitWidth/oldW,y*fitHeight/oldH);
  }
  function zoomAt(nextScale,point={x:0,y:0}){
    const s=clamp(nextScale,1,maxScale),ratio=s/scale;
    return set(s,point.x-(point.x-x)*ratio,point.y-(point.y-y)*ratio);
  }
  function beginPinch(a,b){const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};return {distance:Math.max(1,Math.hypot(b.x-a.x,b.y-a.y)),scale,anchorX:(mid.x-x)/scale,anchorY:(mid.y-y)/scale};}
  function pinch(gesture,a,b){const s=clamp(gesture.scale*Math.hypot(b.x-a.x,b.y-a.y)/gesture.distance,1,maxScale),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;return set(s,mx-gesture.anchorX*s,my-gesture.anchorY*s);}
  return {snapshot,set,resize,zoomAt,beginPinch,pinch,moveBy:(dx,dy)=>set(scale,x+dx,y+dy),reset:()=>set(1,0,0)};
}

(async () => {
  'use strict';
  const A=window.Archive, esc=A.escape, $=s=>document.querySelector(s);
  let data=A.clone(window.ALBUM_DATA), draft=false; const objectURLs=[]; const resolved=new Map();
  if(new URLSearchParams(location.search).has('draft')){
    try {const d=await A.get('state','album');if(d){data=A.validate(d);draft=true;for(const path of A.filePaths(data)){const b=await A.get('files',path);if(b){const u=URL.createObjectURL(b);objectURLs.push(u);resolved.set(path,u)}}}}catch(e){$('#notice').textContent=e.message;$('#notice').classList.add('show')}
  }
  const url=path=>resolved.get(path)||path;
  const siteTitle=(data.title==='OUR DAYS'?'YEASOL&TAEHO WEDDING':data.title).toUpperCase();
  const photos=A.allPhotos(data);let shownPhotos=[],viewerIndex=0,lastFocus=null;
  let keyboardNavigation=false,returnViewerFocus=true;
  document.addEventListener('keydown',()=>{keyboardNavigation=true;document.documentElement.classList.add('using-keyboard');},true);
  document.addEventListener('pointerdown',()=>{keyboardNavigation=false;document.documentElement.classList.remove('using-keyboard');},true);

  $('#brand').textContent=siteTitle;$('#menu-brand').textContent=siteTitle;document.title=siteTitle;
  $('#header-count').textContent='['+String(photos.length).padStart(3,'0')+']';$('#menu-all').textContent='['+String(photos.length).padStart(3,'0')+'] VIEW ALL';
  $('#menu-albums').innerHTML=data.albums.map(a=>`<a class="menu-album-link" href="#album/${encodeURIComponent(a.id)}"><span>${esc(a.title)}</span><small>[${String(a.photos.length).padStart(3,'0')}]</small></a>`).join('');
  function lock(){document.body.style.overflow='hidden'}function unlock(){document.body.style.overflow=''}
  $('#menu-open').onclick=()=>{$('#menu').showModal();lock()};$('#menu-close').onclick=()=>{$('#menu').close();unlock()};$('#menu').addEventListener('cancel',unlock);$('#menu').addEventListener('click',e=>{if(e.target.closest('a')){$('#menu').close();unlock();if(e.target.closest('a').hash===location.hash)render()}});
  function placeholder(a,i){return `<div class="placeholder color-${i}"><span class="position-mark">${String(data.albums.indexOf(a)+1).padStart(2,'0')} / ${String(i+1).padStart(2,'0')}</span><span class="frame-cross" aria-hidden="true"></span>${i===1?'<span class="empty-caption">사진을 기다리는 자리</span>':''}<span class="placeholder-label">${esc(a.title)}</span></div>`}
  function photoImage(p,full=false){return `<img src="${esc(url(p.src))}" alt="${esc(p.caption||p.filename||'앨범 사진')}" loading="lazy" decoding="async" draggable="false" style="object-position:${['top','bottom'].includes(p.position)?p.position:'center'}">`}
  function photoRatio(p){const r=Number(p.width)/Number(p.height);return Number.isFinite(r)&&r>0?Math.max(.1,Math.min(10,r)):2/3}
  function render(){
    if($('#viewer').open)closeViewer(false);const hash=decodeURIComponent(location.hash.slice(1));const root=$('#content');
    document.title=siteTitle;
    if(hash==='about'){
      root.innerHTML=`<section class="about-page"><span class="about-kicker">A PERSONAL PHOTO ARCHIVE / ABOUT</span><h1>${esc(siteTitle)}</h1><p class="about-description">${esc(data.description||'우리의 날들을 모아둔 사진집.')}</p><div class="about-counts"><span>[${String(data.albums.length).padStart(2,'0')}] ALBUMS</span><span>[${String(photos.length).padStart(3,'0')}] PHOTOGRAPHS</span><span>TO BE CONTINUED.</span></div></section>`;
    }else if(hash==='all'||hash.startsWith('album/')){
      const album=hash==='all'?null:data.albums.find(a=>a.id===hash.slice(6));
      if(hash!=='all'&&!album){root.innerHTML='<div class="album-empty"><span>NOT FOUND.</span><p>이 앨범을 찾을 수 없어요.</p><a href="#">[BACK TO INDEX]</a></div>';return}
      shownPhotos=album?photos.filter(p=>p.albumId===album.id):photos;
      root.innerHTML=`<section class="page-heading"><div class="page-title"><h1>${esc(album?album.title:'ALL PHOTOGRAPHS')}</h1><a class="back-link" href="#">← BACK TO INDEX</a></div></section>`+(shownPhotos.length?`<section class="photo-grid" aria-label="${esc(album?.subtitle||'전체 사진')}">${shownPhotos.map((p,i)=>`<figure class="photo-card"><button data-photo="${i}" aria-label="${esc((p.caption||p.filename||'사진')+' 크게 보기')}">${photoImage(p)}</button><figcaption><span class="photo-number">[${String(i+1).padStart(3,'0')}]</span><span class="caption-text">${esc(p.caption||'')}</span></figcaption></figure>`).join('')}</section>`:`<div class="album-empty" role="status"><span>NO PHOTOS YET</span></div>`);
      root.querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>openViewer(Number(b.dataset.photo),b));
    }else{
      root.innerHTML=``+data.albums.map((a,n)=>`<section class="album-band"><div class="album-title-row"><div class="album-title-group"><h2><a href="#album/${encodeURIComponent(a.id)}">${esc(a.title)}</a></h2></div><a class="view-link" href="#album/${encodeURIComponent(a.id)}" aria-label="${esc(a.subtitle||a.title)} 앨범 보기">[VIEW]</a></div><div class="album-carousel ${a.photos.length?'':'is-empty'}" data-carousel="${esc(a.id)}" role="region" aria-roledescription="carousel" aria-label="${esc(a.subtitle||a.title)} 사진, 좌우로 넘겨보세요" tabindex="0">${a.photos.length?a.photos.map((p,i)=>`<button class="carousel-photo" data-carousel-photo="${i}" style="--photo-ratio:${photoRatio(p)}" aria-label="${esc((p.caption||p.filename||'사진')+' 크게 보기')}">${photoImage(p)}</button>`).join(''):[0,1,2].map(i=>`<div class="carousel-placeholder">${placeholder(a,i)}</div>`).join('')}</div></section>`).join('')+(data.albums.length?'':'<div class="empty-index">아직 앨범이 없어요.</div>');
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
  const photoView=createPhotoViewport(6),stage=$('#viewer-stage'),viewerImage=$('#viewer-image');
  const pointers=new Map();let pinchGesture=null,panGesture=null,hadMultiple=false,moved=false,lastTap=null,frame=0,motion=0,stageRect=null;
  const reducedMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function stopMotion(){if(motion)cancelAnimationFrame(motion);motion=0;}
  function paint(){frame=0;const s=photoView.snapshot();viewerImage.style.width=(s.fitWidth*s.scale)+'px';viewerImage.style.height=(s.fitHeight*s.scale)+'px';viewerImage.style.transform=`translate(-50%,-50%) translate3d(${s.x}px,${s.y}px,0)`;stage.classList.toggle('is-zoomed',s.scale>1.01);$('#viewer-zoom').textContent=s.scale>1.01?`[${Math.round(s.scale*100)}% −]`:'[ZOOM +]';$('#viewer-zoom').setAttribute('aria-label',s.scale>1.01?'사진 원래 크기로':'사진 확대');}
  function draw(){if(!frame)frame=requestAnimationFrame(paint);}
  function fitPhoto(){
    if(!$('#viewer').open||!viewerImage.naturalWidth)return;stageRect=stage.getBoundingClientRect();
    photoView.resize(stageRect.width,stageRect.height,viewerImage.naturalWidth,viewerImage.naturalHeight);viewerImage.style.visibility='visible';draw();
  }
  function clearGesture(){stopMotion();pointers.clear();pinchGesture=null;panGesture=null;hadMultiple=false;moved=false;lastTap=null;stage.classList.remove('is-panning');}
  function resetPhoto(){clearGesture();photoView.reset();viewerImage.style.visibility='hidden';draw();}
  function position(e){return{x:e.clientX-stageRect.left-stageRect.width/2,y:e.clientY-stageRect.top-stageRect.height/2};}
  function rebase(){
    const ps=[...pointers.values()];
    if(ps.length>=2){pinchGesture=photoView.beginPinch(ps[0],ps[1]);panGesture=null;hadMultiple=true;moved=true;lastTap=null;}
    else if(ps.length===1){const s=photoView.snapshot(),p=ps[0];pinchGesture=null;panGesture={x:p.x,y:p.y,state:s,lastX:s.x,lastY:s.y,lastTime:performance.now(),vx:0,vy:0};}
    else{pinchGesture=null;panGesture=null;}
  }
  function zoomTo(target,point={x:0,y:0}){
    stopMotion();const start=photoView.snapshot(),endScale=Math.max(1,Math.min(6,target));
    if(reducedMotion()){photoView.zoomAt(endScale,point);draw();return;}
    const t0=performance.now(),anchorX=(point.x-start.x)/start.scale,anchorY=(point.y-start.y)/start.scale;
    function tick(now){const t=Math.min(1,(now-t0)/180),ease=1-(1-t)**3,s=start.scale+(endScale-start.scale)*ease;photoView.set(s,point.x-anchorX*s,point.y-anchorY*s);draw();if(t<1)motion=requestAnimationFrame(tick);else motion=0;}
    motion=requestAnimationFrame(tick);
  }
  function coast(vx,vy){
    if(reducedMotion()||Math.hypot(vx,vy)<.03)return;let last=performance.now(),elapsed=0;
    function tick(now){const dt=Math.min(32,now-last);last=now;elapsed+=dt;const before=photoView.snapshot(),after=photoView.moveBy(vx*dt,vy*dt);if(Math.abs(after.x-before.x)<.001)vx=0;if(Math.abs(after.y-before.y)<.001)vy=0;const decay=Math.exp(-dt/180);vx*=decay;vy*=decay;draw();if(Math.hypot(vx,vy)>.015&&elapsed<650)motion=requestAnimationFrame(tick);else motion=0;}
    motion=requestAnimationFrame(tick);
  }
  stage.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;stopMotion();stageRect=stage.getBoundingClientRect();
    if(pointers.size===0){hadMultiple=false;moved=false;}pointers.set(e.pointerId,position(e));stage.setPointerCapture(e.pointerId);stage.classList.add('is-panning');rebase();e.preventDefault();
  });
  stage.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;const point=position(e);pointers.set(e.pointerId,point);
    if(pointers.size>=2&&pinchGesture){const ps=[...pointers.values()];photoView.pinch(pinchGesture,ps[0],ps[1]);draw();}
    else if(panGesture){
      const dx=point.x-panGesture.x,dy=point.y-panGesture.y;if(Math.hypot(dx,dy)>6)moved=true;
      if(photoView.snapshot().scale>1.001){const after=photoView.set(panGesture.state.scale,panGesture.state.x+dx,panGesture.state.y+dy),now=performance.now(),dt=Math.max(1,now-panGesture.lastTime);panGesture.vx=.5*panGesture.vx+.5*(after.x-panGesture.lastX)/dt;panGesture.vy=.5*panGesture.vy+.5*(after.y-panGesture.lastY)/dt;panGesture.lastX=after.x;panGesture.lastY=after.y;panGesture.lastTime=now;draw();}
    }e.preventDefault();
  });
  function endPointer(e,cancelled=false){
    if(!pointers.has(e.pointerId))return;const p=position(e),pan=panGesture,multi=hadMultiple;
    pointers.delete(e.pointerId);if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);
    if(pointers.size){rebase();return;}stage.classList.remove('is-panning');pinchGesture=null;panGesture=null;
    if(cancelled)return;
    if(!multi&&pan&&photoView.snapshot().scale<=1.001){const dx=p.x-pan.x,dy=p.y-pan.y;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.3){lastTap=null;next(dx>0?-1:1);return;}}
    if(!multi&&moved&&pan&&photoView.snapshot().scale>1.001){if(performance.now()-pan.lastTime<90)coast(pan.vx,pan.vy);lastTap=null;}
    if(!multi&&!moved){const now=performance.now();if(e.pointerType==='mouse'){zoomTo(photoView.snapshot().scale>1.01?1:2.5,p);}else if(lastTap&&now-lastTap.time<300&&Math.hypot(p.x-lastTap.x,p.y-lastTap.y)<30){zoomTo(photoView.snapshot().scale>1.01?1:2.5,p);lastTap=null;}else lastTap={...p,time:now};}
    hadMultiple=false;
  }
  stage.addEventListener('pointerup',e=>endPointer(e));stage.addEventListener('pointercancel',e=>endPointer(e,true));
  stage.addEventListener('lostpointercapture',e=>{if(pointers.has(e.pointerId))endPointer(e,true)});
  stage.addEventListener('wheel',e=>{e.preventDefault();stopMotion();stageRect=stage.getBoundingClientRect();const unit=e.deltaMode===1?16:e.deltaMode===2?stageRect.height:1;if(e.ctrlKey||e.metaKey){photoView.zoomAt(photoView.snapshot().scale*Math.exp(-e.deltaY*unit*.01),position(e));}else if(photoView.snapshot().scale>1.001){photoView.moveBy(-e.deltaX*unit,-e.deltaY*unit);}draw();},{passive:false});
  viewerImage.addEventListener('load',fitPhoto);viewerImage.draggable=false;
  new ResizeObserver(()=>{if($('#viewer').open){clearGesture();fitPhoto();}}).observe(stage);
  function showPhoto(){const p=shownPhotos[viewerIndex];if(!p)return;resetPhoto();viewerImage.src=url(p.src);viewerImage.alt=p.caption||p.filename||'앨범 사진';$('#viewer-caption').textContent=p.caption||'';$('#viewer-album').textContent=p.albumTitle;$('#viewer-count').textContent='['+String(viewerIndex+1).padStart(3,'0')+' / '+String(shownPhotos.length).padStart(3,'0')+']';$('#viewer-download').href=url(p.original||p.src);$('#viewer-download').download=p.original?p.filename||p.id+'.jpg':p.id+'.jpg';$('#viewer-prev').hidden=shownPhotos.length<2;$('#viewer-next').hidden=shownPhotos.length<2;if(viewerImage.complete)fitPhoto();}
  function openViewer(i,trigger){returnViewerFocus=true;lastFocus=trigger;viewerIndex=i;showPhoto();$('#viewer').showModal();lock();fitPhoto();}
  function restorePhotoFocus(){
    if(!returnViewerFocus||$('#viewer').open||!lastFocus?.isConnected)return;
    if(keyboardNavigation)lastFocus.focus({preventScroll:true});else lastFocus.blur();
  }
  function closeViewer(restore=true){returnViewerFocus=restore;clearGesture();$('#viewer').close();unlock();restorePhotoFocus();viewerImage.removeAttribute('src');}
  $('#viewer').addEventListener('close',restorePhotoFocus);
  function next(delta){viewerIndex=(viewerIndex+delta+shownPhotos.length)%shownPhotos.length;showPhoto();}
  $('#viewer-close').onclick=()=>closeViewer();$('#viewer').addEventListener('cancel',()=>{clearGesture();unlock();viewerImage.removeAttribute('src');});$('#viewer-prev').onclick=()=>next(-1);$('#viewer-next').onclick=()=>next(1);
  $('#viewer-zoom').onclick=()=>zoomTo(photoView.snapshot().scale>1.01?1:2.5);
  $('#viewer').addEventListener('keydown',e=>{
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
      if(photoView.snapshot().scale>1.01){e.preventDefault();stopMotion();photoView.moveBy(e.key==='ArrowLeft'?80:e.key==='ArrowRight'?-80:0,e.key==='ArrowUp'?80:e.key==='ArrowDown'?-80:0);draw();}
      else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();next(e.key==='ArrowLeft'?-1:1);}
    }else if(e.key==='+'||e.key==='='){e.preventDefault();zoomTo(photoView.snapshot().scale*1.25);}else if(e.key==='-'){e.preventDefault();zoomTo(photoView.snapshot().scale/1.25);}else if(e.key==='0'){e.preventDefault();zoomTo(1);}
  });
  window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0)});window.addEventListener('pagehide',()=>objectURLs.forEach(u=>URL.revokeObjectURL(u)));render();
})();
