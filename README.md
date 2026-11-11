# OUR DAYS — 우리 사진 아카이브

흰색 바탕, 검정·회색의 모노톤과 모노스페이스 타이포그래피, 가는 구분선과 세 장씩 붙는 사진 목록으로 만든 GitHub Pages용 앨범입니다. 외부 데이터베이스와 유료 저장 API 없이 HTML/CSS/JavaScript와 사진 파일로 동작합니다.

## 1. 처음 게시하기

1. GitHub에서 `our-days`라는 새 공개 저장소를 만드세요. 저장소 이름을 바꿔도 동작합니다.
2. ZIP을 풀고 이 폴더 안의 파일들을 저장소 루트에 올리세요. `index.html`이 최상위에 있어야 합니다. `our-days` 폴더 자체를 한 단계 더 넣지 마세요.
3. 사진은 아직 없고 앨범 네 개가 준비되어 있습니다.
4. 간단한 방법: 저장소 **Settings → Pages → Build and deployment → Source → Deploy from a branch → main / (root)** 를 선택해 저장하세요. 별도 빌드 도구가 필요 없습니다.
5. 선택 사항: GitHub Actions로 게시하려면 `assets/pages-workflow.txt`를 `.github/workflows/pages.yml`로 복사하고 **Source → GitHub Actions**를 선택하세요. 두 방법 중 하나만 사용하세요.
6. GitHub가 보여주는 `https://계정이름.github.io/our-days/` 주소에서 확인하세요.
7. https://woovicky.github.io/Wedding-photos-of-Yesol-and-Taeho/edit.html

## 2. 사진 추가와 수정

게시된 사이트 주소 뒤에 `/edit.html`을 붙여 편집 화면을 여세요.

- **사진 추가**: JPG, PNG, WebP 여러 장을 선택합니다. 긴 변 최대 2,200px의 JPG와 미리보기로 변환해 파일 크기를 줄입니다. 사진 한 장의 입력 한도는 40MB입니다. HEIC는 미리 JPG로 변환하세요.
- **앨범**: 제목, 한글 이름, 설명, 순서를 바꾸거나 새 앨범을 추가할 수 있습니다.
- **사진**: 설명, 앨범, 순서, 표지에서 보이는 위치를 바꿀 수 있습니다. 각 앨범의 첫 세 장이 첫 화면 표지입니다.
- **미리보기**: 편집 화면 상단의 PREVIEW는 현재 브라우저의 편집본을 보여줍니다.
- **게시**: 내보내기에서 전체 앨범 ZIP을 내려받고, 압축을 풀어 기존 저장소의 같은 위치에 파일을 반영하세요. 저장소 변경이 게시되어야 가족이 보는 앨범도 바뀝니다.
- **복원**: SITE SETTINGS에서 이 편집 화면이 내보낸 ZIP을 가져올 수 있습니다.

### 저장 위치와 원본

**편집 중**: 사진과 편집 데이터는 현재 브라우저의 IndexedDB에만 저장됩니다. 다른 브라우저·기기에는 자동 동기화되지 않습니다. 비공개 브라우징에서는 저장이 제한되거나 사라질 수 있습니다. 기기 변경이나 브라우저 데이터 삭제 전 ZIP을 보관하세요.

**게시 후**: 공개된 감상용 JPG, 미리보기, 앨범 목록은 GitHub 저장소와 Pages에 파일로 저장됩니다. 이 사이트는 원본을 보관하지 않습니다. 촬영 원본은 본인의 컴퓨터나 별도 저장소에 보관하세요. ZIP은 감상용 파일과 사이트의 사본입니다.

### 사진 삭제

편집본에서 삭제하고 ZIP을 기존 저장소에 덮어쓰기만 하면, 예전 사진 파일이 GitHub에 남을 수 있습니다. 게시된 사진도 없애려면 저장소에서 해당 `photos/` 파일을 직접 삭제하세요. 이름은 `data/album.js`에서 확인할 수 있습니다. Git 기록에는 이전 파일이 남을 수 있으므로 민감한 사진을 게시하지 마세요.

### 공개 범위

일반적인 GitHub Pages는 공개 웹사이트입니다. 가족에게만 주소를 전달해도 가족만 접근하도록 제한되지는 않습니다. 검색 차단 표시는 설정되어 있지만 접근 제한이 아닙니다. 공개되는 사진은 다운로드될 수 있습니다.

`edit.html`은 누구나 열 수 있지만 방문자 자신의 로컬 편집본만 수정할 수 있습니다. GitHub 저장소를 수정할 권한이나 토큰을 제공하지 않습니다. 공개 저장소에 접근 토큰이나 비밀번호를 넣지 마세요.

### 용량과 운영

GitHub Pages 사이트 최대 크기는 1GB입니다. 편집 화면은 사진 파일 합계 약 930MB에서 추가를 막아 다른 파일을 위한 여유를 둡니다. 계정·서비스 정책은 GitHub 공식 안내를 확인하세요.

- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

사진 파일이 많으면 GitHub 웹 업로드보다 GitHub Desktop을 통해 폴더를 동기화하는 편이 편리합니다. 파일 삭제·추가를 포함해 전체 폴더를 반영하세요. 별도 사진 서비스의 자동 업로드와 다르게 게시 단계가 필요합니다.

## 로컬에서 미리보기

터미널에서 이 폴더로 이동해 `python3 -m http.server 8765`를 실행한 후 `http://127.0.0.1:8765/`를 여세요. 편집 화면은 `http://127.0.0.1:8765/edit.html`입니다. 파일을 더블클릭하는 `file://` 방식에서는 ZIP 내보내기가 제한될 수 있어 웹 주소로 열어야 합니다.

## 파일 구조

- `index.html`: 감상 화면
- `edit.html`: 로컬 편집 화면
- `data/album.js`: 게시된 앨범·사진 목록
- `photos/`: 감상용 사진과 미리보기
- `assets/`: 디자인과 동작
- `assets/pages-workflow.txt`: 선택적 GitHub Actions 설정 예시

이 버전에는 실제 결혼사진이나 다른 사람의 샘플 사진이 포함되어 있지 않습니다.
