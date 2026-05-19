/* ================================================================= */
/* Character.js — 캐릭터 관리 및 팝업창(모달) 기능                       */
/* 초보자 안내: 이 파일은 웹사이트에서 캐릭터의 정보, 가방(인벤토리), 무기,   */
/* 그리고 배경음악(BGM) 등을 제어하는 아주 중요한 '두뇌' 역할을 합니다.        */
/* ================================================================= */

// ─────────────────────────────────────────────────────────────────
// 1. 캐릭터 페이지 화면 그리기 (레이아웃 생성)
// ─────────────────────────────────────────────────────────────────
// Config.js 파일에 적어둔 캐릭터 정보(charData)를 가져와서 실제 화면에 보여줄 박스들을 만듭니다.
function initCharacterPages() {
    // 능력치 차트와 아이템 목록들이 제자리에 예쁘게 들어가도록 CSS(디자인 규칙)를 하나 추가합니다.
    var html = '<style>.stats-wrapper > *:not(.weapon-section):not(.inventory-section) { grid-column: 1; grid-row: 1; justify-self: center; align-self: center; margin-top:10px; }</style>';
    
    // 등록된 캐릭터 숫자만큼 반복해서 화면을 만듭니다. (4명이면 4번 반복)
    charData.forEach(function (c) {
        var slides = '';
        // 1부부터 4부까지 총 4개의 시간대(탭)를 만듭니다.
        for (var i = 0; i < 4; i++) {
            slides +=
                // 첫 번째 탭(0번)만 처음에 화면에 보이도록 'active' 클래스를 붙여줍니다.
                '<div class="phase-slide ' + (i === 0 ? 'active' : '') + '">' +
                    // 캐릭터 이름과 외부 시트(CCFOLIA 등)로 넘어가는 버튼
                    '<div class="char-header-row"><h2>' + c.title + '</h2><a href="#" class="link-btn" target="_blank">시트</a></div>' +
                    
                    // 프로필 사진과 명대사, 기본 정보가 들어가는 부분
                    '<div class="profile-overview">' +
                        '<img src="' + c.img + '" class="main-profile-img" onclick="openLightbox(this.src)" alt="더미 프로필 사진">' +
                        '<div class="profile-info-wrapper">' +
                            '<div class="char-quote">' +
                                '<span class="quote-mark" style="color:rgb(' + c.color + ');">"</span>' +
                                '<p class="quote-text">' + c.quote + '</p>' +
                            '</div>' +
                            '<div class="divider-dots">• • •</div>' +
                            '<div class="info-table">' +
                                '<div class="info-row"><span class="info-label">이름</span><span class="info-value">' + c.name + '</span></div>' +
                                '<div class="info-row"><span class="info-label">직업</span><span class="info-value">더미 직업</span></div>' +
                                '<div class="info-row"><span class="info-label">나이</span><span class="info-value">더미 나이</span></div>' +
                                '<div class="info-row"><span class="info-label">거주지</span><span class="info-value">더미 거주지</span></div>' +
                                '<div class="info-row money-row"><span class="info-label">소지금</span><span class="info-value money-display">0 G</span></div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="divider-dots">• • •</div>' +
                    
                    // 가운데 들어갈 커다란 표(Grid) 영역: 레이더 차트, 무기, 인벤토리가 들어갑니다.
                    '<div class="stats-wrapper" data-stats="' + c.stats + '" data-color="' + c.color + '" style="display:grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; gap:10px 40px; align-items:start; justify-items:center;">' +
                        
                        // 1-1. 표의 오른쪽 위 (무기 영역)
                        '<div class="weapon-section" style="grid-column: 2; grid-row: 1; width:100%; justify-self:stretch;">' +
                            '<div class="weapon-display-wrapper" data-weapon="{}">' +
                                '<div class="inv-header-wrapper" style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">' +
                                    '<h3 style="margin:0; font-family:\'Nanum Myeongjo\', serif; color:var(--accent-color);">Weapon &amp; Combat</h3>' +
                                    '<span class="wpn-brawl-display" style="background:rgba(215,179,61,0.1); border:1px solid rgba(215,179,61,0.4); padding:4px 12px; border-radius:20px; font-size:0.85rem; color:#d7b33d; font-weight:bold;">근접 격투: 50</span>' +
                                '</div>' +
                                '<div class="weapon-content-list" style="display:flex;flex-direction:column;gap:8px;cursor:pointer;">' +
                                    '<div style="background:rgba(0,0,0,0.3);padding:15px;border-radius:12px;border:1px dashed rgba(215,179,61,0.3);text-align:center;color:#aaa;font-size:0.9rem;">장착된 무기가 없습니다.</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        
                        // 1-2. 표의 아래쪽 전체 (인벤토리 영역)
                        '<div class="inventory-section" style="grid-column: 1 / -1; grid-row: 2; width:100%; justify-self:stretch; margin-top:25px;">' +
                            '<div class="inv-header-inventory" style="margin-bottom:15px;">' +
                                '<div style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:10px;">' +
                                    '<h3 style="margin:0; letter-spacing:1px; font-size:1.1rem; font-family:\'Nanum Myeongjo\', serif; color:var(--accent-color); white-space:nowrap;">Inventory</h3>' +
                                    '<div class="inv-tab-slot" style="display:flex; flex:1; max-width:180px; min-width:140px; background:rgba(10,10,10,0.8); border:1px solid rgba(215,179,61,0.5); border-radius:24px; padding:4px;"></div>' +
                                    // 내 우편함을 여는 버튼
                                    '<button class="inv-mailbox-btn auth-btn" style="width:auto; margin:0; padding:6px 14px; font-size:0.75rem; border-radius:20px; white-space:nowrap; background:#2a2826; border:1px solid rgba(215,179,61,0.3); color:#e5c56d; box-shadow:0 2px 4px rgba(0,0,0,0.3);" onclick="openMailboxModal(\'char-' + c.id + '\',' + i + ')">우편함</button>' +
                                '</div>' +
                            '</div>' +
                            '<div class="rpg-inventory"></div>' +
                        '</div>' +
                        
                    '</div>' +
                    '<div class="divider-dots">• • •</div>' +
                    
                    // 백스토리 영역
                    '<h2>백스토리</h2>' +
                    '<p class="section-intro">캐릭터의 백스토리를 요약해서 적는 공간입니다.</p>' +
                    '<details><summary>상세 설정 보기</summary><div class="details-content">자세한 내용은 이곳에 적힙니다.</div></details>' +
                '</div>';
        }
        
        // 만들어진 4개의 슬라이드를 하나로 묶어서 큰 상자 안에 넣습니다.
        html +=
            '<section id="char-' + c.id + '" class="content-card">' +
                '<div class="phase-tabs">' +
                    '<button class="phase-btn active" onclick="changePhase(this, 0)">1부</button>' +
                    '<button class="phase-btn"        onclick="changePhase(this, 1)">2부</button>' +
                    '<button class="phase-btn"        onclick="changePhase(this, 2)">3부</button>' +
                    '<button class="phase-btn"        onclick="changePhase(this, 3)">4부</button>' +
                '</div>' +
                '<div class="phase-content-wrapper">' + slides + '</div>' +
            '</section>';
    });
    
    // HTML 코드를 실제 웹페이지에 반영합니다.
    document.getElementById('character-pages-container').innerHTML = html;
    
    // 차트 그리기 함수가 준비되었다면, 차트를 그리라고 명령합니다.
    if (typeof drawAllRadarCharts === 'function') drawAllRadarCharts();
}

