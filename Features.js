/* ================================================================= */
/*  Features.js — 갤러리 / 상점 / 캘린더 / 미니게임 / 증권거래소 기능 모음 */
/*                                                                   */
/*  이 파일 하나에 담겨있는 기능들:                                     */
/*   1. 갤러리  — 그림·글 게시판 (올리기, 답글, 삭제)                   */
/*   2. 상점    — 아이템 구매 (탭·페이지 나누기 포함)                   */
/*   3. 캘린더  — 일정 추가·삭제, 정기 세션 자동 표시                   */
/*   4. 미니게임 탭 전환 — 동전·야바위·사냥·낚시 연결                   */
/*   5. 동전 던지기 미니게임                                           */
/*   6. 야바위 (쉘게임) 미니게임                                       */
/*   7. 사냥터 미니게임                                                */
/*   8. 낚시 미니게임                                                  */
/*   9. 증권 거래소 (주가 시뮬레이션 + DB 동기화 + 매수·매도)            */
/*                                                                   */
/*  ★ 자주 수정하는 항목만 따로 표시해뒀습니다.                          */
/*    화면에서 Ctrl+F 로 "★" 를 검색하면 바로 찾을 수 있습니다.          */
/*                                                                   */
/*  ⚠️  이 파일은 Auth.js, Config.js, Character.js 다음에 로드해야     */
/*     합니다. index.html 의 <script> 순서를 바꾸지 마세요.             */
/* ================================================================= */


/* ================================================================= */
/*  1. 갤러리 (화첩·기록 보관소)                                       */
/*                                                                   */
/*  데이터베이스(gallery_posts 테이블)에서 글과 사진을 불러와            */
/*  화면에 표시합니다. 게시글에 답글을 달거나 삭제할 수 있습니다.          */
/* ================================================================= */

/*
현재 보고 있는 부(페이즈 0~3)의 게시글을 페이지 단위로 불러오는 함수입니다.

page : 보여줄 페이지 번호 (1부터 시작)

★ 게시글이 보이지 않는다면:
  - 로그인이 안 되어있거나
  - Supabase gallery_posts 테이블에 row-level security가 걸려있을 수 있습니다.
  - Supabase 대시보드 → Authentication → Policies 에서 SELECT 정책을 확인하세요.
*/
async function loadGalleryData(page) {
    page = page || 1;
    currentGalleryPage = page;

    var container = document.getElementById('gallery-list-container');
    if (!container) return;

    /* 현재 부(currentEditingPhase)의 게시글만 오래된 순서로 가져옵니다 */
    var res = await supabaseClient
        .from('gallery_posts')
        .select('*')
        .eq('phase', currentEditingPhase)
        .order('created_at', { ascending: true });

    var data  = res.data;
    var error = res.error;

    if (error || !data || data.length === 0) {
        container.innerHTML = error
            ? '<p style="color:#f66;text-align:center;">오류가 발생했습니다. F12 콘솔을 확인해주세요.</p>'
            : "<p style='text-align:center;color:#555;'>첫 번째 기록을 남겨보세요.</p>";
        return;
    }

    /* 본문 게시글과 답글 분리 */
    var mainPosts  = data.filter(function (p) { return !p.parent_id; });
    var replies    = data.filter(function (p) { return  p.parent_id; });

    /* 페이지네이션 계산 */
    var totalPages = Math.ceil(mainPosts.length / GALLERY_POSTS_PER_PAGE);
    var startIndex = (currentGalleryPage - 1) * GALLERY_POSTS_PER_PAGE;
    var currPosts  = mainPosts.slice(startIndex, startIndex + GALLERY_POSTS_PER_PAGE);

    var myCharId = currentUser ? charOwners[currentUser.email] : null;

    var html = '';
    currPosts.forEach(function (post) {
        var isMine    = (myCharId === post.char_id);
        /* 본인 게시글에만 삭제 버튼이 보입니다 */
        var deleteBtn = isMine
            ? '<button class="btn-reply" onclick="deleteGalleryPost(' + post.id + ')">삭제</button>'
            : '';

        /* 이 게시글에 달린 답글 목록 */
        var postReplies = replies.filter(function (r) { return r.parent_id == post.id; });
        var replyCount  = postReplies.length;
        var toggleBtn   = replyCount > 0
            ? '<button class="btn-toggle-replies" onclick="toggleReplies(' + post.id + ')">답글 ' + replyCount + '개 보기</button>'
            : '';

        /* 답글 HTML 생성 */
        var repliesHtml = postReplies.map(function (r) {
            var isReplyMine    = (myCharId === r.char_id);
            var replyDeleteBtn = isReplyMine
                ? '<button class="btn-reply" style="padding:4px 10px;font-size:0.75rem;margin-top:0;" onclick="deleteGalleryPost(' + r.id + ')">삭제</button>'
                : '';
            return '<div class="reply-item">' +
                (r.image_url ? '<img src="' + r.image_url + '" class="reply-img" onclick="openLightbox(this.src)">' : '') +
                '<div class="post-info">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                        '<div class="post-author" style="font-size:0.9rem;margin-bottom:0;">' + r.char_name + '</div>' +
                        replyDeleteBtn +
                    '</div>' +
                    '<div class="post-content" style="font-size:0.9rem;margin-top:5px;">' + (r.content || '') + '</div>' +
                '</div></div>';
        }).join('');

        html +=
            '<div class="gallery-post-container">' +
                '<div class="post-main">' +
                    (post.image_url ? '<img src="' + post.image_url + '" class="post-img" onclick="openLightbox(this.src)">' : '') +
                    '<div class="post-info">' +
                        '<div class="post-author">' + post.char_name + '</div>' +
                        '<div class="post-date">' + new Date(post.created_at).toLocaleString('ko-KR') + '</div>' +
                        '<div class="post-content">' + (post.content || '') + '</div>' +
                        '<div style="display:flex;gap:10px;margin-top:10px;align-items:center;">' +
                            '<button class="btn-reply" onclick="showReplyForm(' + post.id + ')">답글 달기</button>' +
                            deleteBtn +
                        '</div>' +
                        toggleBtn +
                    '</div>' +
                '</div>' +
                /* 답글 영역: 처음엔 숨겨져 있고 '보기' 버튼을 누르면 펼쳐집니다 */
                '<div class="post-replies" id="replies-' + post.id + '" style="display:none;">' + repliesHtml + '</div>' +
            '</div>';
    });

    /* 페이지 2개 이상이면 페이지 번호 버튼을 만들어 아래에 붙입니다 */
    if (totalPages > 1) {
        html += '<div class="gallery-pagination">';
        for (var i = 1; i <= totalPages; i++) {
            html += '<button class="page-btn ' + (i === currentGalleryPage ? 'active' : '') + '" onclick="loadGalleryData(' + i + ')">' + i + '</button>';
        }
        html += '</div>';
    }

    container.innerHTML = html;
}

/* 답글 목록을 펼치거나 접는 함수입니다 */
window.toggleReplies = function (postId) {
    var repliesDiv = document.getElementById('replies-' + postId);
    var btn        = document.querySelector('button[onclick="toggleReplies(' + postId + ')"]');
    if (!repliesDiv || !btn) return;

    var isHidden           = (repliesDiv.style.display === 'none');
    repliesDiv.style.display = isHidden ? 'flex' : 'none';
    /* 버튼 텍스트를 '보기' <-> '닫기' 로 교체합니다 */
    btn.innerText = btn.innerText.replace(isHidden ? '보기' : '닫기', isHidden ? '닫기' : '보기');
};

/* 답글 작성 모달을 열고 입력 필드를 초기화합니다 */
window.showReplyForm = function (parentId) {
    document.getElementById('reply-parent-id').value     = parentId;
    document.getElementById('reply-modal-content').value = '';
    document.getElementById('reply-modal-file').value    = '';
    document.getElementById('reply-modal').classList.add('show');
};

/*
새 게시글을 업로드하는 함수입니다.
이미지가 있으면 먼저 imgbb에 업로드한 뒤 DB에 저장합니다.
*/
window.uploadGalleryPost = async function () {
    if (!currentUser) return alert('로그인이 필요합니다.');
    var myCharId = charOwners[currentUser.email];
    if (!myCharId) return alert('이 계정과 연결된 캐릭터가 없습니다.');

    var content   = document.getElementById('gal-content').value;
    var fileInput = document.getElementById('gal-file');
    if (!content && fileInput.files.length === 0) return alert('내용이나 이미지를 입력해주세요.');

    var uploadedUrl = null;
    if (fileInput.files.length > 0) {
        var btn     = event.target;
        btn.innerText = '전송 중...';
        btn.disabled  = true;
        uploadedUrl   = await uploadToImgbb(fileInput.files[0]);
        if (!uploadedUrl) {
            alert('이미지 서버 전송 실패. 잠시 후 다시 시도해주세요.');
            btn.innerText = '기록';
            btn.disabled  = false;
            return;
        }
    }

    /* charData 에서 캐릭터 이름을 찾아서 함께 저장합니다 */
    var charName = (charData.find(function (c) {
        return c.id === myCharId.replace('char-', '');
    }) || {}).name || '익명';

    var res = await supabaseClient.from('gallery_posts').insert([{
        char_id:   myCharId,
        char_name: charName,
        content:   content,
        image_url: uploadedUrl,
        parent_id: null,
        phase:     currentEditingPhase,
    }]);

    if (res.error) {
        alert('저장 실패: ' + res.error.message);
    } else {
        /* 입력 필드 초기화 */
        document.getElementById('gal-content').value = '';
        document.getElementById('gal-file').value    = '';
        if (fileInput.files.length > 0) {
            event.target.innerText = '기록';
            event.target.disabled  = false;
        }
        loadGalleryData(currentGalleryPage);
    }
};

