/* Shared archive format. No credentials, remote storage or third-party uploads. */
window.Archive = (() => {
  const clone = value => JSON.parse(JSON.stringify(value));
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const pathOK = path => typeof path === 'string' && /^photos\/[a-zA-Z0-9_.-]+$/.test(path);
  function validate(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.albums) || typeof data.title !== 'string' || data.title.length > 80 || data.albums.length > 100) throw Error('올바른 앨범 파일이 아니에요.');
    const ids = new Set(); const photoIds = new Set();
    for (const a of data.albums) {
      if (!a.id || ids.has(a.id) || typeof a.title !== 'string' || !Array.isArray(a.photos)) throw Error('앨범 정보가 올바르지 않아요.');
      ids.add(a.id);
      for (const p of a.photos) {
        if (!p.id || photoIds.has(p.id) || !pathOK(p.src) || (p.thumb && !pathOK(p.thumb)) || (p.original && !pathOK(p.original))) throw Error('사진 파일 정보가 올바르지 않아요.');
        photoIds.add(p.id);
      }
    }
    return data;
  }
  function openDB() { return new Promise((resolve, reject) => {const req = indexedDB.open('our-days-local-editor-v1', 1);req.onupgradeneeded = () => {req.result.createObjectStore('state');req.result.createObjectStore('files')};req.onsuccess = () => resolve(req.result);req.onerror = () => reject(Error('브라우저의 로컬 저장 공간을 사용할 수 없어요. 비공개 모드를 해제해주세요.'))}); }
  async function get(store, key) {const db = await openDB();return new Promise((resolve,reject) => {const tx=db.transaction(store,'readonly');const r=tx.objectStore(store).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close()});}
  async function put(store,key,value) {const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value,key);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(Error('기기의 저장 공간이 부족해요. 내보내기로 사본을 보관해주세요.'))}});}
  async function remove(store,key) {const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).delete(key);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)});}
  const allPhotos = data => data.albums.flatMap(a => a.photos.map(p => ({...p, albumId:a.id, albumTitle:a.title})));
  const filePaths = data => [...new Set(allPhotos(data).flatMap(p=>[p.src,p.thumb,p.original].filter(Boolean)))];
  const download = (blob,name) => {const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),30000)};
  return {clone,escape,pathOK,validate,get,put,remove,allPhotos,filePaths,download};
})();