// 화면상에 빈 인벤토리(20칸)를 미리 만들어주는 함수입니다.
function initDefaultInventories() {
    document.querySelectorAll('.rpg-inventory').forEach(function (inv) {
        while (inv.querySelectorAll('.inv-slot').length < 20)
            inv.insertAdjacentHTML('beforeend', '<div class="inv-slot"></div>');
    });
}

// ─────────────────────────────────────────────────────────────────
// 2. 기본 정보 기록 팝업창 (프로필, 백스토리 수정)
// ─────────────────────────────────────────────────────────────────
window.openGeneralModal = function (charId, phaseIndex) {
    // 수정하려는 사람이 진짜 이 캐릭터의 주인인지 확인합니다.
    var myCharId = currentUser ? charOwners[currentUser.email] : null;
    if (myCharId !== charId) return alert('본인의 캐릭터 정보만 수정할 수 있습니다.');
    
    // 지금 수정하고 있는 캐릭터 아이디와 몇 부(phase)인지 기억해둡니다.
    currentEditingId    = charId;
    currentEditingPhase = phaseIndex;

    // 화면에 이미 적혀있는 글씨들을 팝업창 안의 입력칸으로 복사해옵니다.
    var targetSlide = document.getElementById(charId).querySelectorAll('.phase-slide')[phaseIndex];
    var iv = targetSlide.querySelectorAll('.info-value');
    document.getElementById('edit-modal-title').innerText  = iv[0].innerText + ' 정보 수정';
    document.getElementById('current-profile-img').value   = targetSlide.querySelector('.main-profile-img').src;
    document.getElementById('edit-quote').value            = targetSlide.querySelector('.quote-text').innerText;
    document.getElementById('edit-job').value              = iv[1].innerText.replace(/더미 직업|\?|여기에/, '');
    document.getElementById('edit-age').value              = iv[2].innerText.replace(/더미 나이|\?|여기에/, '');
    document.getElementById('edit-residence').value        = iv[3].innerText.replace(/더미 거주지|\?|여기에/, '');
    document.getElementById('edit-backstory').value        = targetSlide.querySelector('.section-intro').innerText;
    
    // 테마 색상 설정
    var currentRgb = targetSlide.querySelector('.stats-wrapper').getAttribute('data-color') || '147, 223, 60';
    document.getElementById('edit-theme-color').value = rgbToHex(currentRgb);

    // ★ 데이터베이스에서 BGM 주소를 불러와서 입력칸에 채워줍니다.
    var profile = (typeof allProfiles !== 'undefined')
        ? allProfiles.find(function (p) { return p.char_id === charId && p.phase === phaseIndex; })
        : null;
    if (document.getElementById('edit-bgm-url')) {
        document.getElementById('edit-bgm-url').value = (profile && profile.bgm_url) ? profile.bgm_url : '';
    }

    // 팝업창을 눈에 보이게 합니다.
    document.getElementById('edit-modal').classList.add('show');
};

// 팝업창에서 수정한 내용을 데이터베이스에 저장하는 함수입니다.
window.saveGeneralData = async function () {
    var btn = document.getElementById('save-btn');
    btn.innerText = '저장 중...'; btn.disabled = true; // 저장 중에는 두 번 클릭하지 못하게 버튼을 막습니다.

    var finalImg  = document.getElementById('current-profile-img').value;
    var fileInput = document.getElementById('edit-profile-file');
    
    // 사진을 첨부했다면 사진 서버에 먼저 올립니다.
    if (fileInput.files.length > 0) {
        btn.innerText = '외부 전송 중...';
        var uploadedUrl = await uploadToImgbb(fileInput.files[0]);
        if (uploadedUrl) finalImg = uploadedUrl;
        else             alert('이미지 업로드에 실패했습니다.');
    }
    
    var hexColor = document.getElementById('edit-theme-color').value;
    var bgmUrl   = document.getElementById('edit-bgm-url') ? document.getElementById('edit-bgm-url').value.trim() : '';

    // 바뀐 정보들을 싹 모아서 데이터베이스에 전송(upsert)합니다.
    var res = await upsertProfileData({
        profile_image: finalImg,
        quote:         document.getElementById('edit-quote').value,
        job:           document.getElementById('edit-job').value,
        age:           document.getElementById('edit-age').value,
        residence:     document.getElementById('edit-residence').value,
        backstory:     document.getElementById('edit-backstory').value,
        chart_color:   hexToRgb(hexColor),
        bgm_url:       bgmUrl // ★ BGM 정보도 저장
    });
    
    btn.innerText = '기본 정보 기록하기'; btn.disabled = false;
    if (res && res.error) alert('저장 실패');
    else { 
        await loadCharacterData(); // 새로고침
        closeModal('edit-modal');  // 팝업창 닫기
    }
};

// ─────────────────────────────────────────────────────────────────
// 3. 능력치 조정 팝업창
// ─────────────────────────────────────────────────────────────────
window.openStatsModal = function (charId, phaseIndex) {
    currentEditingId    = charId;
    currentEditingPhase = phaseIndex;
    
    // 현재 능력치 숫자들(콤마로 이어진 문자열)을 가져와 배열로 나눕니다.
    var statsStr = document.getElementById(charId)
        .querySelectorAll('.phase-slide')[phaseIndex]
        .querySelector('.stats-wrapper').getAttribute('data-stats') || '50,50,50,50,50,50,50,50';
    var stats = statsStr.split(',').map(Number);

    // 8개의 입력칸을 만듭니다.
    var h = '';
    for (var i = 0; i < 8; i++) {
        h += '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<span style="color:var(--accent-color);font-weight:bold;">' + STAT_LABELS[i] + '</span>' +
            '<input type="number" id="stat-input-' + i + '" value="' + (stats[i] || 50) + '" class="modal-inline-input" style="width:60px;text-align:center;">' +
            '</div>';
    }
    document.getElementById('stats-inputs-container').innerHTML = h;
    document.getElementById('stats-modal').classList.add('show');
};

window.saveStatsToDB = async function () {
    var btn = document.getElementById('stats-save-btn');
    btn.innerText = '⏳ 적용 중...'; btn.disabled = true;
    
    var arr = [];
    for (var i = 0; i < 8; i++) arr.push(document.getElementById('stat-input-' + i).value || 50);
    
    // 배열을 다시 콤마(,) 문자열로 합쳐서 저장합니다.
    var res = await upsertProfileData({ stats: arr.join(',') });
    
    btn.innerText = '능력치 적용'; btn.disabled = false;
    if (res && res.error) alert('저장 실패');
    else { await loadCharacterData(); closeModal('stats-modal'); }
    
    // 능력치가 바뀌었으니 차트 모양도 다시 그리도록 합니다.
    if (typeof window.drawAllRadarCharts === 'function') window.drawAllRadarCharts();
};