/* 답글을 저장하는 함수입니다 (uploadGalleryPost와 동일한 방식) */
window.submitReply = async function () {
    var parentId = document.getElementById('reply-parent-id').value;
    if (!currentUser) return alert('로그인이 필요합니다.');
    var myCharId = charOwners[currentUser.email];
    if (!myCharId) return alert('이 계정과 연결된 캐릭터가 없습니다.');

    var content   = document.getElementById('reply-modal-content').value;
    var fileInput = document.getElementById('reply-modal-file');
    if (!content && fileInput.files.length === 0) return alert('내용이나 이미지를 입력해주세요.');

    var uploadedUrl = null;
    if (fileInput.files.length > 0) {
        var btn     = event.target;
        btn.innerText = '전송 중...';
        btn.disabled  = true;
        uploadedUrl   = await uploadToImgbb(fileInput.files[0]);
        if (!uploadedUrl) {
            alert('이미지 서버 전송 실패.');
            btn.innerText = '기록';
            btn.disabled  = false;
            return;
        }
    }

    var charName = (charData.find(function (c) {
        return c.id === myCharId.replace('char-', '');
    }) || {}).name || '익명';

    var res = await supabaseClient.from('gallery_posts').insert([{
        char_id:   myCharId,
        char_name: charName,
        content:   content,
        image_url: uploadedUrl,
        parent_id: parentId,
        phase:     currentEditingPhase,
    }]);

    if (res.error) {
        alert('저장 실패: ' + res.error.message);
    } else {
        if (fileInput.files.length > 0) {
            event.target.innerText = '기록';
            event.target.disabled  = false;
        }
        closeModal('reply-modal');
        loadGalleryData(currentGalleryPage);

        /* 답글을 새로 달았으면 해당 게시글의 답글 목록을 자동으로 펼쳐줍니다 */
        setTimeout(function () {
            var repliesDiv = document.getElementById('replies-' + parentId);
            var toggleBtn  = document.querySelector('button[onclick="toggleReplies(' + parentId + ')"]');
            if (repliesDiv && repliesDiv.style.display === 'none') {
                repliesDiv.style.display = 'flex';
                if (toggleBtn) toggleBtn.innerText = toggleBtn.innerText.replace('보기', '닫기');
            }
        }, 500);
    }
};

/* 게시글(본문 또는 답글) 삭제 함수 — 본인 글만 삭제 가능합니다 */
window.deleteGalleryPost = async function (postId) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    var res = await supabaseClient.from('gallery_posts').delete().eq('id', postId);
    if (res.error) alert('삭제 실패: ' + res.error.message);
    else           loadGalleryData(currentGalleryPage);
};


/* ================================================================= */
/*  2. 상점 (만물상)                                                  */
/*                                                                   */
/*  Config.js 의 shopItems 배열을 window.shopItems 로 덮어써서        */
/*  상점 탭에 표시합니다. 탭은 '일반 물품'과 '가구/인테리어'로 나뉩니다.  */
/* ================================================================= */

/*
상점 아이템 목록입니다.

★ 아이템 추가 방법:
  아래 배열 끝에 객체를 한 블록 추가하면 자동으로 상점에 표시됩니다.

★ 각 필드 설명:
  name   : 아이템 이름
  desc   : 아이템 설명
  price  : 가격 (단위: G)
  img    : 아이콘 이미지 URL (권장 크기: 100x100px)
  type   : 종류
           'item'      → 일반 소지품 (인벤토리 소지품 탭에 저장)
           'wallpaper' → 벽지 (마이룸 보관함에 저장)
           'floor'     → 바닥재 (마이룸 보관함에 저장)
           'furniture' → 가구 (마이룸 보관함에 저장)

  벽지 전용 추가 필드:
    colorL : 왼쪽 벽 색상 (HEX, 예: '#fcdada')
    colorR : 오른쪽 벽 색상
    bgImg  : 배경 이미지 URL (색상 대신 사진을 쓰고 싶을 때)

  바닥재 전용 추가 필드:
    color : 바닥 타일 색상 (HEX)

  가구 전용 추가 필드:
    width  : 가로 크기(px). 80 = 1칸, 160 = 2칸
    height : 세로 크기(px)

★ 아이템 삭제:
  해당 블록 전체를 지우면 됩니다.
  단, 구매한 사람의 인벤토리에는 그대로 남아있습니다.
*/
window.shopItems = [

    /* ── 일반 품목 탭에 표시되는 아이템들 ── */

    {
        name:  '현수막 변경권',
        desc:  '다른 사람이 바꾸기 전까지 유지됩니다.',
        price: 150,
        img:   'https://placehold.co/100x100/3a3a36/d7b33d?text=Item',  // ★ 실제 이미지 URL로 교체하세요
        type:  'item',
    },
    {
        name:  '가구 생성권',
        desc:  '나만의 커스텀 가구/벽지/바닥재를 직접 만들 수 있습니다.',
        price: 5000,
        img:   'https://placehold.co/100x100/d7b33d/000?text=DIY',
        type:  'item',
    },

    /* ── 가구/인테리어 탭에 표시되는 아이템들 ── */

    /* 벽지: colorL/colorR 로 양쪽 벽 색을 지정합니다 */
    {
        name:   '더미 벽지 A',
        desc:   '더미 벽지입니다. 실제 벽지 이미지와 이름으로 교체하세요.',
        price:  1500,
        img:    'https://placehold.co/100x100/fcdada/c88?text=Wall',
        type:   'wallpaper',
        colorL: '#fcdada',  // ★ 왼쪽 벽 색상 (HEX)
        colorR: '#f5bfbf',  // ★ 오른쪽 벽 색상 (HEX)
    },
    {
        name:   '더미 배경 벽지',
        desc:   '사진 배경 벽지입니다. bgImg에 실제 이미지 URL을 넣으세요.',
        price:  3500,
        img:    'https://placehold.co/100x100/000055/8af?text=BG',
        type:   'wallpaper',
        bgImg:  'https://placehold.co/800x400/000055/8af?text=Background',  // ★ 실제 배경 이미지 URL로 교체
    },

    /* 바닥재: color 로 바닥 타일 색을 지정합니다 */
    {
        name:  '더미 바닥재 A',
        desc:  '더미 바닥재입니다. color 값과 이름을 원하는 대로 바꾸세요.',
        price: 800,
        img:   'https://placehold.co/100x100/8b6914/fff?text=Floor',
        type:  'floor',
        color: '#a0784a',  // ★ 바닥 타일 색상 (HEX)
    },
    {
        name:  '더미 바닥재 B',
        desc:  '더미 바닥재입니다.',
        price: 1200,
        img:   'https://placehold.co/100x100/e8e8e8/888?text=Floor',
        type:  'floor',
        color: '#d8d0c8',
    },

    /* 가구: width/height 로 마이룸에서의 크기를 지정합니다 */
    {
        name:   '더미 책상',
        desc:   '더미 가구입니다. 이름·이미지·크기를 원하는 대로 바꾸세요.',
        price:  800,
        img:    'https://placehold.co/100x100/574c40/fff?text=Desk',
        type:   'furniture',
        width:  120,   // ★ 가로 크기(px). 80 = 방 1칸 너비
        height: 80,    // ★ 세로 크기(px)
    },

    /*
    ★ 아이템 추가 템플릿 (복사해서 붙여넣으세요):

    {
        name:  '아이템 이름',
        desc:  '아이템 설명',
        price: 1000,
        img:   'https://이미지URL',
        type:  'item',  // 'item' | 'wallpaper' | 'floor' | 'furniture'
    },
    */
];

/* 한 페이지에 표시할 아이템 수 */
var SHOP_ITEMS_PER_PAGE = 8;  // ★ 변경 가능: 숫자를 올리면 한 번에 더 많이 보입니다
var currentShopPage     = 1;
var currentShopTab      = 'general';  // 처음에 '일반 물품' 탭 표시

/* 일반 물품 탭 / 가구 탭 전환 */
window.changeShopTab = function (tab) {
    currentShopTab  = tab;
    currentShopPage = 1;
    /* 탭 버튼 활성화 상태 갱신 */
    var tabs = document.querySelectorAll('#shop-tabs .phase-btn');
    tabs.forEach(function (btn, i) {
        btn.classList.toggle('active', (tab === 'general') ? i === 0 : i === 1);
    });
    window.renderShop();
};

/* 페이지 번호 버튼 클릭 시 호출됩니다 */
window.changeShopPage = function (page) {
    currentShopPage = page;
    window.renderShop();
};

/* 수량 조절 버튼 (+/-) 처리 함수 */
window.shopQtyChange = function (idx, delta) {
    var el      = document.getElementById('shop-qty-'   + idx);
    var totalEl = document.getElementById('shop-total-' + idx);
    if (!el) return;
    /* 최소 1개, 최대 10개로 제한합니다 */
    var qty = Math.max(1, Math.min(parseInt(el.innerText) + delta, 10));
    el.innerText = qty;
    /* 총액 표시도 함께 갱신합니다 */
    if (totalEl) totalEl.innerText = (window.shopItems[idx].price * qty).toLocaleString() + ' G';
};

/* 상점 탭 우측에 표시되는 '내 소지금' 숫자를 DB에서 다시 읽어와 갱신합니다 */
window.updateShopMoneyDisplay = async function () {
    var display = document.getElementById('shop-my-money');
    if (!display) return;
    if (!currentUser)                    { display.innerText = '로그인 필요'; return; }
    var myCharId = charOwners[currentUser.email];
    if (!myCharId)                       { display.innerText = '권한 없음';  return; }
    var res = await supabaseClient
        .from('character_profiles')
        .select('money')
        .eq('char_id', myCharId)
        .eq('phase', 0)
        .single();
    display.innerText = ((res.data && res.data.money) ? parseInt(res.data.money) : 0).toLocaleString() + ' G';
};

/*
상점 아이템 카드를 HTML로 만들어 화면에 그리는 함수입니다.
탭 전환, 페이지 이동, 구매 완료 후 자동으로 호출됩니다.
*/
window.renderShop = function () {
    var container = document.getElementById('shop-items-container');
    if (!container) return;

    /* 현재 탭에 맞는 아이템만 필터링합니다
       - 'general' 탭 : item 타입만
       - 'furniture' 탭 : wallpaper / floor / furniture 타입만 */
    var filtered = window.shopItems
        .map(function (item, originalIndex) {
            return { item: item, originalIndex: originalIndex };
        })
        .filter(function (d) {
            var isFurn = (d.item.type === 'furniture' || d.item.type === 'wallpaper' || d.item.type === 'floor');
            if (currentShopTab === 'general'   &&  isFurn) return false;
            if (currentShopTab === 'furniture' && !isFurn) return false;
            return true;
        });

    /* 페이지 범위 계산 */
    var totalPages = Math.ceil(filtered.length / SHOP_ITEMS_PER_PAGE);
    if (currentShopPage > totalPages && totalPages > 0) currentShopPage = totalPages;
    var pageItems = filtered.slice(
        (currentShopPage - 1) * SHOP_ITEMS_PER_PAGE,
        currentShopPage * SHOP_ITEMS_PER_PAGE
    );

    /* 아이템 카드 HTML 생성 */
    container.innerHTML = pageItems.map(function (d) {
        var item = d.item;
        var idx  = d.originalIndex;  // 전체 배열에서의 원래 인덱스 (구매 시 사용)
        return '<div class="shop-item-card">' +
            '<img src="' + item.img + '" class="shop-item-img">' +
            '<div class="shop-item-title">' + item.name + '</div>' +
            '<div class="shop-item-desc">'  + item.desc  + '</div>' +
            '<div class="shop-item-price">' + item.price.toLocaleString() + ' G</div>' +
            /* 수량 조절 버튼 */
            '<div class="shop-qty-control">' +
                '<button class="shop-qty-btn" onclick="shopQtyChange(' + idx + ',-1)">-</button>' +
                '<span id="shop-qty-'   + idx + '" class="shop-qty-val">1</span>' +
                '<button class="shop-qty-btn" onclick="shopQtyChange(' + idx + ',1)">+</button>' +
            '</div>' +
            '<div class="shop-total-price" id="shop-total-' + idx + '" style="text-align:center;color:#ccc;font-size:0.85rem;margin-bottom:10px;">' +
                item.price.toLocaleString() + ' G' +
            '</div>' +
            '<button class="btn-buy" onclick="buyItem(' + idx + ', this)">구매하기</button>' +
            '</div>';
    }).join('');

    /* 페이지 번호 버튼 영역 — 2페이지 이상일 때만 표시됩니다 */
    var pageEl = document.getElementById('shop-pagination-container');
    if (!pageEl) {
        pageEl    = document.createElement('div');
        pageEl.id = 'shop-pagination-container';
        pageEl.style.cssText = 'display:flex;justify-content:center;gap:10px;margin-top:25px;width:100%;';
        container.parentNode.insertBefore(pageEl, container.nextSibling);
    }
    pageEl.innerHTML = totalPages > 1
        ? (function () {
            var s = '';
            for (var i = 1; i <= totalPages; i++) {
                s += '<button class="shop-page-btn ' + (i === currentShopPage ? 'active' : '') + '" onclick="changeShopPage(' + i + ')">' + i + '</button>';
            }
            return s;
        }())
        : '';
};

/*
아이템 구매 처리 함수입니다.

idx : window.shopItems 배열에서의 아이템 인덱스
btn : 클릭된 '구매하기' 버튼 요소 (로딩 중 비활성화에 사용)

구매 흐름:
  1. 소지금 확인 (DB에서 최신값으로 검증)
  2. 인벤토리 여유 공간 확인
  3. 소지금 차감 + 아이템 인벤토리에 추가
  4. 공간이 없으면 우편함으로 자동 발송
*/
window.buyItem = async function (idx, btn) {
    if (!currentUser) return alert('로그인이 필요합니다.');
    var myCharId = charOwners[currentUser.email];
    if (!myCharId) return alert('이 계정과 연결된 캐릭터가 없습니다.');

    var item = window.shopItems[idx];
    if (!item) return;

    var qtyEl        = document.getElementById('shop-qty-' + idx);
    var qty          = parseInt((qtyEl && qtyEl.innerText) || '1', 10);
    var totalCost    = item.price * qty;
    var originalText = btn.innerText;

    /* 1. 소지금 확인 — DB에서 최신값으로 검증 (클라이언트 값을 신뢰하지 않음) */
    var checkRes = await supabaseClient
        .from('character_profiles')
        .select('money')
        .eq('char_id', myCharId)
        .eq('phase', 0)
        .single();

    var checkMoney = (checkRes.data && checkRes.data.money)
        ? parseInt(String(checkRes.data.money).replace(/,/g, ''), 10)
        : 0;

    if (checkMoney < totalCost) {
        return alert(
            '소지금이 부족합니다!\n필요: ' + totalCost.toLocaleString() + ' G\n보유: ' + checkMoney.toLocaleString() + ' G'
        );
    }
    if (!confirm('[' + item.name + '] x ' + qty + '개\n총 ' + totalCost.toLocaleString() + ' G 결제하시겠습니까?')) return;

    btn.innerText = '결제 중...';
    btn.disabled  = true;

    try {
        /* 2. 최신 인벤토리·소지금·우편함 데이터를 한 번에 조회 */
        var fetchRes = await supabaseClient
            .from('character_profiles')
            .select('money, inventory, furniture_inventory, mailbox')
            .eq('char_id', myCharId)
            .eq('phase', 0)
            .single();
        if (fetchRes.error) throw fetchRes.error;
        var profile = fetchRes.data;

        var money = (profile && profile.money)
            ? parseInt(String(profile.money).replace(/,/g, ''), 10)
            : 0;

        /* 가구류(wallpaper/floor/furniture)는 furniture_inventory 컬럼에 저장합니다 */
        var isFurnitureType = (item.type === 'furniture' || item.type === 'wallpaper' || item.type === 'floor');
        var targetCol       = isFurnitureType ? 'furniture_inventory' : 'inventory';

        /* 인벤토리 파싱 (JSON 문자열이거나 배열일 수 있습니다) */
        var targetArr = [];
        var rawInv    = (profile && profile[targetCol]) || '';
        if (typeof rawInv === 'string' && rawInv.trim() !== '') {
            try { targetArr = JSON.parse(rawInv); } catch (e) { targetArr = []; }
        } else if (Array.isArray(rawInv)) {
            targetArr = rawInv.slice();
        }
        while (targetArr.length < 20) targetArr.push(null);  // 20칸 보장

        /* 우편함 파싱 */
        var mailArr = [];
        if (profile && profile.mailbox) {
            try {
                mailArr = typeof profile.mailbox === 'string'
                    ? JSON.parse(profile.mailbox)
                    : profile.mailbox;
            } catch (e) { mailArr = []; }
        }
        if (!Array.isArray(mailArr)) mailArr = [];

        money -= totalCost;  // 소지금 차감
        var inInv = 0, inMail = 0;

        /* 3. 같은 이름 아이템이 이미 인벤토리에 있으면 수량만 늘립니다 */
        var existing = null;
        for (var i = 0; i < targetArr.length; i++) {
            if (targetArr[i] && targetArr[i].name === item.name) {
                existing = targetArr[i];
                break;
            }
        }

        if (existing) {
            existing.count = (existing.count || 1) + qty;
            inInv += qty;
        } else {
            /* 빈 슬롯을 찾습니다 */
            var emptyIdx = -1;
            for (var j = 0; j < targetArr.length; j++) {
                if (targetArr[j] === null || targetArr[j] === '') { emptyIdx = j; break; }
            }

            /* 아이템 객체 생성 (타입별 추가 필드 포함) */
            var newObj = {
                name:  item.name,
                desc:  item.desc  || '',
                img:   item.img   || '',
                type:  item.type  || 'item',
                count: qty,
            };
            /* 벽지: 색상 또는 배경 이미지 필드 복사 */
            if (item.type === 'wallpaper') {
                if (item.colorL) newObj.colorL = item.colorL;
                if (item.colorR) newObj.colorR = item.colorR;
                if (item.bgImg)  newObj.bgImg  = item.bgImg;
            }
            /* 가구: 크기 필드 복사 */
            if (item.type === 'furniture') {
                if (item.width)  newObj.width  = item.width;
                if (item.height) newObj.height = item.height;
            }
            /* 바닥재: 색상 필드 복사 */
            if (item.type === 'floor' && item.color) newObj.color = item.color;

            if (emptyIdx !== -1) {
                /* 빈 슬롯이 있으면 인벤토리에 추가 */
                targetArr[emptyIdx] = newObj;
                inInv += qty;
            } else {
                /* 가방이 꽉 찼으면 우편함으로 자동 발송 */
                mailArr.push(newObj);
                inMail += qty;
            }
        }

        /* 4. DB에 한꺼번에 저장 */
        var updatePayload = { money: money };
        updatePayload[targetCol] = targetArr;
        if (inMail > 0) updatePayload.mailbox = mailArr;

        currentEditingId    = myCharId;
        currentEditingPhase = 0;
        var upsertRes = await upsertProfileData(updatePayload);
        if (upsertRes && upsertRes.error) throw upsertRes.error;

        /* 결과 알림 */
        var msg = '[' + item.name + '] x ' + qty + '개 구매 완료!\n잔액: ' + money.toLocaleString() + ' G';
        if (inMail > 0) msg += '\n(가방 공간 부족 - 우편함으로 발송됨)';
        alert(msg);

        /* 수량 표시 초기화 */
        if (qtyEl) qtyEl.innerText = '1';
        var totalEl = document.getElementById('shop-total-' + idx);
        if (totalEl) totalEl.innerText = item.price.toLocaleString() + ' G';

        /* 소지금 표시 및 캐릭터 데이터 갱신 */
        if (typeof window.updateShopMoneyDisplay === 'function') await window.updateShopMoneyDisplay();
        if (typeof loadCharacterData === 'function') await loadCharacterData();

    } catch (err) {
        console.error('구매 처리 오류:', err);
        alert('결제 중 오류가 발생했습니다. F12 콘솔을 확인해주세요.');
    } finally {
        btn.innerText = originalText;
        btn.disabled  = false;
    }
};


/* ================================================================= */
/*  3. 캘린더                                                         */
/*                                                                   */
/*  사이드바 하단의 달력을 그리고, 날짜 클릭으로 일정을 추가·삭제합니다.  */
/* ================================================================= */