// ─────────────────────────────────────────────────────────────────
// 4. 무기 및 전투 스탯 관리 팝업창
// ─────────────────────────────────────────────────────────────────
// 팝업창에서 '무기 추가' 버튼을 눌렀을 때, 입력칸을 한 줄 만들어주는 함수입니다.
window.addWeaponRow = function (name, dmg, type, desc) {
    name = name || ''; dmg = dmg || ''; type = type || 'brawl'; desc = desc || '';
    var container = document.getElementById('weapon-list-container');
    var row = document.createElement('div');
    row.className = 'weapon-row';
    row.style.cssText = 'background:#0a0908;padding:15px;border-radius:8px;border:1px solid #2a2520;margin-bottom:12px;display:flex;flex-direction:column;gap:10px;';
    
    row.innerHTML =
        '<div style="display:flex;gap:10px;align-items:center;">' +
            '<input type="text" class="auth-input wp-name" placeholder="무기명 (더미무기)" value="' + name + '" style="margin:0;padding:10px;flex:2;background:#12100e;border:1px solid #222;color:#fff;border-radius:6px;font-weight:bold;">' +
            '<input type="text" class="auth-input wp-dmg"  placeholder="1d8+2" value="' + dmg  + '" style="margin:0;padding:10px;flex:1;background:#12100e;border:1px solid #222;color:#ff4d4d;font-weight:bold;text-align:center;border-radius:6px;">' +
            '<select class="auth-input wp-type" style="margin:0;padding:10px;flex:1.2;background:#12100e;border:1px solid #222;color:#fff;border-radius:6px;cursor:pointer;">' +
                '<option value="brawl"' + (type === 'brawl' ? ' selected' : '') + '>격투</option>' +
                '<option value="sword"' + (type === 'sword' ? ' selected' : '') + '>도검</option>' +
                '<option value="bow"'   + (type === 'bow'   ? ' selected' : '') + '>활</option>' +
                '<option value="throw"' + (type === 'throw' ? ' selected' : '') + '>투척</option>' +
                '<option value="magic"' + (type === 'magic' ? ' selected' : '') + '>도술</option>' +
            '</select>' +
            '<button style="background:#4a1c1c;color:#ff9999;border:1px solid #6a2c2c;padding:10px 15px;border-radius:6px;cursor:pointer;font-weight:bold;white-space:nowrap;" onclick="this.closest(\'.weapon-row\').remove()">삭제</button>' +
        '</div>' +
        '<input type="text" class="auth-input wp-desc" placeholder="무기 설명 및 외형 (선택)" value="' + desc + '" style="margin:0;padding:10px;width:100%;box-sizing:border-box;font-size:0.85rem;color:#888;background:#12100e;border:1px solid #222;border-radius:6px;">';
    container.appendChild(row);
};