/*
캘린더를 화면에 그리는 함수입니다.
페이지 로드 시 index.html 의 초기화 스크립트에서 호출합니다.

★ 정기 세션 자동 표시 설정:
  아래 코드에서 매주 일요일에 '정기 세션'을 자동 표시합니다.
  기준 날짜(new Date(2026, 4, 31))를 캠페인 시작일로 변경하거나,
  이 기능이 필요 없으면 해당 if 블록을 삭제하세요.

  날짜 형식: new Date(연도, 월-1, 일)
  예) 2026년 5월 31일 = new Date(2026, 4, 31)
      2027년 1월 1일  = new Date(2027, 0, 1)
*/
async function buildCalendar() {
    var el = document.getElementById('calendar');
    if (!el) return;

    var current = new Date();  // 현재 표시 중인 달

    async function render() {
        /* DB에서 이번 달의 저장된 일정 가져오기 */
        var res    = await supabaseClient.from('calendar_events').select('*');
        var events = {};
        if (res.data) {
            res.data.forEach(function (d) { events[d.event_date] = [d.title, d.description]; });
        }

        var y  = current.getFullYear();
        var m  = current.getMonth();
        var td = new Date();  // 오늘 날짜

        /* 이 달의 첫날 요일 (0=일, 6=토) 과 마지막 날 계산 */
        var firstDayOfWeek = new Date(y, m, 1).getDay();
        var lastDay        = new Date(y, m + 1, 0).getDate();

        var cells = '';

        /* 첫날 이전의 빈 칸 채우기 */
        for (var i = 0; i < firstDayOfWeek; i++) {
            cells += '<div class="cal-day empty"></div>';
        }

        for (var d = 1; d <= lastDay; d++) {
            /* yyyy-mm-dd 형식의 날짜 문자열 */
            var ds = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
            var ev = events[ds];

            /*
            ★ 정기 세션 자동 표시 조건:
              - 일요일(getDay() === 0)이고
              - 캠페인 시작일(2026년 5월 31일) 이후인 날짜에 자동으로 표시합니다.
              이 기능을 끄려면 아래 if 블록 전체를 삭제하세요.
            */
            if (
                !ev &&
                new Date(y, m, d).getDay() === 0 &&
                new Date(y, m, d) >= new Date(2026, 4, 31)  // ★ 캠페인 시작일 변경 가능
            ) {
                ev = ['정기 세션', '오후 7시'];  // ★ 자동 표시 텍스트 변경 가능
            }

            var isToday = (d === td.getDate() && m === td.getMonth() && y === td.getFullYear());

            cells +=
                '<div class="cal-day' +
                    (isToday ? ' today' : '') +
                    (ev ? ' has-event' : '') + '"' +
                    ' onclick="addEvent(\'' + ds + '\', ' + !!ev + ')">' +
                    d +
                    (ev ? '<div class="cal-tooltip"><strong>' + ev[0] + '</strong><br>' + ev[1] + '</div>' : '') +
                '</div>';
        }

        el.innerHTML =
            '<div class="cal-header">' +
                '<div>' + y + '</div>' +
                '<div class="cal-nav">' +
                    '<button onclick="prevMonth()">&lt;</button>' +
                    '<span>' + (m + 1) + '月</span>' +
                    '<button onclick="nextMonth()">&gt;</button>' +
                '</div>' +
            '</div>' +
            '<div class="cal-grid">' +
                ['일','월','화','수','목','금','토'].map(function (d) {
                    return '<div class="cal-dow">' + d + '</div>';
                }).join('') +
                cells +
            '</div>';
    }

    /* 이전/다음 달 이동 버튼 */
    window.prevMonth = function () {
        current = new Date(current.getFullYear(), current.getMonth() - 1, 1);
        render();
    };
    window.nextMonth = function () {
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        render();
    };

    /* 날짜 클릭 시 일정 추가 또는 삭제 */
    window.addEvent = async function (dateStr, hasEvent) {
        /* 이미 일정이 있는 날을 클릭하면 삭제 확인창으로 이동합니다 */
        if (hasEvent) { await window.deleteEvent(dateStr); return; }
        var title = prompt('일정 제목:');
        if (!title) return;
        var desc  = prompt('일정 내용:');
        var res   = await supabaseClient.from('calendar_events').insert([{
            event_date:  dateStr,
            title:       title,
            description: desc || ' ',
        }]);
        if (res.error) alert('저장 실패: ' + res.error.message);
        else           buildCalendar();
    };

    window.deleteEvent = async function (dateStr) {
        if (confirm('이 일정을 삭제하시겠습니까?')) {
            var res = await supabaseClient.from('calendar_events').delete().eq('event_date', dateStr);
            if (res.error) alert('삭제 실패: ' + res.error.message);
            else           buildCalendar();
        }
    };

    render();
}


/* ================================================================= */
/*  4. 미니게임 탭 전환                                               */
/*                                                                   */
/*  노름판 탭 안의 미니게임 슬라이드를 전환하고 소지금을 갱신합니다.       */
/* ================================================================= */

/*
미니게임 탭 버튼 클릭 시 호출됩니다.

btn : 클릭된 탭 버튼 요소
idx : 표시할 슬라이드 번호 (0=동전, 1=야바위, 2=사냥터, 3=낚시)

★ 낚시 탭을 추가했다면 idx=3 에 낚시 슬라이드가 있어야 합니다.
  index.html 의 미니게임 탭 버튼과 슬라이드 순서가 일치해야 합니다.
*/
window.changeMiniGame = function (btn, idx) {
    var sec = document.getElementById('MiniGames');

    /* 모든 탭 버튼과 슬라이드 비활성화 */
    sec.querySelectorAll('.phase-btn').forEach(function (t) { t.classList.remove('active'); });
    sec.querySelectorAll('.mg-slide').forEach(function (s) { s.classList.remove('active'); });

    /* 선택한 탭과 슬라이드 활성화 */
    btn.classList.add('active');
    sec.querySelectorAll('.mg-slide')[idx].classList.add('active');

    /* 야바위 탭으로 전환하면 컵 위치를 초기화합니다 */
    if (idx === 1) initShellPositions();

    /* 소지금 표시 갱신 — 전역 currentMoney 를 건드리지 않는 전용 함수 사용 */
    _refreshMiniGameMoneyDisplay();
};

/*
미니게임 화면의 소지금 표시만 갱신하는 내부 함수입니다.
전역 변수 currentMoney 를 덮어쓰지 않아서 게임 진행에 영향을 주지 않습니다.
*/
async function _refreshMiniGameMoneyDisplay() {
    if (!currentUser) return;
    var myCharId = charOwners[currentUser.email];
    if (!myCharId) return;

    var res = await supabaseClient
        .from('character_profiles')
        .select('money')
        .eq('char_id', myCharId)
        .eq('phase', 0)
        .single();

    var money = (res.data && res.data.money) ? parseInt(res.data.money) : 0;
    var el    = document.getElementById('minigame-my-money');
    if (el) el.innerText = money.toLocaleString() + ' G';
}

/* 외부에서 이전 이름으로 호출하는 코드와의 호환성을 위한 별칭 */
window.updateMiniGameMoneyDisplay = _refreshMiniGameMoneyDisplay;


/* ================================================================= */
/*  5. 동전 던지기                                                    */
/*                                                                   */
/*  판돈을 걸고 앞면/뒷면을 맞추면 2배를 받습니다.                      */
/* ================================================================= */

var isTossing = false;  // 애니메이션 중에 버튼이 중복 클릭되는 걸 막는 자물쇠

/*
동전 던지기 게임 실행 함수입니다.
guess : 'heads' (앞면) | 'tails' (뒷면)
*/
window.playCoinToss = async function (guess) {
    if (isTossing) return;  // 이미 던지는 중이면 무시

    var bet = parseInt(document.getElementById('cointoss-bet').value);
    if (isNaN(bet) || bet <= 0) return alert('판돈을 1 G 이상 걸어주세요!');
    if (bet > currentMoney)     return alert('소지금이 부족합니다!');
    if (!currentUser)           return alert('로그인이 필요합니다.');

    isTossing = true;

    var coin       = document.getElementById('coin-element');
    var resultText = document.getElementById('cointoss-result');
    var headsBtn   = document.getElementById('btn-guess-heads');
    var tailsBtn   = document.getElementById('btn-guess-tails');

    /* 버튼 비활성화 + 코인 회전 애니메이션 시작 */
    headsBtn.disabled = true;
    tailsBtn.disabled = true;
    resultText.innerText   = '동전이 돌아갑니다...!';
    resultText.style.color = '#fff';
    coin.innerText = '';
    coin.classList.remove('coin-flipping');
    void coin.offsetWidth;  // 리플로우 강제 발생 (애니메이션 재시작 트릭)
    coin.classList.add('coin-flipping');

    /* 1.5초 뒤 결과 판정 */
    setTimeout(async function () {
        try {
            /* 50:50 확률로 결과 결정 */
            var outcome  = Math.random() < 0.5 ? 'heads' : 'tails';
            coin.innerText = outcome === 'heads' ? '앞' : '뒤';
            coin.className = outcome === 'heads' ? 'coin' : 'coin silver';

            var newMoney = currentMoney;
            if (guess === outcome) {
                /* 적중: 판돈만큼 획득 */
                newMoney += bet;
                resultText.innerText   = '적중! ' + bet.toLocaleString() + ' G 획득!';
                resultText.style.color = '#4caf50';
            } else {
                /* 실패: 판돈만큼 차감 */
                newMoney -= bet;
                resultText.innerText   = '실패... ' + bet.toLocaleString() + ' G를 잃었습니다.';
                resultText.style.color = '#ff4d4d';
            }

            currentEditingId    = charOwners[currentUser.email];
            currentEditingPhase = 0;
            var res = await upsertProfileData({ money: newMoney });
            if (res && res.error) {
                alert('결과 저장 실패. 다시 시도해주세요.');
            } else {
                currentMoney = newMoney;
                await _refreshMiniGameMoneyDisplay();
                if (typeof loadCharacterData === 'function') await loadCharacterData();
            }
        } finally {
            /* 오류가 나도 반드시 버튼을 복원합니다 */
            isTossing         = false;
            headsBtn.disabled = false;
            tailsBtn.disabled = false;
            coin.classList.remove('coin-flipping');
        }
    }, 1500);
};


/* ================================================================= */
/*  6. 야바위 (쉘게임)                                               */
/*                                                                   */
/*  공이 들어있는 컵을 맞추면 3배를 받습니다.                           */
/*  컵 3개를 랜덤으로 섞은 뒤 플레이어가 하나를 선택합니다.              */
/* ================================================================= */

var shellState      = 'idle';   // 게임 진행 단계: idle | shuffling | waiting | resolving
var shellWinningCup = -1;       // 공이 들어있는 컵 번호 (0, 1, 2 중 하나)
var shellBetAmount  = 0;        // 건 판돈 (결과에 따라 환불 또는 3배 지급)
var cupPositions    = [0, 1, 2]; // 각 컵의 현재 위치 인덱스 (드래그 후 순서가 바뀜)
var CUP_X           = [0, 120, 240]; // 각 위치의 X 좌표(px)

/* 컵 위치를 화면 너비에 맞게 재계산합니다 (창 크기 변경 시에도 정렬 유지) */
function initShellPositions() {
    var board = document.getElementById('shell-board');
    if (!board) return;
    var cw   = board.clientWidth;
    var cupW = (document.getElementById('cup-wrap-0') || {}).clientWidth || 80;
    var gap  = (cw - cupW * 3) / 2;
    CUP_X        = [0, cupW + gap, (cupW + gap) * 2];
    cupPositions = [0, 1, 2];
    [0, 1, 2].forEach(function (i) {
        document.getElementById('cup-wrap-' + i).style.transform = 'translate(' + CUP_X[i] + 'px, 0px)';
    });
}
window.addEventListener('resize', initShellPositions);

/* 야바위 게임을 시작합니다 */
window.startShellGame = async function () {
    if (shellState !== 'idle') return;  // 이미 게임 중이면 무시

    var bet = parseInt(document.getElementById('shell-bet').value);
    if (isNaN(bet) || bet <= 0) return alert('판돈을 1 G 이상 걸어주세요!');
    if (bet > currentMoney)     return alert('소지금이 부족합니다!');
    if (!currentUser)           return alert('로그인이 필요합니다.');

    /* 판돈 선차감 (맞히면 3배 환급, 틀리면 그대로) */
    currentMoney  -= bet;
    shellBetAmount = bet;
    document.getElementById('minigame-my-money').innerText = currentMoney.toLocaleString() + ' G';
    shellState = 'shuffling';

    var resultText = document.getElementById('shell-result');
    var cups       = document.querySelectorAll('.shell-cup');
    var balls      = document.querySelectorAll('.shell-ball');
    var wrappers   = [0, 1, 2].map(function (i) { return document.getElementById('cup-wrap-' + i); });

    /* 초기화 */
    cups.forEach(function (c)  { c.classList.remove('revealed'); });
    balls.forEach(function (b) { b.classList.remove('winner'); });

    /* 공이 들어갈 컵을 랜덤 선택 후 잠깐 보여줍니다 */
    shellWinningCup = Math.floor(Math.random() * 3);
    document.getElementById('shell-ball-' + shellWinningCup).classList.add('winner');

    resultText.innerText   = '공을 넣습니다. 잘 보세요!';
    resultText.style.color = 'var(--accent-color)';
    document.getElementById('cup-' + shellWinningCup).classList.add('revealed');
    await new Promise(function (r) { setTimeout(r, 1200); });
    document.getElementById('cup-' + shellWinningCup).classList.remove('revealed');
    await new Promise(function (r) { setTimeout(r, 600); });

    resultText.innerText   = '섞습니다!';
    resultText.style.color = '#fff';

    /* 컵 섞기 애니메이션 (25회, 점점 빨라짐) */
    var shuffleCount = 25;
    var speed        = 350;

    for (var i = 0; i < shuffleCount; i++) {
        /* 진행할수록 속도가 빨라집니다 */
        if (i > 5)  speed = 200;
        if (i > 10) speed = 120;
        if (i > 15) speed = 70;

        wrappers.forEach(function (w) {
            w.style.transition = 'transform ' + speed + 'ms ease-in-out';
        });

        /* 랜덤으로 두 컵의 위치를 교환합니다 */
        var posA = Math.floor(Math.random() * 3);
        var posB = Math.floor(Math.random() * 3);
        while (posA === posB) posB = Math.floor(Math.random() * 3);

        var cupIdxA = cupPositions.indexOf(posA);
        var cupIdxB = cupPositions.indexOf(posB);
        cupPositions[cupIdxA] = posB;
        cupPositions[cupIdxB] = posA;

        /* 교차할 때 살짝 위로 들어올리는 효과 */
        wrappers[cupIdxA].style.zIndex    = 10;
        wrappers[cupIdxB].style.zIndex    = 5;
        wrappers[cupIdxA].style.transform = 'translate(' + CUP_X[posB] + 'px, -20px)';
        wrappers[cupIdxB].style.transform = 'translate(' + CUP_X[posA] + 'px, 20px)';
        await new Promise(function (r) { setTimeout(r, speed / 2); });
        wrappers[cupIdxA].style.transform = 'translate(' + CUP_X[posB] + 'px, 0px)';
        wrappers[cupIdxB].style.transform = 'translate(' + CUP_X[posA] + 'px, 0px)';
        await new Promise(function (r) { setTimeout(r, speed / 2 + 10); });
    }

    /* 최종 위치 정렬 */
    wrappers.forEach(function (w, idx) {
        w.style.transition = 'transform 300ms ease';
        w.style.transform  = 'translate(' + CUP_X[cupPositions[idx]] + 'px, 0px)';
        w.style.zIndex     = 1;
    });
    await new Promise(function (r) { setTimeout(r, 300); });

    resultText.innerText   = '공이 들어있는 컵을 선택하세요!';
    resultText.style.color = 'var(--accent-color)';
    shellState = 'waiting';  // 이제 플레이어가 선택할 차례
};

/* 플레이어가 컵을 선택했을 때 정답 여부를 판정합니다 */
window.guessShellCup = async function (selectedCupIdx) {
    if (shellState !== 'waiting') return;
    shellState = 'resolving';

    var myCharId   = charOwners[currentUser.email];
    var resultText = document.getElementById('shell-result');
    var cups       = document.querySelectorAll('.shell-cup');

    /* 모든 컵을 뒤집어서 정답 공개 */
    cups.forEach(function (c) { c.classList.add('revealed'); });

    var finalMoney;
    if (selectedCupIdx === shellWinningCup) {
        /* 정답: 3배 지급 */
        var winAmount = shellBetAmount * 3;
        currentMoney += winAmount;
        finalMoney    = currentMoney;
        resultText.innerText   = '정답! ' + winAmount.toLocaleString() + ' G 획득!';
        resultText.style.color = '#4caf50';
    } else {
        /* 오답: 선차감된 판돈 그대로 */
        finalMoney = currentMoney;
        resultText.innerText   = '꽝! 빈 컵입니다.';
        resultText.style.color = '#ff4d4d';
    }

    /* DB에 최종 소지금 저장 */
    currentEditingId    = myCharId;
    currentEditingPhase = 0;
    await upsertProfileData({ money: finalMoney });
    await _refreshMiniGameMoneyDisplay();
    if (typeof loadCharacterData === 'function') await loadCharacterData();

    /* 3초 후 게임 초기화 */
    setTimeout(function () {
        shellState             = 'idle';
        resultText.innerText   = '베팅하고 게임을 시작하세요!';
        resultText.style.color = 'var(--text-main)';
        cups.forEach(function (c) { c.classList.remove('revealed'); });
    }, 3000);
};


/* ================================================================= */
/*  7. 사냥터 미니게임                                                */
/*                                                                   */
/*  15초 동안 나타나는 사냥감을 클릭해 잡습니다.                        */
/*  사슴: 10G / 곰: 50G                                              */
/* ================================================================= */

var huntScore         = 0;   // 이번 판에 잡은 마릿수
var huntMoneyEarned   = 0;   // 이번 판에 번 돈
var huntTimer         = 0;   // 남은 시간(초)
var huntInterval      = null; // 타이머 인터벌 ID
var huntSpawnInterval = null; // 사냥감 생성 인터벌 ID

/* 사냥 게임 시작 */
window.startHuntingGame = function () {
    if (!currentUser) return alert('로그인이 필요합니다.');
    var myCharId = charOwners[currentUser.email];
    if (!myCharId) return alert('이 계정과 연결된 캐릭터가 없습니다.');

    /* 이전 인터벌이 남아있으면 반드시 먼저 정리합니다 (중복 방지) */
    if (huntInterval)      clearInterval(huntInterval);
    if (huntSpawnInterval) clearInterval(huntSpawnInterval);

    var btn  = document.getElementById('btn-start-hunt');
    var area = document.getElementById('hunt-area');

    btn.disabled  = true;
    btn.innerText = '사냥 진행 중...';
    area.innerHTML = '';
    void area.offsetWidth;  // 리플로우 강제 발생

    /* 상태 초기화 */
    huntScore       = 0;
    huntMoneyEarned = 0;
    huntTimer       = 15;  // ★ 게임 시간(초) 변경 가능
    document.getElementById('hunt-score').innerText = huntMoneyEarned;
    document.getElementById('hunt-timer').innerText = huntTimer;

    /* 1초마다 타이머 감소 */
    huntInterval = setInterval(function () {
        huntTimer--;
        document.getElementById('hunt-timer').innerText = huntTimer;
        if (huntTimer <= 0) endHuntingGame(myCharId);
    }, 1000);

    /* 0.2초 뒤 첫 사냥감 등장 후 0.7초마다 계속 등장 */
    setTimeout(function () {
        if (huntTimer > 0) spawnTarget(area);
        huntSpawnInterval = setInterval(function () { spawnTarget(area); }, 700); // ★ 등장 주기 변경 가능
    }, 200);
};