window.openWeaponModal = async function (charId, phaseIndex) {
    if (!currentUser) return alert('로그인이 필요합니다.');
    var myCharId = charOwners[currentUser.email];
    if (myCharId !== charId) return alert('본인 캐릭터만 수정할 수 있습니다.');
    currentEditingId    = charId;
    currentEditingPhase = phaseIndex;

    // 무기 및 기능치 데이터만 골라서 서버에서 가져옵니다.
    var res = await supabaseClient
        .from('character_profiles').select('weapon_data')
        .eq('char_id', charId).eq('phase', phaseIndex).single();

    // 열기 전에 팝업창 안을 깨끗하게 비워둡니다.
    document.getElementById('weapon-list-container').innerHTML = '';
    ['edit-brawl-stat','edit-sword-stat','edit-bow-stat','edit-throw-stat',
     'edit-magic-stat','edit-dodge-stat','edit-drive-stat','edit-bp-stat'].forEach(function (id) {
        var el = document.getElementById(id); if (el) el.value = '';
    });

    // 서버에 저장된 무기 정보가 있다면 하나씩 화면에 생성해줍니다.
    if (res.data && res.data.weapon_data) {
        try {
            var w = typeof res.data.weapon_data === 'string'
                ? JSON.parse(res.data.weapon_data) : res.data.weapon_data;
            var setVal = function (id, val) { var el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
            setVal('edit-brawl-stat', w.brawl);
            setVal('edit-sword-stat', w.sword);
            setVal('edit-bow-stat',   w.bow);
            setVal('edit-throw-stat', w.throw);
            setVal('edit-magic-stat', w.magic);
            setVal('edit-dodge-stat', w.dodge);
            setVal('edit-drive-stat', w.drive);
            setVal('edit-bp-stat',    w.bp);
            
            (w.weapons || []).forEach(function (wp) {
                window.addWeaponRow(wp.name, wp.dmg, wp.type || 'brawl', wp.desc || '');
            });
        } catch (e) { console.warn('weapon_data 파싱 오류', e); }
    }
    document.getElementById('weapon-modal').classList.add('show');
};

window.saveWeaponData = async function () {
    if (!currentUser) return alert('로그인이 필요합니다.');
    var charId = charOwners[currentUser.email];
    if (!charId) return alert('권한 없음');

    var btn = document.querySelector('#weapon-modal .auth-btn[onclick="saveWeaponData()"]');
    if (btn) { btn.innerText = '⏳ 저장 중...'; btn.disabled = true; }

    // 숫자 입력칸의 값을 안전하게 읽어오는 도우미 함수입니다.
    var getNum = function (id) {
        var el = document.getElementById(id);
        return (el && el.value) ? parseInt(el.value) || 0 : 0;
    };
    
    var brawl  = getNum('edit-brawl-stat') || 25;
    var sword  = getNum('edit-sword-stat') || 25;
    var bow    = getNum('edit-bow-stat')   || 25;
    var throw_ = getNum('edit-throw-stat') || 20;
    var magic  = getNum('edit-magic-stat') || 15;
    var dodge  = getNum('edit-dodge-stat');
    var drive  = getNum('edit-drive-stat') || 20;
    var bp     = getNum('edit-bp-stat');

    var weapons = [];
    // 화면에 추가된 모든 무기 줄들을 순회하면서 정보를 수집합니다.
    document.querySelectorAll('.weapon-row').forEach(function (row) {
        var name = (row.querySelector('.wp-name') || {}).value || '';
        var dmg  = (row.querySelector('.wp-dmg')  || {}).value || '1d3';
        var type = (row.querySelector('.wp-type') || {}).value || 'brawl';
        var desc = (row.querySelector('.wp-desc') || {}).value || '';
        if (name.trim()) weapons.push({ name: name.trim(), dmg: dmg, type: type, desc: desc });
    });

    // 여러 정보를 하나의 객체 덩어리(JSON)로 묶어서 저장합니다.
    var payload = JSON.stringify({ brawl: brawl, sword: sword, bow: bow, throw: throw_, magic: magic, dodge: dodge, drive: drive, bp: bp, weapons: weapons });
    var res = await upsertProfileData({ weapon_data: payload });

    if (btn) { btn.innerText = '무기 및 스탯 기록하기'; btn.disabled = false; }
    if (res && res.error) alert('저장 실패: ' + res.error.message);
    else { await loadCharacterData(); closeModal('weapon-modal'); }
};

// ─────────────────────────────────────────────────────────────────
// 5. 인벤토리(가방/보관함) 관리 팝업창
// ─────────────────────────────────────────────────────────────────
var _currentInvTab      = 'general';  // 내가 지금 소지품을 보고 있는지, 보관함을 보고 있는지 기억합니다.
var _invRawGeneral      = [];         // 원본 소지품 데이터
var _invRawFurniture    = [];         // 원본 보관함(가구) 데이터

window.changeInvTab = function (tabName) {
    _currentInvTab = tabName;
    // 선택된 탭 버튼의 색상을 밝게(active) 만들어줍니다.
    var tabs = document.querySelectorAll('#inv-tabs .phase-btn');
    tabs.forEach(function (t) { t.classList.remove('active'); });
    var activeBtn = document.querySelector('#inv-tabs .phase-btn[onclick="changeInvTab(\'' + tabName + '\')"]');
    if (activeBtn) activeBtn.classList.add('active');

    // 보고자 하는 탭에 맞춰서 아이템 데이터를 갈아 끼웁니다.
    var src = (tabName === 'furniture') ? _invRawFurniture : _invRawGeneral;
    currentInvData = [];
    for (var i = 0; i < 20; i++) {
        var item = src[i];
        if (!item || (typeof item === 'string' && item.indexOf('[object') !== -1)) {
            currentInvData.push(null);
        } else if (typeof item === 'object' && item.name) {
            currentInvData.push(item);
        } else if (typeof item === 'string' && item.indexOf(':') !== -1) {
            // 과거의 텍스트 방식 데이터를 최신 객체 방식으로 변환해줍니다.
            var p = item.split(':');
            currentInvData.push({ name: p[0], desc: p[1] || '', img: p.slice(2).join(':'), count: 1 });
        } else {
            currentInvData.push(null);
        }
    }

    currentSlotIndex = -1; // 선택된 칸을 해제합니다.
    renderInvModalGrid();  // 화면의 20칸을 다시 그립니다.
    document.getElementById('inv-slot-form').style.display = 'none'; // 하단의 편집창을 숨깁니다.
};

// 인벤토리 열기 버튼을 누르면 데이터를 가져와서 모달을 켭니다.
window.openInvModal = async function (charId, phaseIndex) {
    currentEditingId    = charId;
    currentEditingPhase = phaseIndex;

    var res = await supabaseClient
        .from('character_profiles')
        .select('inventory, furniture_inventory')
        .eq('char_id', charId).eq('phase', phaseIndex).single();

    var profile = res.data || null;

    // 데이터를 안전하게 가져옵니다 (오류가 나면 빈 배열 처리)
    var rawG = (profile && profile.inventory) ? profile.inventory : [];
    if (typeof rawG === 'string') { try { rawG = JSON.parse(rawG); } catch(e) { rawG = []; } }
    if (!Array.isArray(rawG)) rawG = [];
    _invRawGeneral = rawG;

    var rawF = (profile && profile.furniture_inventory) ? profile.furniture_inventory : [];
    if (typeof rawF === 'string') { try { rawF = JSON.parse(rawF); } catch(e) { rawF = []; } }
    if (!Array.isArray(rawF)) rawF = [];
    _invRawFurniture = rawF;

    // 팝업이 열리면 무조건 처음엔 '소지품' 탭을 보여줍니다.
    _currentInvTab = 'general';
    var tabs = document.querySelectorAll('#inv-tabs .phase-btn');
    tabs.forEach(function (t, idx) { t.classList.toggle('active', idx === 0); });

    // 데이터 복원 및 20칸 맞추기
    currentInvData = [];
    for (var i = 0; i < 20; i++) {
        var item = rawG[i];
        if (!item || (typeof item === 'string' && item.indexOf('[object') !== -1)) {
            currentInvData.push(null);
        } else if (typeof item === 'object' && item.name) {
            currentInvData.push(item);
        } else if (typeof item === 'string' && item.indexOf(':') !== -1) {
            var p = item.split(':');
            currentInvData.push({ name: p[0], desc: p[1] || '', img: p.slice(2).join(':'), count: 1 });
        } else {
            currentInvData.push(null);
        }
    }

    currentSlotIndex = -1;
    document.getElementById('inv-slot-form').style.display = 'none';
    renderInvModalGrid();
    document.getElementById('inv-modal').classList.add('show');
};

// 팝업창 안의 20칸 네모를 그려주는 함수입니다.
function renderInvModalGrid() {
    var grid = document.getElementById('inv-modal-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // 사진이 없을 때 보여줄 더미 이미지
    var PH = (typeof PLACEHOLDER_ITEM !== 'undefined') ? PLACEHOLDER_ITEM : 'https://placehold.co/100?text=No+Image';

    for (var i = 0; i < 20; i++) {
        var isSelected = (i === currentSlotIndex);
        // 내가 클릭한 칸은 하얀색으로 밝게 빛나도록 합니다.
        var hl = isSelected
            ? 'border:2px solid #fff;box-shadow:0 0 10px rgba(255,255,255,0.5);'
            : 'border:1px solid rgba(215,179,61,0.3);';

        var slotItem = currentInvData[i];
        var imgSrc   = PH;
        var name     = '';
        var desc     = '';
        var count    = 1;

        if (slotItem && slotItem.name) {
            name   = slotItem.name;
            desc   = slotItem.desc || '';
            imgSrc = slotItem.img  || PH;
            count  = parseInt(slotItem.count, 10) || 1;
        }

        // 아이템 개수가 2개 이상일 때만 우측 상단에 뱃지를 보여줍니다.
        var countBadge = (name && count > 1)
            ? '<div style="position:absolute;top:2px;right:2px;background:#d7b33d;color:#000;font-size:12px;font-weight:bold;padding:2px 5px;border-radius:4px;z-index:99;box-shadow:0 0 3px #000;">x' + count + '</div>'
            : '';

        grid.innerHTML +=
            '<div class="inv-slot" style="cursor:pointer;width:70px!important;height:70px!important;position:relative;overflow:hidden;background:#222;' + hl + '" onclick="selectInvSlot(' + i + ')" title="' + desc + '">' +
            countBadge +
            '<img src="' + imgSrc + '" onerror="this.src=\'https://placehold.co/100?text=Error\'" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;z-index:1;">' +
            (name ? '<div style="position:absolute;bottom:0;left:0;width:100%;background:rgba(0,0,0,0.8);font-size:10px;color:#fff;text-align:center;padding:3px 0;z-index:10;">' + name + '</div>' : '') +
            '</div>';
    }
}

// 특정 칸을 클릭했을 때 하단의 편집창을 띄우는 함수입니다.
window.selectInvSlot = function (index) {
    currentSlotIndex = index;
    renderInvModalGrid();
    document.getElementById('inv-slot-form').style.display = 'block';
    document.getElementById('inv-slot-title').innerText    = (index + 1) + '번 칸 편집';

    var nIn  = document.getElementById('inv-slot-name');
    var dIn  = document.getElementById('inv-slot-desc');
    var gBtn = document.getElementById('inv-gift-btn');
    var uBtn = document.getElementById('inv-use-btn');
    document.getElementById('inv-slot-file').value = '';

    var item = currentInvData[index];
    if (item && item.name) {
        nIn.value = item.name || '';
        dIn.value = item.desc || '';
        // 아이템이 있으면 '선물하기'와 '사용하기' 버튼을 보여줍니다.
        if (gBtn) gBtn.style.display = 'inline-block';
        if (uBtn) uBtn.style.display = 'inline-block';
    } else {
        // 아이템이 없는 빈 칸이면 입력칸도 비웁니다.
        nIn.value = ''; dIn.value = '';
        if (gBtn) gBtn.style.display = 'none';
        if (uBtn) uBtn.style.display = 'none';
    }
};

// 하단 편집창에서 '적용'을 눌렀을 때 배열 데이터를 수정합니다.
window.applyInvSlot = async function () {
    var nIn  = document.getElementById('inv-slot-name').value.trim();
    var dIn  = document.getElementById('inv-slot-desc').value.trim();
    var fIn  = document.getElementById('inv-slot-file');
    var btn  = document.getElementById('inv-apply-btn');
    var PH   = (typeof PLACEHOLDER_ITEM !== 'undefined') ? PLACEHOLDER_ITEM : 'https://placehold.co/100x100';
    var imgUrl = PH;

    var currentItem = currentInvData[currentSlotIndex];
    if (fIn.files.length === 0 && currentItem && currentItem.img) imgUrl = currentItem.img;

    if (fIn.files.length > 0) {
        btn.innerText = '⏳ 외부 업로드...'; btn.disabled = true;
        var uploadedUrl = await uploadToImgbb(fIn.files[0]);
        if (uploadedUrl) imgUrl = uploadedUrl;
        btn.innerText = '적용'; btn.disabled = false;
    }

    currentInvData[currentSlotIndex] = {
        name:  nIn || '더미 아이템',
        desc:  dIn,
        img:   imgUrl,
        count: (currentItem && currentItem.count) ? parseInt(currentItem.count, 10) : 1,
        type:  (_currentInvTab === 'furniture') ? 'furniture' : 'general'
    };
    renderInvModalGrid();
};

// 휴지통 버튼(모두 비우기)을 누르면 그 칸을 통째로 날려버립니다.
window.deleteInvSlot = function () {
    if (confirm('칸을 비우시겠습니까?')) {
        currentInvData[currentSlotIndex] = null;
        renderInvModalGrid();
        document.getElementById('inv-slot-name').value = '';
        document.getElementById('inv-slot-desc').value = '';
        var gBtn = document.getElementById('inv-gift-btn');
        var uBtn = document.getElementById('inv-use-btn');
        if (gBtn) gBtn.style.display = 'none';
        if (uBtn) uBtn.style.display = 'none';
    }
};

// 포션 같은 아이템을 1개만 소모할 때 사용하는 버튼입니다.
window.useInvItemOne = async function () {
    if (currentSlotIndex < 0) return;
    var item = currentInvData[currentSlotIndex];
    if (!item || !item.name) return;
    if (!confirm('[' + item.name + '] 아이템을 1개 사용하시겠습니까?')) return;

    item.count = (parseInt(item.count, 10) || 1) - 1;
    // 개수가 0개가 되면 배열에서 아예 삭제(null) 해버립니다.
    if (item.count <= 0) {
        currentInvData[currentSlotIndex] = null;
        currentSlotIndex = -1;
        document.getElementById('inv-slot-form').style.display = 'none';
        alert('아이템을 모두 소모했습니다.');
    } else {
        alert('아이템 1개를 소모했습니다.');
    }
    renderInvModalGrid();
};

// 인벤토리 팝업 전체 저장 (서버로 전송)
window.saveInventoryToDB = async function () {
    var btn = document.getElementById('inv-save-btn');
    btn.innerText = '⏳ 저장 중...'; btn.disabled = true;

    // 소지품 탭이면 'inventory', 보관함 탭이면 'furniture_inventory' 기둥(컬럼)에 넣습니다.
    var colKey = (_currentInvTab === 'furniture') ? 'furniture_inventory' : 'inventory';
    var payload = {};
    payload[colKey] = currentInvData;

    var res = await upsertProfileData(payload);
    btn.innerText = '인벤토리 저장'; btn.disabled = false;
    if (res && res.error) alert('저장 실패');
    else { await loadCharacterData(); closeModal('inv-modal'); }
};

// ─────────────────────────────────────────────────────────────────
// 6. 우편함 (선물 보내기 및 받기)
// ─────────────────────────────────────────────────────────────────
// 다른 캐릭터에게 아이템을 보내는 팝업창 열기
window.openGiftModal = function () { document.getElementById('gift-modal').classList.add('show'); };

// 상대방 데이터베이스에 아이템을 꽂아넣는 발송 함수
window.sendGift = async function () {
    var targetCharId = document.getElementById('gift-target').value;
    var btn = document.getElementById('send-gift-btn');
    if (targetCharId === currentEditingId) return alert('자신에게 보낼 수 없습니다.');

    var itemToGift = currentInvData[currentSlotIndex];
    if (!itemToGift) return alert('보낼 아이템이 없습니다.');

    btn.innerText = '발송 중...'; btn.disabled = true;
    try {
        // 1. 상대방의 우편함 목록을 서버에서 불러옵니다.
        var fetchRes = await supabaseClient.from('character_profiles').select('mailbox')
            .eq('char_id', targetCharId).eq('phase', currentEditingPhase);

        var mb = [];
        if (fetchRes.data && fetchRes.data[0] && fetchRes.data[0].mailbox) {
            try { mb = JSON.parse(fetchRes.data[0].mailbox); } catch (e) { mb = []; }
        }
        if (!Array.isArray(mb)) mb = [];
        
        // 2. 내가 선택한 아이템을 상대 우편함 배열에 추가합니다.
        mb.push(itemToGift);

        // 3. 서버에 다시 덮어씌웁니다.
        if (fetchRes.data && fetchRes.data.length > 0) {
            await supabaseClient.from('character_profiles').update({ mailbox: mb })
                .eq('char_id', targetCharId).eq('phase', currentEditingPhase);
        } else {
            await supabaseClient.from('character_profiles')
                .insert([{ char_id: targetCharId, phase: currentEditingPhase, mailbox: mb }]);
        }

        // 4. 발송 완료 후, 내 가방에서는 그 아이템을 지웁니다.
        currentInvData[currentSlotIndex] = null;
        await upsertProfileData({ inventory: currentInvData });

        alert('우편이 발송되었습니다!');
        await loadCharacterData();
        closeModal('gift-modal');
        closeModal('inv-modal');
    } catch (err) {
        console.error(err);
        alert('발송 실패');
    }
    btn.innerText = '우편 발송하기'; btn.disabled = false;
};

// 내게 도착한 우편함을 여는 함수
window.openMailboxModal = async function (charId, phaseIndex) {
    currentEditingId    = charId;
    currentEditingPhase = phaseIndex;
    document.getElementById('mailbox-modal').classList.add('show');
    document.getElementById('mailbox-list').innerHTML = '<p style="color:#ccc;text-align:center;">조회 중...</p>';

    var res = await supabaseClient.from('character_profiles').select('mailbox')
        .eq('char_id', charId).eq('phase', phaseIndex);

    var parsedMb = [];
    if (res.data && res.data[0] && res.data[0].mailbox) {
        try { parsedMb = JSON.parse(res.data[0].mailbox); } catch (e) { parsedMb = []; }
        // 과거 버전과 호환을 위한 처리
        if (typeof res.data[0].mailbox === 'string' &&
            res.data[0].mailbox.indexOf(':') !== -1 &&
            res.data[0].mailbox.indexOf('[') === -1) {
            parsedMb = res.data[0].mailbox.split(',').filter(Boolean);
        }
    }
    currentMailboxData = Array.isArray(parsedMb) ? parsedMb : [];
    renderMailboxList();
};

// 우편함에 도착한 아이템 목록을 화면에 그립니다.
function renderMailboxList() {
    var listContainer = document.getElementById('mailbox-list');
    if (!currentMailboxData || !currentMailboxData.length) {
        listContainer.innerHTML = '<p style="color:#777;text-align:center;padding:20px 0;">우편함이 비어있습니다.</p>';
        return;
    }
    
    var PH = (typeof PLACEHOLDER_ITEM !== 'undefined') ? PLACEHOLDER_ITEM : 'https://placehold.co/100';
    listContainer.innerHTML = currentMailboxData.map(function (item, index) {
        var name = '더미 아이템', desc = '', img = PH, count = 1;
        if (typeof item === 'object' && item.name) {
            name = item.name; desc = item.desc || ''; img = item.img || PH; count = parseInt(item.count, 10) || 1;
        } else if (typeof item === 'string') {
            var p = item.split(':');
            name = p[0] || '?'; desc = p[1] || '';
            if (p.length > 2) img = p.slice(2).join(':');
        }
        var badge = count > 1
            ? '<span style="background:var(--accent-color);color:#000;padding:2px 4px;border-radius:4px;font-size:10px;font-weight:bold;margin-left:5px;">x' + count + '</span>'
            : '';
            
        // 각 편지마다 수락/거절 버튼을 달아줍니다.
        return '<div class="mail-item-card" style="display:flex;align-items:center;gap:10px;background:#222;padding:10px;border-radius:8px;border:1px solid #444;margin-bottom:10px;">' +
            '<img src="' + img + '" onerror="this.src=\'' + PH + '\'" class="mail-item-img" style="width:40px;height:40px;object-fit:cover;border-radius:4px;">' +
            '<div style="flex-grow:1;">' +
                '<div style="color:var(--accent-color);font-weight:bold;">' + name + badge + '</div>' +
                '<div style="color:#aaa;font-size:0.8rem;">' + desc + '</div>' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:5px;">' +
                '<button onclick="acceptMail(' + index + ', this)" style="background:#4caf50;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">수락</button>' +
                '<button onclick="deleteMail(' + index + ')"       style="background:#8b0000;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">거절</button>' +
            '</div>' +
            '</div>';
    }).join('');
}

// 편지를 '수락'하면 가방의 빈칸을 찾아서 아이템을 집어넣습니다.
window.acceptMail = async function (idx, btn) {
    var profile = (typeof allProfiles !== 'undefined')
        ? allProfiles.find(function (p) { return p.char_id === currentEditingId && p.phase === currentEditingPhase; })
        : null;

    var rawInv = profile ? profile.inventory : [];
    var myInv  = [];
    if (typeof rawInv === 'string') {
        try { myInv = JSON.parse(rawInv); } catch (e) { myInv = []; }
    } else if (Array.isArray(rawInv)) {
        myInv = rawInv.slice();
    }
    while (myInv.length < 20) myInv.push(null); // 배열 크기 20개 유지

    var incomingItem = currentMailboxData[idx];
    var itemName  = typeof incomingItem === 'object' ? incomingItem.name : (typeof incomingItem === 'string' ? incomingItem.split(':')[0] : null);
    var incCount  = typeof incomingItem === 'object' ? (parseInt(incomingItem.count, 10) || 1) : 1;
    var placed    = false;

    // 똑같은 아이템이 가방에 있으면 갯수만 올려줍니다.
    if (itemName) {
        for (var i = 0; i < 20; i++) {
            if (myInv[i] && myInv[i].name === itemName) {
                myInv[i].count = parseInt(myInv[i].count || 1, 10) + incCount;
                placed = true;
                break;
            }
        }
    }

    // 새로운 아이템이면 첫 번째 빈칸에 넣습니다.
    if (!placed) {
        var emptyIdx = -1;
        for (var j = 0; j < 20; j++) {
            if (myInv[j] === null || myInv[j] === '') { emptyIdx = j; break; }
        }
        if (emptyIdx === -1) return alert('🎒 가방이 꽉 찼습니다!');
        if (typeof incomingItem === 'string') {
            var p = incomingItem.split(':');
            incomingItem = { name: p[0], desc: p[1] || '', img: p.slice(2).join(':'), count: 1 };
        }
        myInv[emptyIdx] = incomingItem;
    }

    // 수락했으니 편지 목록에서는 지웁니다.
    currentMailboxData.splice(idx, 1);
    btn.innerText = '수령중..'; btn.disabled = true;

    try {
        await upsertProfileData({ inventory: myInv, mailbox: currentMailboxData });
        alert('✨ 선물을 받았습니다!');
        await loadCharacterData();
        openMailboxModal(currentEditingId, currentEditingPhase);
    } catch (e) {
        console.error(e);
        alert('수락 중 오류가 발생했습니다.');
        btn.innerText = '수락'; btn.disabled = false;
    }
};

window.deleteMail = async function (idx) {
    if (confirm('이 우편을 파기하시겠습니까?')) {
        currentMailboxData.splice(idx, 1);
        await upsertProfileData({ mailbox: currentMailboxData });
        renderMailboxList();
    }
};

// ─────────────────────────────────────────────────────────────────
// 7. 소지금(돈) 관리 팝업창
// ─────────────────────────────────────────────────────────────────
window.openMoneyModal = function (charId, phaseIndex) {
    currentEditingId    = charId;
    currentEditingPhase = phaseIndex;
    var profile = (typeof allProfiles !== 'undefined')
        ? allProfiles.find(function (p) { return p.char_id === charId && p.phase === phaseIndex; })
        : null;
    currentMoney = (profile && profile.money) ? parseInt(String(profile.money).replace(/,/g, ''), 10) || 0 : 0;
    document.getElementById('current-money-display').innerText = currentMoney.toLocaleString() + ' G';
    document.getElementById('money-amount').value = '';
    document.getElementById('money-modal').classList.add('show');
};

// 돈을 더하거나(add) 빼는(sub) 동작을 처리합니다.
window.processMoney = async function (type) {
    var amtInput = document.getElementById('money-amount');
    var amount   = parseInt(amtInput.value, 10);
    if (!amount || amount <= 0) return alert('금액을 정확히 입력해주세요.');
    if (!currentUser) return alert('로그인이 필요합니다.');

    var myCharId = charOwners[currentUser.email];
    if (!myCharId) return alert('캐릭터 권한이 없습니다.');

    try {
        var res = await supabaseClient
            .from('character_profiles').select('money')
            .eq('char_id', myCharId).eq('phase', 0).single();

        var curMoney = 0;
        if (res.data && res.data.money) {
            curMoney = parseInt(String(res.data.money).replace(/,/g, ''), 10) || 0;
        }

        var newMoney = (type === 'add') ? curMoney + amount : curMoney - amount;
        if (newMoney < 0) return alert('소지금이 부족하여 차감할 수 없습니다.');

        var upd = await upsertProfileData({ money: newMoney });

        // 데이터베이스 컬럼이 문자열(Text)이라 숫자형이 실패할 경우, 문자로 변환해 한 번 더 시도합니다.
        if (upd && upd.error && upd.error.message.includes('invalid input syntax')) {
            console.warn('숫자형 저장 실패, 문자열(Text) 타입으로 자동 재시도합니다.');
            upd = await upsertProfileData({ money: String(newMoney) });
        }

        if (upd && upd.error) {
            console.error("소지금 업데이트 실패:", upd.error);
            alert('❌ 업데이트 실패!\n사유: ' + upd.error.message + '\n\n(Supabase에 money 컬럼이 정상적으로 만들어져 있는지 확인해주세요!)');
        } else {
            alert('✨ ' + amount.toLocaleString() + ' G가 정상적으로 ' + (type === 'add' ? '적립' : '소비') + '되었습니다.');
            currentMoney = newMoney;
            document.getElementById('current-money-display').innerText = newMoney.toLocaleString() + ' G';
            amtInput.value = '';
            
            if (typeof loadCharacterData === 'function') loadCharacterData();
            closeModal('money-modal');
        }
    } catch (e) {
        console.error("소지금 통신 에러:", e);
        alert("통신 중 오류가 발생했습니다. 개발자 도구(F12) 콘솔을 확인해주세요.");
    }
};

// ─────────────────────────────────────────────────────────────────
// 8. 캐릭터 화면 내부의 인벤토리 자동 동기화 (예쁜 툴팁 적용)
// ─────────────────────────────────────────────────────────────────
var _previewTabState = {}; // 각 캐릭터가 소지품을 켜놨는지, 보관함을 켜놨는지 기억

window.switchInvPreviewTab = function (charId, tab) {
    _previewTabState[charId] = tab;
    var section = document.getElementById(charId); if (!section) return;
    
    // 버튼 색깔을 바꿔서 선택된 티를 냅니다.
    section.querySelectorAll('.inv-preview-tab-btn').forEach(function (btn) {
        var isActive = btn.getAttribute('data-tab') === tab;
        btn.style.background  = isActive ? 'rgba(215,179,61,0.25)' : 'rgba(0,0,0,0.3)';
        btn.style.color       = isActive ? '#d7b33d' : '#777';
        btn.style.fontWeight  = isActive ? '600' : '400';
    });
    
    if (typeof allProfiles === 'undefined') return;
    var p0 = allProfiles.find(function (p) {
        var pid = p.char_id.startsWith('char-') ? p.char_id : 'char-' + p.char_id;
        return pid === charId && p.phase === 0;
    });
    if (p0) _renderAllSlides(charId, p0, tab);
};

// 캐릭터의 1부~4부 모든 탭 안에 있는 인벤토리를 다시 그려줍니다.
function _renderAllSlides(charId, p0Profile, tab) {
    var section = document.getElementById(charId); if (!section) return;
    var slides  = section.querySelectorAll('.phase-slide');
    slides.forEach(function (slide) {
        var invContainer = slide.querySelector('.rpg-inventory');
        if (!invContainer) return;
        _renderInvIntoContainer(invContainer, p0Profile, tab);
    });
}

// ─────────────────────────────────────────────────────────────────
// ★ 마우스만 올려도 설명이 뜨는 '예쁜 RPG 툴팁' 적용 함수
// ─────────────────────────────────────────────────────────────────
function _renderInvIntoContainer(container, profile, tab) {
    // 1. 툴팁을 예쁘게 꾸며줄 CSS 디자인을 문서에 딱 한 번만 슬쩍 끼워넣습니다.
    if (!document.getElementById('inv-preview-tooltip-style')) {
        document.head.insertAdjacentHTML('beforeend', `
            <style id="inv-preview-tooltip-style">
                .inv-slot-hover { position: relative; overflow: visible !important; }
                .inv-tooltip-pretty {
                    position: absolute;
                    bottom: 115%; 
                    left: 50%;
                    transform: translateX(-50%) translateY(5px);
                    background: linear-gradient(180deg, rgba(20,20,20,0.98) 0%, rgba(10,10,10,0.98) 100%);
                    border: 1px solid var(--accent-color, #d7b33d);
                    padding: 10px 14px;
                    border-radius: 8px;
                    width: max-content;
                    max-width: 220px;
                    z-index: 99999;
                    opacity: 0;
                    visibility: hidden;
                    pointer-events: none;
                    box-shadow: 0 8px 20px rgba(0,0,0,0.8), inset 0 0 8px rgba(215,179,61,0.15);
                    transition: opacity 0.05s ease-out, transform 0.05s ease-out; /* 마우스를 올리면 즉시 뜨게 합니다 */
                    text-align: left;
                    line-height: 1.4;
                }
                /* 툴팁 아래쪽에 뾰족한 화살표(꼬리)를 만들어줍니다 */
                .inv-tooltip-pretty::after {
                    content: '';
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    border-width: 6px;
                    border-style: solid;
                    border-color: var(--accent-color, #d7b33d) transparent transparent transparent;
                }
                /* 마우스를 올렸을 때(hover) 툴팁이 눈에 보이게 켭니다 */
                .inv-slot-hover:hover .inv-tooltip-pretty {
                    opacity: 1;
                    visibility: visible;
                    transform: translateX(-50%) translateY(0);
                }
                /* 툴팁 안의 아이템 이름 디자인 */
                .tooltip-title {
                    color: var(--accent-color, #d7b33d);
                    display: block;
                    margin-bottom: 6px;
                    font-size: 0.95rem;
                    font-weight: 700;
                    border-bottom: 1px dashed rgba(215,179,61,0.4);
                    padding-bottom: 4px;
                    text-shadow: 0 1px 2px #000;
                }
                /* 툴팁 안의 아이템 설명 디자인 */
                .tooltip-desc { color: #ddd; font-size: 0.8rem; white-space: pre-wrap; word-break: break-word; }
            </style>
        `);
    }

    var rawSrc = (tab === 'furniture') ? profile.furniture_inventory : profile.inventory;
    var myInv  = [];
    if (typeof rawSrc === 'string') {
        try { myInv = JSON.parse(rawSrc); } catch (e) { myInv = []; }
    } else if (Array.isArray(rawSrc)) {
        myInv = rawSrc.slice();
    }
    
    // 탭에 맞춰 가구만 남길지, 가구를 버릴지 필터링합니다.
    myInv = myInv.filter(function (item) {
        if (!item) return false;
        var isFurn = item.type === 'furniture' || item.isFurniture;
        return tab === 'furniture' ? isFurn : !isFurn;
    });

    var html = '';
    for (var i = 0; i < 20; i++) {
        var item  = myInv[i];
        var name  = '', img = '', count = 1, desc = ''; 
        
        if (item && typeof item === 'object' && item.name) {
            name = item.name; img = item.img || ''; count = parseInt(item.count, 10) || 1; desc = item.desc || '';
        } else if (typeof item === 'string' && item.trim() && item.indexOf('[object') === -1) {
            var pts = item.split(':');
            name = pts[0] || '?';
            desc = pts[1] || ''; 
            img  = pts.length > 2 ? pts.slice(2).join(':') : '';
            count = 1;
        }
        
        if (name) {
            var badge = count > 1
                ? '<div style="position:absolute;top:2px;right:2px;background:var(--accent-color,#d7b33d);color:#000;font-size:10px;font-weight:bold;padding:2px 4px;border-radius:4px;z-index:5;">x' + count + '</div>'
                : '';
            var imgSrc = img || 'https://placehold.co/100?text=No+Img';
            
            // 특수문자 따옴표(")가 설명 안에 있으면 코드가 깨지므로 바꿔줍니다.
            var safeDesc = desc ? desc.replace(/"/g, '&quot;') : '설명이 없습니다.';
            // 예쁜 툴팁 상자를 조립합니다.
            var tooltipHTML = '<div class="inv-tooltip-pretty">' 
                            + '<span class="tooltip-title">[' + name + ']</span>' 
                            + '<span class="tooltip-desc">' + safeDesc + '</span>' 
                            + '</div>';
            
            html +=
                '<div class="inv-slot inv-slot-hover" style="position:relative;background:#222;border:1px solid rgba(215,179,61,0.3);aspect-ratio:1;">' +
                tooltipHTML +
                badge +
                '<img src="' + imgSrc + '" onerror="this.src=\'https://placehold.co/100?text=Error\'" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;z-index:1;">' +
                '<div style="position:absolute;bottom:0;left:0;width:100%;background:rgba(0,0,0,0.7);font-size:10px;color:#fff;text-align:center;padding:2px 0;z-index:3;">' + name + '</div>' +
                '</div>';
        } else {
            // 아무것도 없는 빈 칸
            html += '<div class="inv-slot" style="background:#111;border:1px solid rgba(215,179,61,0.3);aspect-ratio:1;"></div>';
        }
    }
    container.innerHTML = html;
}

// 화면상 인벤토리 위에 [소지품] / [보관함] 탭 버튼을 꽂아줍니다.
function _ensureInvPreviewTabs(charId) {
    var section = document.getElementById(charId); if (!section) return;
    var slides  = section.querySelectorAll('.phase-slide');
    var tab     = _previewTabState[charId] || 'general';
    
    slides.forEach(function (slide) {
        var slot = slide.querySelector('.inv-tab-slot');
        if (!slot) return;
        // 이미 버튼이 있으면 다시 만들지 않습니다.
        if (slot.querySelector('.inv-preview-tab-btn')) return; 

        var gActive = (tab === 'general');
        var btnBase = 'flex:1; padding:6px 0; font-size:0.75rem; font-family:\'Nanum Myeongjo\', serif; cursor:pointer; border:none; border-radius:20px; transition:all 0.2s ease; text-align:center; letter-spacing:1px; white-space:nowrap;';
        
        var btnG = btnBase + (gActive
            ? 'background:linear-gradient(135deg, #e5c56d, #b8952d); color:#111; font-weight:bold; box-shadow:0 1px 3px rgba(0,0,0,0.4);'
            : 'background:transparent; color:#888; font-weight:400;');
            
        var btnF = btnBase + (!gActive
            ? 'background:linear-gradient(135deg, #e5c56d, #b8952d); color:#111; font-weight:bold; box-shadow:0 1px 3px rgba(0,0,0,0.4);'
            : 'background:transparent; color:#888; font-weight:400;');

        slot.innerHTML =
            '<button class="inv-preview-tab-btn" data-tab="general"' +
            ' onclick="switchInvPreviewTab(\'' + charId + '\',\'general\')"' +
            ' style="' + btnG + '">소지품</button>' +
            '<button class="inv-preview-tab-btn" data-tab="furniture"' +
            ' onclick="switchInvPreviewTab(\'' + charId + '\',\'furniture\')"' +
            ' style="' + btnF + '">보관함</button>';
    });
}

// 모든 캐릭터의 인벤토리 화면을 데이터와 똑같이 최신화시킵니다.
window.refreshInventoryPreviews = function () {
    if (typeof allProfiles === 'undefined') return;

    var seen = {};
    allProfiles.forEach(function (profile) {
        var charId = profile.char_id.startsWith('char-') ? profile.char_id : 'char-' + profile.char_id;
        if (profile.phase !== 0) return;
        if (seen[charId]) return;
        seen[charId] = true;

        _ensureInvPreviewTabs(charId);
        var tab = _previewTabState[charId] || 'general';
        _renderAllSlides(charId, profile, tab);
    });
};

// ─────────────────────────────────────────────────────────────────
// 9. 프로그램 자동 감시 훅 (Hook) - 타이머 연결
// 초보자 안내: 뒤에서 조용히 돌면서 BGM과 인벤토리를 자동으로 맞춰주는 요정들입니다.
// ─────────────────────────────────────────────────────────────────

// 9-1. 데이터를 불러올 때 인벤토리 화면도 잊지 않고 업데이트하게 만듭니다.
var _loadCharHooked = false;
var _hookInterval = setInterval(function () {
    if (typeof window.loadCharacterData === 'function' && !_loadCharHooked) {
        _loadCharHooked = true;
        clearInterval(_hookInterval); // 감시를 끝냅니다.

        var _originalLoad = window.loadCharacterData;
        window.loadCharacterData = async function () {
            await _originalLoad.apply(this, arguments); // 원래 하던 일(데이터 불러오기)을 하고
            window.refreshInventoryPreviews();         // 인벤토리 화면도 새로고침 시킵니다.
        };
    }
}, 200);

// 9-2. 메뉴 탭을 누를 때마다 시간대(Phase)에 맞는 BGM을 틀도록 조작합니다.
var _openTabHooked = false;
var _bgmHookInterval = setInterval(function () {
    if (typeof window.openTab === 'function' && !_openTabHooked) {
        _openTabHooked = true;
        clearInterval(_bgmHookInterval);
        
        var _originalOpenTab = window.openTab;
        window.openTab = function (tabName, btn) {
            // 원래 하던 일(탭 전환)을 먼저 실행합니다.
            _originalOpenTab.apply(this, arguments);
            
            // 만약 클릭한 탭이 캐릭터 화면이라면?
            if (tabName.startsWith('char-')) {
                var targetPhase = window.globalMainPhase || 0; 
                
                // 캐릭터 탭이 바뀔 때, 애니메이션이 꼬이지 않도록 아주 짧은 시간(0.05초)을 기다렸다가 부(Phase)를 맞춥니다.
                setTimeout(function() {
                    var section = document.getElementById(tabName);
                    if (section) {
                        var phaseBtns = section.querySelectorAll('.phase-tabs > .phase-btn');
                        if (phaseBtns.length > targetPhase) {
                            var targetBtn = phaseBtns[targetPhase];
                            if (typeof window.changePhase === 'function') {
                                window.changePhase(targetBtn, targetPhase);
                            }
                        }
                    }
                }, 50);

                // 설정된 1부, 2부 등에 맞춰서 BGM 음악을 가져옵니다.
                if (typeof allProfiles !== 'undefined') {
                    var profile = allProfiles.find(function(p) { 
                        var pid = p.char_id.startsWith('char-') ? p.char_id : 'char-' + p.char_id;
                        return pid === tabName && p.phase === targetPhase; 
                    });
                    
                    if (profile && typeof setupCharacterBGM === 'function') {
                        setupCharacterBGM(profile.bgm_url);
                    } else if (typeof setupCharacterBGM === 'function') {
                        setupCharacterBGM(''); // 음악이 설정되어 있지 않으면 끕니다.
                    }
                }
            } else {
                // 다른 메뉴(대문, 상점 등)로 나갔을 때는 BGM 플레이어를 숨깁니다.
                if (typeof setupCharacterBGM === 'function') setupCharacterBGM('');
            }
        };
    }
}, 200);