/*
사냥감 하나를 생성합니다.

★ 사슴/곰 등장 확률과 보상 변경:
  isBear = Math.random() < 0.2  →  20% 확률로 곰 등장 (숫자를 바꾸면 확률 변경)
  reward : 사슴 10G / 곰 50G  →  원하는 숫자로 변경하세요

★ 사냥감 이미지 변경:
  target.textContent 에 텍스트 대신 이미지 태그를 넣거나
  CSS 클래스로 배경 이미지를 지정할 수 있습니다.
*/
function spawnTarget(area) {
    if (huntTimer <= 0) return;

    var isBear = Math.random() < 0.2;   // ★ 0.2 = 곰 20% / 사슴 80%
    var size   = isBear ? 84 : 64;      // 곰이 더 크게 표시됩니다
    var reward = isBear ? 50 : 10;      // ★ 보상 금액 변경 가능
    var label  = isBear ? '[곰]' : '[사슴]'; // 이모지 제거 - 텍스트로 표시
    var lifeMs = isBear ? 1400 : 1100;  // 화면에 머무는 시간(ms). 곰이 조금 더 오래 있습니다

    /* 화면 크기에 맞는 랜덤 위치 계산 */
    var areaW = area.clientWidth;
    var areaH = area.clientHeight;
    if (areaW === 0 || areaH === 0) {
        var rect = area.getBoundingClientRect();
        areaW = rect.width  || 800;
        areaH = rect.height || 380;
    }

    var target    = document.createElement('div');
    target.className   = 'hunt-target ' + (isBear ? 'bear' : 'deer');
    target.textContent = label;
    target.style.left  = (10 + Math.floor(Math.random() * Math.max(10, areaW - size - 10))) + 'px';
    target.style.top   = (10 + Math.floor(Math.random() * Math.max(10, areaH - size - 10))) + 'px';

    /* 클릭하면 잡힙니다 */
    target.onclick = function () {
        if (target.classList.contains('hit')) return;  // 이미 잡힌 것 중복 클릭 방지
        target.classList.add('hit');
        target.textContent = '+' + reward + 'G';
        huntScore++;
        huntMoneyEarned += reward;
        document.getElementById('hunt-score').innerText = huntMoneyEarned;
        setTimeout(function () { if (area.contains(target)) target.remove(); }, 400);
    };

    area.appendChild(target);

    /* 시간이 지나도 잡지 않으면 자동으로 사라집니다 */
    setTimeout(function () {
        if (area.contains(target) && !target.classList.contains('hit')) target.remove();
    }, lifeMs);
}

/* 게임 종료 처리 및 보상 지급 */
async function endHuntingGame(myCharId) {
    clearInterval(huntInterval);
    clearInterval(huntSpawnInterval);
    huntInterval      = null;
    huntSpawnInterval = null;

    var area = document.getElementById('hunt-area');
    area.innerHTML =
        '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
        'color:var(--accent-color);font-size:1.5rem;font-weight:bold;' +
        'background:rgba(0,0,0,0.7);padding:10px 20px;border-radius:10px;">사냥 종료!</div>';

    var btn = document.getElementById('btn-start-hunt');
    alert('사냥 종료!\n총 ' + huntScore + '마리 사냥  ->  ' + huntMoneyEarned.toLocaleString() + ' G 획득');

    if (huntMoneyEarned > 0) {
        btn.innerText = '보상 획득 중...';
        currentEditingId    = myCharId;
        currentEditingPhase = 0;
        var res = await upsertProfileData({ money: currentMoney + huntMoneyEarned });
        if (!res || !res.error) {
            currentMoney += huntMoneyEarned;
            await _refreshMiniGameMoneyDisplay();
            if (typeof loadCharacterData === 'function') await loadCharacterData();
        }
    }

    btn.innerText = '사냥 다시 시작하기';
    btn.disabled  = false;
}


/* ================================================================= */
/*  8. 낚시 미니게임                                                  */
/*                                                                   */
/*  낚시터를 선택하고, 버튼을 꾹 눌러 초록색 포획 영역 안에             */
/*  물고기를 가두면 성공합니다. 진행 바가 100%가 되면 보상을 받습니다.    */
/*                                                                   */
/*  ★ 난이도·보상 조정:                                               */
/*    endFishingGame 함수 안의 minReward / maxReward 를 수정하세요.   */
/*    prepareFishing 함수 안의 currentFishSpeedBase 를 수정하세요.    */
/*                                                                   */
/*  ★ 낚시터 배경 이미지 변경:                                         */
/*    prepareFishing 함수 안의 backgroundImage URL을 교체하세요.      */
/* ================================================================= */

/* 낚시 게임 내부 상태 변수 — 직접 수정하지 마세요 */
var fishingActive        = false;  // 게임 진행 중 여부
var fishingFishY         = 120;   // 물고기의 현재 Y 위치(px)
var fishingFishSpeed     = 0;     // 물고기 이동 속도 (프레임당 픽셀)
var fishingPlayerY       = 0;     // 포획 영역의 현재 Y 위치(px)
var fishingPlayerVelocity = 0;    // 포획 영역 이동 속도
var fishingProgress      = 20;   // 진행 바 값 (0~100)
var isPressingFishingBtn = false; // 버튼을 누르고 있는지 여부
var fishingAnimationFrame;        // requestAnimationFrame 핸들

var WATER_HEIGHT    = 300;  // 낚시 영역 전체 높이(px)
var FISH_HEIGHT     = 35;   // 물고기 이미지 높이(px) — 고정값
var PLAYER_HEIGHT   = 100;  // 포획 영역 높이(px) — 난이도에 따라 변경됨

/* 현재 선택된 난이도 */
var currentDifficulty    = 'easy';
var currentFishSpeedBase = 10;  // 클수록 물고기가 빠르게 움직입니다

/* 버튼 누르기/떼기 이벤트 핸들러 (마우스 + 터치 기기 모두 지원) */
window.pressFishingBtn   = function (e) {
    if (fishingActive) { e.preventDefault(); isPressingFishingBtn = true; }
};
window.releaseFishingBtn = function (e) {
    if (fishingActive) { e.preventDefault(); isPressingFishingBtn = false; }
};

/*
낚시터 선택 후 게임을 초기화하는 함수입니다.
index.html 의 낚시터 선택 버튼에서 onclick="prepareFishing('easy')" 형태로 호출합니다.

difficulty : 'easy' (잔잔한 호수) | 'hard' (거친 바다)

★ 낚시터 배경 이미지 변경:
  아래 waterArea.style.backgroundImage 의 URL을 원하는 이미지로 교체하세요.
*/
window.prepareFishing = function (difficulty) {
    if (!currentUser) return alert('로그인이 필요합니다.');
    var myCharId = charOwners[currentUser.email];
    if (!myCharId) return alert('이 계정과 연결된 캐릭터가 없습니다.');

    currentDifficulty = difficulty;

    var waterArea = document.getElementById('fishing-water-area');
    var playerBar = document.getElementById('player-bar');

    if (difficulty === 'easy') {
        PLAYER_HEIGHT        = 100;  // 포획 영역이 넓어서 쉬움
        currentFishSpeedBase = 10;   // ★ 물고기 속도 (낮을수록 느림)
        /* ★ 잔잔한 호수 배경 이미지 URL */
        waterArea.style.backgroundImage = "url('https://images.unsplash.com/photo-1543165365-07232e8b2ed3?w=400')";
    } else {
        PLAYER_HEIGHT        = 60;   // 포획 영역이 좁아서 어려움
        currentFishSpeedBase = 22;   // ★ 물고기 속도 (높을수록 빠름)
        /* ★ 거친 바다 배경 이미지 URL */
        waterArea.style.backgroundImage = "url('https://images.unsplash.com/photo-1498654077810-12c21d4d6dc3?w=400')";
    }

    /* 포획 영역 높이를 난이도에 맞게 적용 */
    playerBar.style.height = PLAYER_HEIGHT + 'px';

    /* 낚시터 선택 메뉴 숨기고 게임 화면 표시 */
    document.getElementById('fishing-menu').style.display = 'none';
    document.getElementById('fishing-play').style.display = 'block';

    startFishingLogic(myCharId);
};

/* 게임 상태를 초기화하고 애니메이션 루프를 시작합니다 */
function startFishingLogic(myCharId) {
    var actionBtn   = document.getElementById('fishing-action-btn');
    var gameMessage = document.getElementById('fishing-message');

    /* 상태 초기화 */
    fishingProgress        = 20;
    fishingFishY           = 120;
    fishingPlayerY         = 0;
    fishingPlayerVelocity  = 0;
    isPressingFishingBtn   = false;
    fishingActive          = true;

    gameMessage.innerHTML  = '버튼을 꾹 눌러 물고기를<br>포획 영역(초록 박스) 안에 가두세요!';
    gameMessage.style.color = '#fff';
    actionBtn.innerText    = '누르기 (Hold)';
    actionBtn.disabled     = false;

    cancelAnimationFrame(fishingAnimationFrame);  // 이전 루프 취소
    updateFishingGame(myCharId);
}

/*
매 프레임마다 게임 상태를 갱신하는 메인 루프입니다.
requestAnimationFrame 으로 약 60fps 로 실행됩니다.

처리 순서:
  1. 물고기 이동 (5% 확률로 방향 전환)
  2. 포획 영역 물리 이동 (버튼 입력 + 감속)
  3. 충돌 판정 (물고기가 포획 영역 안에 있는지)
  4. 진행 바 증감
  5. 화면 갱신
  6. 승패 판정
*/
function updateFishingGame(myCharId) {
    if (!fishingActive) return;

    var fishZone    = document.getElementById('fish-zone');
    var playerBar   = document.getElementById('player-bar');
    var progressBar = document.getElementById('progress-bar');

    /* ── 1. 물고기 이동 ── */
    /* 5% 확률로 이동 방향과 속도가 바뀝니다 (불규칙 움직임) */
    if (Math.random() < 0.05) {
        fishingFishSpeed = (Math.random() - 0.5) * currentFishSpeedBase;
    }
    fishingFishY += fishingFishSpeed;
    /* 위아래 경계에서 튕깁니다 */
    if (fishingFishY < 0)                          { fishingFishY = 0;                          fishingFishSpeed *= -1; }
    if (fishingFishY > WATER_HEIGHT - FISH_HEIGHT) { fishingFishY = WATER_HEIGHT - FISH_HEIGHT; fishingFishSpeed *= -1; }

    /* ── 2. 포획 영역 물리 이동 ── */
    /* 버튼을 누르면 위로(+), 떼면 아래로(-) 가속합니다 */
    if (isPressingFishingBtn) fishingPlayerVelocity += 1.5;
    else                      fishingPlayerVelocity -= 1.5;
    fishingPlayerVelocity *= 0.8;  // 감속 (공기 저항)
    fishingPlayerY        += fishingPlayerVelocity;
    /* 위아래 경계 제한 */
    if (fishingPlayerY < 0)                           { fishingPlayerY = 0;                           fishingPlayerVelocity = 0; }
    if (fishingPlayerY > WATER_HEIGHT - PLAYER_HEIGHT) { fishingPlayerY = WATER_HEIGHT - PLAYER_HEIGHT; fishingPlayerVelocity = 0; }

    /* ── 3. 충돌 판정 ── */
    /* 물고기의 중심이 포획 영역 안에 들어와 있으면 성공 판정 */
    var fishCenterY   = fishingFishY + (FISH_HEIGHT / 2);
    var isOverlapping = (fishCenterY >= fishingPlayerY) && (fishCenterY <= fishingPlayerY + PLAYER_HEIGHT);

    if (isOverlapping) {
        fishingProgress += 0.4;         /* ★ 증가 속도 (값이 클수록 빨리 채워짐) */
        playerBar.className = 'catch-success';  // 초록색 테두리
    } else {
        fishingProgress -= 0.2;         /* ★ 감소 속도 (값이 클수록 빨리 줄어듦) */
        playerBar.className = 'catch-fail';     // 빨간색 테두리
    }
    fishingProgress = Math.max(0, Math.min(100, fishingProgress));  // 0~100 범위 제한

    /* ── 4. 화면 갱신 ── */
    fishZone.style.bottom    = fishingFishY    + 'px';
    playerBar.style.bottom   = fishingPlayerY  + 'px';
    progressBar.style.width  = fishingProgress + '%';

    /* ── 5. 승패 판정 ── */
    if      (fishingProgress >= 100) { endFishingGame(true,  myCharId); }
    else if (fishingProgress <= 0)   { endFishingGame(false, myCharId); }
    else {
        /* 아직 진행 중이면 다음 프레임에 다시 실행 */
        fishingAnimationFrame = requestAnimationFrame(function () {
            updateFishingGame(myCharId);
        });
    }
}

/*
낚시 게임 종료 후 결과를 처리하는 함수입니다.

isWin    : true = 성공, false = 실패
myCharId : 보상을 지급할 캐릭터 ID

★ 보상 금액 변경 방법:
  아래 minReward / maxReward 숫자를 원하는 값으로 바꾸세요.
  보상 = minReward 와 maxReward 사이의 랜덤 금액

  현재 설정:
    easy (잔잔한 호수) 성공: 100 ~ 500 G
    hard (거친 바다)   성공: 300 ~ 1000 G
*/
async function endFishingGame(isWin, myCharId) {
    fishingActive = false;

    var gameMessage = document.getElementById('fishing-message');
    var actionBtn   = document.getElementById('fishing-action-btn');
    var playerBar   = document.getElementById('player-bar');

    playerBar.className = '';   // 테두리 색 초기화
    actionBtn.disabled  = true;

    if (isWin) {
        /* ★ 난이도별 보상 범위 */
        var minReward = currentDifficulty === 'easy' ? 100  : 300;
        var maxReward = currentDifficulty === 'easy' ? 500  : 1000;
        var reward    = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;

        gameMessage.innerHTML   = '<b>월척입니다!</b><br>' + reward.toLocaleString() + ' G 획득!';
        gameMessage.style.color = '#4CAF50';
        actionBtn.innerText     = '보상 획득 중...';

        /* DB에 보상 저장 */
        currentEditingId    = myCharId;
        currentEditingPhase = 0;
        var res = await upsertProfileData({ money: currentMoney + reward });
        if (!res || !res.error) {
            currentMoney += reward;
            await _refreshMiniGameMoneyDisplay();
            if (typeof loadCharacterData === 'function') await loadCharacterData();
        }
    } else {
        gameMessage.innerHTML   = '물고기가 도망갔습니다...';
        gameMessage.style.color = '#ff4d4d';
    }

    /* 2초 후 낚시터 선택 메뉴로 돌아갑니다 */
    setTimeout(function () {
        document.getElementById('fishing-play').style.display = 'none';
        document.getElementById('fishing-menu').style.display = 'flex';
        gameMessage.innerHTML   = '원하는 낚시터를 선택하세요.';
        gameMessage.style.color = '#fff';
    }, 2000);
}


/* ================================================================= */
/*  9. 증권 거래소 (주식 시스템)                                       */
/*                                                                   */
/*  3초마다 주가가 자동으로 변동됩니다.                                  */
/*  접속 중에 변동된 가격은 30초마다 DB에 동기화됩니다.                  */
/*  첫 접속 시 오프라인 동안 밀린 시간을 계산해 적용합니다.               */
/*                                                                   */
/*  ★ 종목명 변경:                                                    */
/*    아래 initStockSystem 의 label 값과                              */
/*    updateStockUI / tradeStock 함수의 corpName 변수를 함께 수정하세요. */
/*                                                                   */
/*  ★ 초기 주가 변경:                                                 */
/*    _marketState 객체의 samsung / sk 값을 수정하세요.                */
/*                                                                   */
/*  ★ 증권 DB 설정:                                                   */
/*    Supabase에 market_data 테이블이 필요합니다.                       */
/*    컬럼: id(int8), samsung_price(int8), sk_price(int8),            */
/*          samsung_trend(int2), sk_trend(int2), last_updated(timestamptz) */
/*    초기 데이터로 id=1 인 row 를 삽입해두세요.                        */
/* ================================================================= */

var _stockChart   = null;   // Chart.js 차트 인스턴스
var _stockHistory = { labels: [], samsung: [], sk: [] }; // 차트 꺾은선 데이터 저장소
var _stockInited  = false;  // 중복 초기화 방지 플래그

/*
시장 상태 객체 — DB와 동기화되는 중앙 가격 데이터입니다.

★ 초기 주가 변경: samsung / sk 값을 원하는 가격으로 수정하세요.
*/
var _marketState = {
    samsung:        74000,   // ★ 종목A 초기 가격 (G)
    sk:             165000,  // ★ 종목B 초기 가격 (G)
    samsung_trend:  1,       // 기조: 1 = 상승장, -1 = 하락장 (DB 동기화 후 덮어쓰여집니다)
    sk_trend:       1,
    last_updated:   Date.now(),
};

var _stockTickCount  = 0;       // 틱 카운터 (이벤트 주기 계산에 사용)
var TICK_INTERVAL_MS = 3000;    // 틱 주기 (ms). 3000 = 3초마다 주가 변동

/* 현재 활성화된 주가를 반환합니다 */
function _getActivePrices() {
    return { samsung: _marketState.samsung, sk: _marketState.sk };
}

/*
증권 시스템을 초기화합니다.
index.html 의 초기화 스크립트에서 setTimeout 으로 호출합니다.

실행 순서:
  1. Chart.js 차트 생성
  2. DB에서 최신 가격 불러오기 + 오프라인 밀린 시간 시뮬레이션
  3. 보유 주식 표시 갱신
  4. 실시간 틱 시작 (3초마다)
*/
async function initStockSystem() {
    if (_stockInited) return;
    _stockInited = true;

    var canvas = document.getElementById('stockChart');
    if (!canvas || typeof Chart === 'undefined') return;
    var ctx = canvas.getContext('2d');

    /* 차트 영역 그라데이션 색상 */
    var gradS = ctx.createLinearGradient(0, 0, 0, 250);
    gradS.addColorStop(0, 'rgba(255, 77, 77, 0.4)');
    gradS.addColorStop(1, 'rgba(255, 77, 77, 0.0)');
    var gradK = ctx.createLinearGradient(0, 0, 0, 250);
    gradK.addColorStop(0, 'rgba(76, 139, 245, 0.4)');
    gradK.addColorStop(1, 'rgba(76, 139, 245, 0.0)');

    /* Chart.js 꺾은선 그래프 생성 */
    _stockChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels:   _stockHistory.labels,
            datasets: [
                {
                    /* ★ 종목A 차트 범례 이름 변경 가능 */
                    label:            '더미 종목A (A-기업)',
                    borderColor:      '#ff4d4d',
                    backgroundColor:  gradS,
                    data:             _stockHistory.samsung,
                    borderWidth: 2, tension: 0.2, fill: true,
                    pointRadius: 2, pointBackgroundColor: '#ff4d4d',
                },
                {
                    /* ★ 종목B 차트 범례 이름 변경 가능 */
                    label:            '더미 종목B (B-기업)',
                    borderColor:      '#4c8bf5',
                    backgroundColor:  gradK,
                    data:             _stockHistory.sk,
                    borderWidth: 2, tension: 0.2, fill: true,
                    pointRadius: 2, pointBackgroundColor: '#4c8bf5',
                },
            ],
        },
        options: {
            responsive:          true,
            maintainAspectRatio: false,
            animation:           { duration: 400, easing: 'linear' },
            plugins: {
                legend:  { labels: { color: '#ccc', font: { family: 'Nanum Myeongjo' } } },
                tooltip: { mode: 'index', intersect: false },
            },
            scales: {
                x: { ticks: { color: '#666', maxTicksLimit: 10 }, grid: { display: false } },
                y: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            },
        },
    });

    /* DB에서 최신 가격 불러오기 + 오프라인 밀린 틱 시뮬레이션 */
    await _syncMarketDataFromDB();
    /* 보유 주식 표시 갱신 */
    await _loadMyHoldings();
    /* 실시간 틱 시작 */
    setInterval(_tickStock, TICK_INTERVAL_MS);
    _tickStock(false);  // 시작 시 UI 즉시 렌더링
}

/*
DB에서 저장된 시장 데이터를 불러오고
오프라인 동안 밀린 시간만큼 주가를 시뮬레이션합니다.

이 방식 덕분에 마지막 접속자가 나간 뒤에도 주가가 멈추지 않고
다음 접속자가 들어왔을 때 자연스럽게 이어집니다.
*/
async function _syncMarketDataFromDB() {
    if (!supabaseClient) return;

    /* market_data 테이블의 id=1 row 조회 */
    var res = await supabaseClient.from('market_data').select('*').eq('id', 1).single();
    if (res.error || !res.data) {
        /* DB 데이터가 없으면 기본값(_marketState) 으로 계속 진행 */
        console.warn('market_data 테이블에 데이터가 없습니다. 로컬 값으로 실행됩니다.');
        return;
    }

    var data        = res.data;
    var lastUpdated = new Date(data.last_updated).getTime();
    var now         = Date.now();

    /* 마지막 저장 이후 몇 틱(3초 단위)이 지났는지 계산 */
    var missedTicks = Math.floor((now - lastUpdated) / TICK_INTERVAL_MS);

    /* DB 값으로 현재 상태 갱신 */
    _marketState.samsung       = data.samsung_price;
    _marketState.sk            = data.sk_price;
    _marketState.samsung_trend = data.samsung_trend;
    _marketState.sk_trend      = data.sk_trend;

    /* 밀린 시간만큼 주가 변동을 일괄 시뮬레이션 (최대 1000틱 = 약 50분) */
    if (missedTicks > 0) {
        var simulateTicks = Math.min(missedTicks, 1000);
        for (var i = 0; i < simulateTicks; i++) {
            _simulateSingleTick();
        }
        /* 시뮬레이션 결과를 DB에 저장해 다음 접속자와 공유합니다 */
        await _saveMarketDataToDB();
    }
}

/*
1틱(3초) 분량의 주가 변동을 계산합니다.
_syncMarketDataFromDB 의 오프라인 시뮬레이션과 실시간 _tickStock 에서 모두 사용합니다.

변동 규칙:
  - 매 틱: -1% ~ +1% 사이 랜덤 변동 + 기조 편향 (±0.5%)
  - 2시간(2400틱)마다: 상승장 / 하락장 기조 전환
  - 30분(600틱)마다: 20~50% 폭등·폭락 이벤트 발생
  - 최소 가격: 1000 G (주식이 0이 되는 것 방지)

★ 변동폭 조정:
  samChange 계산식의 0.02 값을 바꾸면 변동성이 달라집니다.
  크게 하면 더 크게 오르내리고, 작게 하면 잔잔해집니다.
*/
function _simulateSingleTick() {
    _stockTickCount++;

    /* 2시간(2400틱)마다 기조 전환 */
    if (_stockTickCount % 2400 === 0) {
        _marketState.samsung_trend = Math.random() < 0.5 ? 1 : -1;
        _marketState.sk_trend      = Math.random() < 0.5 ? 1 : -1;
    }

    /* 매 틱: 기본 변동 (-1% ~ +1%) + 기조 편향 */
    var samChange = (Math.random() * 0.02 - 0.01) + (_marketState.samsung_trend * 0.005);
    var skChange  = (Math.random() * 0.02 - 0.01) + (_marketState.sk_trend      * 0.005);

    /* 30분(600틱)마다: 20~50% 폭등·폭락 이벤트 */
    if (_stockTickCount % 600 === 0) {
        /* 70% 확률로 현재 기조 방향, 30% 확률로 반대 방향 */
        var samDir = Math.random() < 0.7 ? _marketState.samsung_trend : -_marketState.samsung_trend;
        var skDir  = Math.random() < 0.7 ? _marketState.sk_trend      : -_marketState.sk_trend;
        samChange  = samDir * (Math.random() * 0.30 + 0.20);
        skChange   = skDir  * (Math.random() * 0.30 + 0.20);
    }

    /* 최소 1000 G 방어선 적용 후 가격 갱신 */
    _marketState.samsung = Math.max(1000, Math.floor(_marketState.samsung * (1 + samChange)));
    _marketState.sk      = Math.max(1000, Math.floor(_marketState.sk      * (1 + skChange)));
}

/* 현재 주가와 기조를 DB에 저장합니다 (30틱 = 90초마다 호출) */
async function _saveMarketDataToDB() {
    if (!supabaseClient) return;
    _marketState.last_updated = new Date().toISOString();
    await supabaseClient.from('market_data').update({
        samsung_price:  _marketState.samsung,
        sk_price:       _marketState.sk,
        samsung_trend:  _marketState.samsung_trend,
        sk_trend:       _marketState.sk_trend,
        last_updated:   _marketState.last_updated,
    }).eq('id', 1);
}

/*
실시간 틱 함수 — 3초마다 자동 호출됩니다.
주가를 1틱 변동시키고, 차트와 화면 텍스트를 갱신합니다.

updateDB : true = 주가 계산 실행 (일반 틱)
           false = 계산 없이 UI만 갱신 (초기화 시 첫 렌더링용)
*/
function _tickStock(updateDB) {
    if (updateDB === undefined) updateDB = true;

    var now   = new Date();
    var label = String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');

    if (updateDB) {
        _simulateSingleTick();
        /* 30초(10틱)마다 한 번씩만 DB에 저장해 과도한 요청을 방지합니다 */
        if (_stockTickCount % 10 === 0) {
            _saveMarketDataToDB();
        }
    }

    /* 차트 데이터 추가 (최근 25개만 유지) */
    _stockHistory.labels.push(label);
    _stockHistory.samsung.push(_marketState.samsung);
    _stockHistory.sk.push(_marketState.sk);
    if (_stockHistory.labels.length > 25) {
        _stockHistory.labels.shift();
        _stockHistory.samsung.shift();
        _stockHistory.sk.shift();
    }

    if (_stockChart) _stockChart.update();

    /* 화면의 '현재가' 텍스트 갱신 */
    var sEl = document.getElementById('price-samsung');
    var kEl = document.getElementById('price-sk');
    if (sEl) sEl.innerText = _marketState.samsung.toLocaleString() + ' G';
    if (kEl) kEl.innerText = _marketState.sk.toLocaleString()      + ' G';

    /* 외부 코드에서 참조할 수 있도록 전역에도 노출합니다 */
    window.currentPrices = { samsung: _marketState.samsung, sk: _marketState.sk };
}

/* DB에서 내 보유 주식을 불러와 화면에 표시합니다 */
async function _loadMyHoldings() {
    if (!currentUser || !supabaseClient) return;
    var myCharId = charOwners[currentUser.email];
    if (!myCharId) return;

    var res = await supabaseClient
        .from('character_profiles')
        .select('stocks')
        .eq('char_id', myCharId)
        .eq('phase', 0)
        .single();

    if (res.data && res.data.stocks) {
        var parsed = typeof res.data.stocks === 'string'
            ? JSON.parse(res.data.stocks)
            : res.data.stocks;
        window.myHoldings = parsed;
    }
    window.updateStockUI();
}

/*
보유 주식 현황을 화면 상단에 표시합니다.

★ 종목 표시 이름 변경:
  '더미 종목A' / '더미 종목B' 텍스트를 실제 종목명으로 바꾸세요.
  index.html 의 증권 거래소 섹션에 표시된 이름과 일치시키면 좋습니다.
*/
window.updateStockUI = function () {
    var display  = document.getElementById('stock-holdings-display');
    var holdings = window.myHoldings || { samsung: 0, sk: 0 };
    if (display) {
        display.innerText =
            '더미 종목A ' + (holdings.samsung || 0) + '주 / ' +
            '더미 종목B ' + (holdings.sk      || 0) + '주';
    }
};

/*
매수(구매) 또는 매도(판매) 버튼 클릭 시 실행됩니다.

corp   : 'samsung' | 'sk' (index.html 의 onclick="tradeStock('samsung','buy')" 과 일치)
action : 'buy' | 'sell'

★ 종목 표시 이름 변경:
  아래 corpName 변수의 문자열을 실제 종목명으로 바꾸세요.
*/
window.tradeStock = async function (corp, action) {
    if (!currentUser) return alert('로그인이 필요합니다.');
    var myCharId = charOwners[currentUser.email];
    if (!myCharId) return alert('이 계정과 연결된 캐릭터가 없습니다.');

    var prices = _getActivePrices();
    if (!prices || !prices[corp]) {
        return alert('가격 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
    }

    /* ★ 종목 표시 이름 — 실제 종목명으로 변경하세요 */
    var corpName = corp === 'samsung' ? '더미 종목A' : '더미 종목B';
    var price    = prices[corp];

    /* 거래 수량 입력 */
    var qtyStr = prompt(
        action === 'buy'
            ? '[' + corpName + '] 매수할 주 수\n현재가: ' + price.toLocaleString() + ' G / 1주'
            : '[' + corpName + '] 매도할 주 수\n현재가: ' + price.toLocaleString() + ' G / 1주',
        '1'
    );
    if (!qtyStr) return;
    var qty = parseInt(qtyStr);
    if (isNaN(qty) || qty < 1) return alert('올바른 수량을 입력하세요.');

    /* 최신 소지금과 보유 주식을 DB에서 재조회 (동시 접속 시 데이터 충돌 방지) */
    var fetchRes = await supabaseClient
        .from('character_profiles')
        .select('money, stocks')
        .eq('char_id', myCharId)
        .eq('phase', 0)
        .single();

    var myMoney  = (fetchRes.data && fetchRes.data.money)
        ? parseInt(String(fetchRes.data.money).replace(/,/g, ''), 10)
        : 0;

    var holdings = { samsung: 0, sk: 0 };
    if (fetchRes.data && fetchRes.data.stocks) {
        holdings = typeof fetchRes.data.stocks === 'string'
            ? JSON.parse(fetchRes.data.stocks)
            : fetchRes.data.stocks;
    }
    window.myHoldings = holdings;

    var total = price * qty;  // 총 거래 대금

    if (action === 'buy') {
        /* 매수: 소지금이 충분한지 확인 */
        if (myMoney < total) {
            return alert(
                '소지금 부족!\n필요: ' + total.toLocaleString() + ' G\n보유: ' + myMoney.toLocaleString() + ' G'
            );
        }
        myMoney          -= total;
        holdings[corp]    = (holdings[corp] || 0) + qty;
        alert('[' + corpName + '] ' + qty + '주 매수 완료\n합계: ' + total.toLocaleString() + ' G\n잔액: ' + myMoney.toLocaleString() + ' G');

    } else {
        /* 매도: 보유 주식이 충분한지 확인 */
        var held = holdings[corp] || 0;
        if (held < qty) {
            return alert(
                '보유 주식 부족!\n보유: ' + held + '주 / 매도 요청: ' + qty + '주'
            );
        }
        myMoney          += total;
        holdings[corp]    = held - qty;
        alert('[' + corpName + '] ' + qty + '주 매도 완료\n합계: +' + total.toLocaleString() + ' G\n잔액: ' + myMoney.toLocaleString() + ' G');
    }

    /* 거래 결과 DB 저장 */
    window.myHoldings   = holdings;
    currentEditingId    = myCharId;
    currentEditingPhase = 0;
    var saveRes = await upsertProfileData({
        money:  myMoney,
        stocks: JSON.stringify(holdings),
    });

    if (saveRes && saveRes.error) {
        alert('거래 처리 중 오류가 발생했습니다. F12 콘솔을 확인해주세요.');
    } else {
        window.updateStockUI();
        if (typeof updateShopMoneyDisplay === 'function') updateShopMoneyDisplay();
    }
};
