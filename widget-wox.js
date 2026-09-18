(function () {
    // ─── KILL SWITCH ─────────────────────────────────────────────────────────────
    // Backend segue ativo independente desta flag.
    // Para desligar o provador no front: mudar para true (e dar deploy no github.io/shopifycand).
    var PROVADOR_OFF = false;

    function toJpeg(file){return new Promise(function(res){try{var img=new Image();var u=URL.createObjectURL(file);img.onload=function(){URL.revokeObjectURL(u);var w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;if(!w||!h){res(file);return;}var sc=Math.min(1,1280/Math.max(w,h));var cw=Math.round(w*sc),ch=Math.round(h*sc);var c=document.createElement('canvas');c.width=cw;c.height=ch;c.getContext('2d').drawImage(img,0,0,cw,ch);c.toBlob(function(b){res(b||file);},'image/jpeg',0.92);};img.onerror=function(){URL.revokeObjectURL(u);res(file);};img.src=u;}catch(e){res(file);}});}

    function isValidBRPhone(nums) {
        function setErr(msg) {
            var el = document.getElementById('q-phone-error');
            if (el) el.textContent = msg;
        }
        if (nums.length < 10) { setErr('N\u00famero incompleto — informe DDD + n\u00famero'); return false; }
        if (nums.length > 11) { setErr('N\u00famero longo demais'); return false; }
        if (!/^[1-9][1-9]/.test(nums)) { setErr('DDD inv\u00e1lido'); return false; }
        if (nums.length === 11 && nums[2] !== '9') { setErr('Celular deve come\u00e7ar com 9 ap\u00f3s o DDD'); return false; }
        var local = nums.length === 11 ? nums.slice(3) : nums.slice(2);
        if (/^(\d)\1+$/.test(local)) { setErr('N\u00famero n\u00e3o parece real — confira'); return false; }
        if (/(\d)\1{5,}/.test(local)) { setErr('N\u00famero n\u00e3o parece real — confira'); return false; }
        // so 1-2 digitos distintos = fake (99996666, 54545454, 56565656)
        if (new Set(local).size <= 2) { setErr('N\u00famero n\u00e3o parece real — confira'); return false; }
        if (/^(?:01234567|12345678|23456789|34567890|98765432|87654321|76543210|0123456789|1234567890)/.test(local)) { setErr('N\u00famero n\u00e3o parece real — confira'); return false; }
        return true;
    }


    // ─── SEO BACKLINK BADGE (mini logo discreto pro crawler do Google) ───
    (function() {
        function injectPLBadge() {
            try {
                if (PROVADOR_OFF) return;
                if (document.querySelector('.pl-seo-badge')) return;
                var path = window.location.pathname;
                var isProduct = (document.querySelector('meta[property="og:type"][content="product"]') && /\/products\/[^\/?#]+/.test(path));
                if (!isProduct) return;
                var b = document.createElement('div');
                b.className = 'pl-seo-badge';
                b.style.cssText = 'text-align:center;padding:4px 0;margin:0;opacity:0.5;line-height:1;';
                var a = document.createElement('a');
                a.href = 'https://provoulevou.com.br?utm_source=widget&utm_medium=lojista&utm_campaign=wox';
                a.target = '_blank';
                a.rel = 'noopener';
                a.title = 'Experimente Óculos Online — Provou Levou';
                a.style.cssText = 'display:inline-block;text-decoration:none;border:0;outline:0;';
                var img = document.createElement('img');
                img.src = 'https://i.ibb.co/MD3B4FQf/Logo-provou-preto-1.png';
                img.alt = 'Experimente Óculos Online — Provou Levou';
                img.style.cssText = 'height:12px;width:auto;border:0;display:block;';
                a.appendChild(img);
                b.appendChild(a);
                document.body.appendChild(b);
            } catch(e) {}
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectPLBadge);
        else injectPLBadge();
        setTimeout(injectPLBadge, 2500);
    })();


    // ===============================================
    // 0. CHUMBAR A API KEY AQUI DIRETO NO CÓDIGO
    // ===============================================
    const apiKey = "32085c5df012ad473a5c4d8afa541d2aa8786441a3e25b84e1bfa78996be4c24";
    window.PROVOU_LEVOU_API_KEY = apiKey;

    const WEBHOOK_PROVA = 'https://n8n.segredosdodrop.com/webhook/gerador-oculos';
    const WEBHOOK_PIX = 'https://n8n.segredosdodrop.com/webhook/cacife-pix';
    const WEBHOOK_PIX_STATUS = 'https://n8n.segredosdodrop.com/webhook/cacife-pix-status';
    const WEBHOOK_CHECK_LIMIT = 'https://n8n.segredosdodrop.com/webhook/wox-check-limit';
    const SIZES_TOP = ['XXP', 'XP', 'P', 'M', 'G', 'XG', 'XXG', '3XG', '4XG', '5XG'];
    const SIZES_BOTTOM = ['36/XXP', '38/XP', '40/P', '42/M', '44/G', '46/XG', '48/XXG', '50/3XG', '52/4XG', '54/5XG'];
    const SIZES_BOTTOM_SW = ['XXP', 'XP', 'P', 'M', 'G', 'XG', 'XXG', '3XG', '4XG', '5XG'];


    const GRADE = {
        regular: [49, 51, 54, 57, 61, 62, 64, 66, 70, 73],
        oversized: [58, 60, 62, 64, 66, 70, 73, 76, 79, 83],
        oversizedSS: [58, 61, 63, 67, 70, 74, 78, 82, 87, 92],
        hoodie: [50, 53, 55, 58, 62, 65, 69, 74, 79, 83],
        boxyHoodie: [61, 77, 78, 79, 80, 81, 82, 83, 84, 85],
        puffer: [53, 56, 59, 61, 70, 74, 78, 82, 86, 90],
        vest: [52, 55, 57, 59, 63, 66, 70, 72, 76, 82],
        boxyHenley: [54, 56, 58, 64, 66, 68, 70, 76, 78, 84],
        bottomTailoring: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54],
        bottomSweat: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54],
        underwear: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54],
        quadrilTailoring: [48, 50, 52, 56, 58, 60, 62, 64, 66, 68],
        quadrilSweat: [48, 50, 52, 54, 56, 58, 60, 62, 64, 66],
        quadrilUnderwear: [50, 52, 54, 56, 58, 60, 62, 64, 66, 68],
    };


    function detectProduct(name) {
        const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (/tailoring/.test(n) || /\d\/\d\s*short/.test(n) || /\b(1\/5|2\/5|3\/5|4\/5)\b/.test(n)) return { category: 'bottom', fit: 'tailoring' };
        if (/underwear|cueca/.test(n)) return { category: 'bottom', fit: 'underwear' };
        if (/sweatpant|sweatshort|sweat pant|sweat short|calca|bermuda/.test(n)) return { category: 'bottom', fit: 'sweat' };
        if (/henley/.test(n)) return { category: 'top', fit: 'boxyHenley' };
        if (/boxy.*(hoodie|crewneck|crew)/.test(n) || /(hoodie|crewneck|crew).*boxy/.test(n)) return { category: 'top', fit: 'boxyHoodie' };
        if (/puffer|jacket/.test(n)) return { category: 'top', fit: 'puffer' };
        if (/vest/.test(n)) return { category: 'top', fit: 'vest' };
        if (/(hoodie|hoodie zip|half zip|crewneck|crew neck)/.test(n) && !/oversized|boxy|short sleeve/.test(n)) return { category: 'top', fit: 'hoodie' };
        if (/oversized.*(hoodie|crewneck|crew|short sleeve)/.test(n) || /short sleeve.*(hoodie|crewneck)/.test(n)) return { category: 'top', fit: 'oversizedSS' };
        if (/oversized|boxy tee|2\/4/.test(n)) return { category: 'top', fit: 'oversized' };
        return { category: 'top', fit: 'regular' };
    }


    function estimarTorax(altura, peso) {
        if (altura < 3) altura *= 100;
        let circ = 0.65 * peso + 56;
        const imc = peso / Math.pow(altura / 100, 2);
        if (imc > 30) circ += 4; else if (imc > 25) circ += 2;
        return circ;
    }


    function findClosest(arr, val) {
        let idx = 0, minDiff = Infinity;
        arr.forEach((v, i) => { const d = Math.abs(v - val); if (d < minDiff) { minDiff = d; idx = i; } });
        return idx;
    }


    let recommendedSize = 'M';
    let currentProduct = { category: 'top', fit: 'regular' };

    function calculateFinalSize() {
        // Feature desativada: não faz mais cálculos de tamanho
        return;
    }


    // ─── LOCK / UNLOCK SCROLL DA PÁGINA ──────────────────────────────────────────


    let scrollY = 0;


    function lockBodyScroll() {
        scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.overflowY = 'scroll';
    }


    function unlockBodyScroll() {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflowY = '';
        window.scrollTo(0, scrollY);
    }


    // ─── ESTILOS ──────────────────────────────────────────────────────────────────


    const styles = `
        /* ── Fontes ── */

        :root {
            --c-bg: #ffffff;
            --c-surface: #f7f6f4;
            --c-ink: #111111;
            --c-muted: #999;
            --c-line: #e8e8e8;
            --c-accent: #111111;
            --c-danger: #cc3333;
            --font-display: inherit;
            --font-body: inherit;
        }

        /* ── Trigger (selo sobre foto) ── */
        @keyframes q-shake { 0%,50%,100%{transform:rotate(0deg)} 10%,30%{transform:rotate(-10deg)} 20%,40%{transform:rotate(10deg)} }
        .q-btn-trigger-ia {
            position: absolute; top: 14px; right: 14px; z-index: 100;
            background: none; border: none; padding: 0; cursor: pointer;
            width: 70px; height: 70px;
            display: flex; align-items: center; justify-content: center;
            filter: drop-shadow(0 3px 10px rgba(0,0,0,0.22));
            animation: q-shake 3s infinite;
            transition: filter 0.2s;
        }
        .q-btn-trigger-ia:hover { filter: drop-shadow(0 6px 18px rgba(0,0,0,0.32)); }
        .q-btn-trigger-ia img { width: 100%; height: 100%; object-fit: contain; opacity: 1 !important; }
        @media (min-width: 768px) { .q-btn-trigger-ia { width: 70px; height: 70px; } }

        /* ── Inline button ── */
        .q-btn-inline-provador {
            display: flex; align-items: center; justify-content: center; gap: 7px;
            width: 100%; padding: 13px 16px;
            background: transparent; color: var(--c-ink);
            border: 1.5px solid var(--c-ink); border-radius: 25px;
            font-family: 'Work Sans', var(--font-body), sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;
            cursor: pointer; transition: background 0.25s, color 0.25s;
            margin-bottom: 10px; box-sizing: border-box;
        }
        .q-btn-inline-provador:hover { background: var(--c-ink); color: #fff; }
        .q-btn-inline-provador svg { width: 14px; height: 14px; flex-shrink: 0; }

        /* ── Modal overlay ── */
        @keyframes q-modal-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        #q-modal-ia {
            display: none; position: fixed; inset: 0; z-index: 999999;
            background: rgba(240,238,235,0.96);
            font-family: var(--font-body);
            overflow-y: auto; box-sizing: border-box;
        }
        #q-modal-ia * { box-sizing: border-box; }

        /* ── Card ── */
        .q-card-ia {
            width: 100%; min-height: 100vh;
            background: var(--c-bg); color: var(--c-ink);
            display: flex; flex-direction: column; position: relative;
            animation: q-modal-in 0.35s cubic-bezier(0.22,1,0.36,1);
        }
        @media (min-width: 768px) {
            #q-modal-ia { display: none; align-items: center; justify-content: center; }
            .q-card-ia {
                width: 440px; max-width: 92vw; min-height: auto;
                max-height: 96vh; border: none;
                box-shadow: 0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06);
                overflow: hidden;
            }
        }

        /* ── Close ── */
        .q-close-ia {
            position: absolute; top: 18px; right: 18px;
            background: none; border: none;
            font-size: 20px; font-weight: 300; color: var(--c-muted);
            cursor: pointer; z-index: 10; line-height: 1; padding: 4px 6px;
            transition: color 0.2s;
        }
        .q-close-ia:hover { color: var(--c-ink); }

        /* ── Content scroll ── */
        .q-content-scroll {
            flex: 1; padding: 0; overflow-y: auto;
            text-align: left; display: flex; flex-direction: column;
        }
        .q-content-scroll::-webkit-scrollbar { width: 3px; }
        .q-content-scroll::-webkit-scrollbar-thumb { background: var(--c-line); }

        @media (max-width: 767px) {
            #q-modal-ia { display:none; overflow-y:auto; align-items:flex-start; justify-content:center; }
            #q-modal-ia[style*="flex"] { display:flex !important; }
            .q-card-ia { width:100%; border:none; margin:0; min-height:100svh; }
            .q-content-scroll { flex: 1; }
        }

        /* ── Header strip ── */
        #q-header-provador {
            padding: 28px 28px 0;
            display: flex; flex-direction: column; align-items: center;
            text-align: center; gap: 10px;
            border-bottom: 1px solid var(--c-line);
            padding-bottom: 22px; margin-bottom: 0;
        }
        #q-header-provador h1 {
            margin: 0;
            font-family: var(--font-display);
            font-size: 22px; letter-spacing: 4px;
            color: var(--c-ink); text-transform: uppercase;
            font-weight: 400; line-height: 1;
        }

        /* ── Main step ── */
        #q-step-photo {
            display: flex; flex-direction: column; padding: 28px 28px 32px;
            gap: 0; align-items: stretch;
        }

        /* ── Labels & inputs ── */
        .q-field-label {
            display: block; font-size: 10px; font-weight: 600;
            letter-spacing: 2px; text-transform: uppercase;
            color: var(--c-muted); margin-bottom: 8px;
        }
        .q-phone-wrap { margin-bottom: 28px; }
        .q-input {
            display: block; width: 100%; height: 52px;
            padding: 0 16px; margin: 0;
            background: var(--c-surface); border: 1.5px solid transparent;
            border: 1.5px solid var(--c-line); border-radius: 14px;
            font-size: 16px; font-family: var(--font-body); font-weight: 400;
            color: var(--c-ink); outline: none;
            -webkit-appearance: none; appearance: none; transition: border-color 0.2s;
        }
        .q-input:focus { border-color: var(--c-ink); background: #fff; }
        .q-input::placeholder { color: #bbb; }

        .q-provas-msg:empty { display: none; }
        .q-provas-msg {
            font-size: 13px; margin-top: 10px; letter-spacing: 0.3px;
            color: var(--c-ink); font-weight: 500;
            background: var(--c-surface);
            border: 1px solid var(--c-line);
            border-radius: 6px;
            padding: 10px 14px;
            text-align: center;
            transition: background 0.2s, color 0.2s, border-color 0.2s;
        }
        .q-provas-msg.is-warn {
            color: var(--c-danger);
            background: rgba(204,51,51,0.08);
            border-color: rgba(204,51,51,0.3);
            font-weight: 600;
        }

        .q-status-msg {
            display: none; font-size: 11px; color: var(--c-danger);
            font-weight: 500; margin-top: 6px; letter-spacing: 0.3px;
        }

        /* ── Section label ── */
        .q-section-label {
            font-family: var(--font-display);
            font-size: 16px; letter-spacing: 3px; text-transform: uppercase;
            color: var(--c-ink); margin: 0 0 14px; font-weight: 400;
            text-align: center;
        }

        /* ── Tip ── */
        .q-tip-box {
            display: flex; align-items: center; gap: 9px;
            background: var(--c-surface);
            padding: 11px 14px; margin-bottom: 20px;
            font-size: 11.5px; color: var(--c-muted); line-height: 1.45;
            border-radius: 6px;
        }
        .q-tip-box i { color: var(--c-ink); font-size: 15px; flex-shrink: 0; }
        /* ── Required field marker + shake feedback ── */
        .q-required-mark { color: var(--c-danger); font-weight: 700; margin-left: 4px; }
        @keyframes q-shake-x {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
            20%, 40%, 60%, 80% { transform: translateX(6px); }
        }
        .q-shake { animation: q-shake-x 0.5s cubic-bezier(.36,.07,.19,.97); }
        .q-input.is-error {
            border-color: var(--c-danger) !important;
            background: rgba(204,51,51,0.06) !important;
            box-shadow: 0 0 0 3px rgba(204,51,51,0.15);
        }
        .q-face-frame.is-error {
            outline: 3px solid var(--c-danger);
            outline-offset: 2px;
            background: rgba(204,51,51,0.06);
        }
        .q-validation-hint {
            display: none;
            background: var(--c-danger);
            color: #fff;
            font-size: 13px; font-weight: 600;
            letter-spacing: 0.3px;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 12px;
            text-align: center;
            box-shadow: 0 3px 10px rgba(204,51,51,0.25);
            animation: q-pop-in 0.25s ease;
        }
        .q-validation-hint.is-visible { display: block; }
        @keyframes q-pop-in {
            0% { opacity: 0; transform: translateY(-6px); }
            100% { opacity: 1; transform: translateY(0); }
        }


        /* ── Face frame ── */
        @keyframes q-frame-pulse { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
        .q-face-frame {
            position: relative; width: 200px; height: 260px;
            margin: 0 auto 24px; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            overflow: hidden; background: var(--c-surface);
            border-radius: 4px;
            transition: transform 0.2s;
        }
        .q-face-frame:hover { transform: scale(1.015); }
        .q-face-frame img { width: 100%; height: 100%; object-fit: cover; display: none; }
        /* Câmera ao vivo (getUserMedia) */
        .q-cam-overlay { position: fixed; inset: 0; z-index: 2147483646; background: #000; display: none; align-items: center; justify-content: center; }
        .q-cam-overlay.is-open { display: flex; }
        .q-cam-video { width: 100%; height: 100%; object-fit: cover; }
        .q-cam-overlay.is-front .q-cam-video { transform: scaleX(-1); }
        .q-cam-controls { position: absolute; bottom: 24px; left: 0; right: 0; display: flex; align-items: center; justify-content: center; gap: 28px; }
        .q-cam-shutter { width: 68px; height: 68px; border-radius: 50%; background: #fff; border: 4px solid rgba(255,255,255,.55); cursor: pointer; box-shadow: 0 2px 12px rgba(0,0,0,.45); padding: 0; }
        .q-cam-shutter:active { transform: scale(.93); }
        .q-cam-mini { width: 46px; height: 46px; border-radius: 50%; background: rgba(0,0,0,.5); color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 22px; line-height: 1; }
        .q-cam-close { position: absolute; top: 14px; right: 14px; }
        .q-face-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .q-face-placeholder i { font-size: 72px; color: #d0d0d0; }
        /* Corner marks — clean editorial style */
        .q-face-corner {
            position: absolute; width: 20px; height: 20px;
            border-color: var(--c-ink); border-style: solid;
            transition: border-color 0.2s;
        }
        .q-face-corner-tl { top: 0; left: 0; border-width: 2px 0 0 2px; }
        .q-face-corner-tr { top: 0; right: 0; border-width: 2px 2px 0 0; }
        .q-face-corner-bl { bottom: 0; left: 0; border-width: 0 0 2px 2px; }
        .q-face-corner-br { bottom: 0; right: 0; border-width: 0 2px 2px 0; }

        /* ── Upload buttons ── */
        .q-upload-btns {
            display: grid; grid-template-columns: 1fr 1fr;
            gap: 8px; width: 100%; margin-bottom: 24px;
        }
        .q-upload-btn {
            display: flex; align-items: center; justify-content: center; gap: 7px;
            padding: 12px 8px;
            border: 1.5px solid var(--c-line);
            background: transparent; color: var(--c-ink);
            font-family: var(--font-body); font-size: 12px; font-weight: 500;
            cursor: pointer; transition: border-color 0.2s, background 0.2s; border-radius: 14px;
        }
        .q-upload-btn:hover { border-color: var(--c-ink); background: var(--c-surface); }
        .q-upload-btn i { font-size: 16px; }

        /* ── Terms ── */
        .q-terms-row {
            display: flex; align-items: center; gap: 8px;
            font-size: 10px !important; color: var(--c-muted); cursor: pointer;
            line-height: 1.35 !important; margin-bottom: 14px;
            justify-content: center; text-align: center;
        }
        .q-terms-row span { font-size: 10px !important; line-height: 1.35 !important; }
        .q-terms-row input { width: 13px; height: 13px; margin-top: 0; cursor: pointer; accent-color: var(--c-ink); flex-shrink: 0; }
        .q-terms-row a { color: var(--c-ink); text-decoration: underline; text-underline-offset: 2px; font-size: 10px !important; }

        /* ── CTA buttons ── */
        .q-btn-black {
            width: 100%; height: 52px;
            background: var(--c-ink); color: #fff;
            border: none; border-radius: 14px;
            font-family: var(--font-display); font-size: 14px;
            letter-spacing: 3px; text-transform: uppercase;
            cursor: pointer; transition: opacity 0.2s; box-sizing: border-box;
        }
        .q-btn-black:hover:not(:disabled) { opacity: 0.82; }
        .q-btn-black:disabled { background: #ccc; cursor: not-allowed; }
        .q-btn-outline {
            width: 100%; height: 52px;
            background: transparent; color: var(--c-ink);
            border: 1.5px solid var(--c-line); border-radius: 14px;
            font-family: var(--font-display); font-size: 14px;
            letter-spacing: 3px; text-transform: uppercase;
            cursor: pointer; transition: border-color 0.2s, background 0.2s; box-sizing: border-box;
        }
        .q-btn-outline:hover { border-color: var(--c-ink); background: var(--c-surface); }

        /* ── PIX screen ── */
        #q-step-pix {
            display: none; text-align: center;
            padding: 36px 28px; flex-direction: column; gap: 16px; align-items: center;
        }
        #q-step-pix h2 {
            font-family: var(--font-display); font-size: 19px;
            letter-spacing: 3px; text-transform: uppercase; margin: 0; font-weight: 400;
        }
        .q-pix-subtitle { font-size: 13px; color: var(--c-muted); margin: 0; line-height: 1.6; }
        .q-pix-qr { width: 180px; height: 180px; border: 1px solid var(--c-line); padding: 6px; margin: 0 auto; }
        .q-pix-qr img { width: 100%; height: 100%; }
        .q-pix-copiacola { display: flex; gap: 8px; width: 100%; max-width: 320px; margin: 0 auto; }
        .q-pix-copiacola input {
            flex: 1; height: 40px; padding: 0 12px; border: 1px solid var(--c-line);
            background: var(--c-surface); font-size: 11px; font-family: var(--font-body);
            outline: none; min-width: 0;
        }
        .q-pix-copiacola button {
            height: 40px; padding: 0 14px; background: var(--c-ink); color: #fff;
            border: none; font-size: 10px; font-weight: 600; letter-spacing: 1px;
            text-transform: uppercase; cursor: pointer;
        }
        .q-pix-status { font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--c-muted); }
        @keyframes q-pix-pulse { 0%,100%{opacity:.4} 50%{opacity:1} }
        .q-pix-waiting { animation: q-pix-pulse 1.5s infinite ease-in-out; color: #d97706; }
        .q-pix-approved { color: #16a34a; }
        .q-pix-cancel { font-size: 11px; color: var(--c-muted); text-decoration: underline; cursor: pointer; margin-top: 4px; }

        /* ── Loading ── */
        @keyframes q-slide { from{transform:translateX(-100%)} to{transform:translateX(100%)} }
        @keyframes q-alt-show { 0%,5%{opacity:0;transform:translateY(6px)} 15%,45%{opacity:1;transform:translateY(0)} 55%,100%{opacity:0;transform:translateY(-6px)} }
        @keyframes q-alt-hide { 0%,55%{opacity:0;transform:translateY(6px)} 65%,95%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-6px)} }
        #q-loading-box {
            display: none; padding: 28px;
            text-align: center; flex: 1; flex-direction: column;
            align-items: center; justify-content: center; min-height: 60vh;
        }
        .q-loading-texts {
            position: relative; height: 36px; width: 100%;
            display: flex; align-items: center; justify-content: center;
            margin-bottom: 24px;
        }
        .q-loading-t1, .q-loading-t2 {
            position: absolute; width: 100%;
            display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .q-loading-t1 {
            font-family: var(--font-display); font-size: 15px; letter-spacing: 4px;
            text-transform: uppercase; color: var(--c-ink);
            animation: q-alt-show 3.6s ease-in-out infinite;
        }
        .q-loading-t2 {
            animation: q-alt-hide 3.6s ease-in-out infinite;
            text-decoration: none; opacity: 0;
        }
        .q-loading-t2 span {
            font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
            color: var(--c-muted); font-family: var(--font-body);
        }
        .q-loading-t2 img { height: 12px; width: auto; opacity: 0.7; }
        .q-loading-bar { height: 3px; background: var(--c-line); width: 100%; position: relative; overflow: hidden; border-radius: 2px; }
        .q-loading-bar > div {
            position: absolute; top: 0; left: 0; height: 100%; width: 100%;
            background: var(--c-ink); border-radius: 2px;
            transform: scaleX(0); transform-origin: left;
            transition: transform 0.3s ease-out;
        }

        /* ── Result ── */
        #q-step-result { display: none; flex-direction: column; gap: 0; align-items: stretch; }

        .q-res-title {
            display: block;
            font-family: var(--font-display); font-size: 15px;
            letter-spacing: 3px; text-transform: uppercase;
            color: var(--c-ink); padding: 20px 28px 16px; margin: 0;
            border-bottom: 1px solid var(--c-line);
            text-align: center;
        }
        .q-res-subtitle, .q-res-note { display: none; }

        #q-result-img-col {
            width: 100%; max-height: 56vh; background: var(--c-surface);
            overflow: hidden; display: flex; align-items: center; justify-content: center;
        }
        #q-result-img-col img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }

        #q-result-actions-col {
            display: flex; flex-direction: column; gap: 8px;
            padding: 20px 28px 26px;
        }
        .q-res-mobile-only { margin: 0; }

        /* CTA de compra na tela de resultado */
        .q-result-prodinfo { text-align: left; margin-bottom: 6px; }
        .q-result-prodname {
            font-family: var(--font-body); font-size: 20px; font-weight: 700;
            color: var(--c-ink); line-height: 1.25; margin-bottom: 6px;
        }
        .q-result-prodprice {
            font-family: var(--font-display); font-size: 28px; letter-spacing: .5px; font-weight: 700;
            color: var(--c-ink); line-height: 1;
        }
        .q-result-installment {
            font-family: var(--font-body); font-size: 12px; color: var(--c-muted);
            margin-top: 4px; letter-spacing: .2px;
        }
        .q-scarcity {
            margin-top: 12px; font-family: var(--font-body); font-size: 13px; font-weight: 700;
            color: var(--c-danger); letter-spacing: 1.5px; text-transform: uppercase;
            display: flex; align-items: center; justify-content: flex-start; gap: 6px;
        }
        .q-scarcity i { font-size: 15px; }
        /* Selos de segurança */
        .q-seals {
            display: flex; justify-content: flex-start; gap: 30px;
            margin: 8px 0; padding: 12px 0;
            border-top: 1px solid var(--c-line); border-bottom: 1px solid var(--c-line);
        }
        .q-seal { display: flex; align-items: center; gap: 9px; }
        .q-seal > i { font-size: 24px; color: var(--c-ink); flex-shrink: 0; }
        .q-seal span {
            font-family: var(--font-body); font-size: 12px; font-weight: 700;
            text-transform: uppercase; letter-spacing: .6px; line-height: 1.25;
            color: var(--c-ink); text-align: left;
        }
        .q-fakebuy {
            position: fixed; left: 18px; bottom: 18px; z-index: 2147483000;
            background: var(--c-bg, #fff); color: var(--c-ink); border: 1px solid var(--c-line); border-radius: 10px;
            box-shadow: 0 8px 28px -6px rgba(0,0,0,.28); padding: 11px 14px;
            display: flex; align-items: center; gap: 10px; max-width: 290px;
            font-family: var(--font-body); opacity: 0; transform: translateY(14px);
            pointer-events: none; transition: opacity .35s ease, transform .35s ease;
        }
        .q-fakebuy.show { opacity: 1; transform: translateY(0); }
        .q-fakebuy > i { font-size: 22px; color: var(--c-ink); flex-shrink: 0; }
        .q-fakebuy strong { font-size: 12.5px; font-weight: 700; }
        .q-fakebuy > div { display: flex; flex-direction: column; line-height: 1.35; }
        .q-fakebuy span { font-size: 10.5px; color: var(--c-muted); }
        @media (max-width:560px){ .q-fakebuy{ left:12px; right:12px; bottom:12px; max-width:none; } }
        .q-btn-buy-now {
            background: var(--c-ink); color: #fff; border: 1px solid var(--c-ink);
            width: 100%; padding: 17px 18px; font-family: var(--font-body);
            font-weight: 700; font-size: 15px; letter-spacing: .2px; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            border-radius: 14px; transition: .2s; line-height: 1.2;
        }
        .q-btn-buy-now:hover { opacity: .88; }
        .q-btn-buy-now .q-buy-price { font-weight: 800; white-space: nowrap; }
        .q-buy-trust {
            text-align: center; font-size: 11px; color: var(--c-muted);
            margin-top: 2px; letter-spacing: .2px;
        }

        /* ── Related products ── */
        #q-related-products { padding: 0 28px 28px; }
        #q-related-products h4 {
            font-family: var(--font-display); font-size: 13px;
            letter-spacing: 3px; text-transform: uppercase;
            color: var(--c-muted); margin: 20px 0 12px; font-weight: 400;
        }
        .q-related-grid {
            display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px;
            -webkit-overflow-scrolling: touch;
        }
        .q-related-grid::-webkit-scrollbar { display: none; }
        .q-related-card {
            flex: 0 0 calc(33.333% - 7px); min-width: 88px;
            text-decoration: none; color: var(--c-ink);
            display: flex; flex-direction: column; gap: 6px;
        }
        .q-related-card img {
            width: 100%; aspect-ratio: 1/1; object-fit: cover;
            border: 1px solid var(--c-line); display: block; border-radius: 3px;
        }
        .q-related-card-name {
            font-size: 10px; font-weight: 500; line-height: 1.4; color: var(--c-ink);
            overflow: hidden; display: -webkit-box;
            -webkit-line-clamp: 2; -webkit-box-orient: vertical;
        }

        /* Desktop result split */
        @media (min-width: 768px) {
            .q-card-ia.is-result { width: 780px !important; max-width: 90vw !important; max-height: 92vh !important; }
                /* .q-powered-footer always visible */
            .q-card-ia.is-result .q-content-scroll {
                padding: 0 !important; overflow-y: auto !important;
                display: flex !important; flex-direction: column !important;
            }
            .q-card-ia.is-result #q-step-result {
                display: flex !important; flex-direction: row !important;
                flex-wrap: wrap !important; width: 100%; align-items: stretch; gap: 0;
            }
            .q-card-ia.is-result .q-res-title {
                flex-basis: 100%; order: -1;
                font-size: 16px; letter-spacing: 3px;
                padding: 16px 24px; border-bottom: 1px solid var(--c-line);
            }
            .q-card-ia.is-result #q-result-img-col {
                width: 44% !important; min-height: 360px !important;
                border-right: 1px solid var(--c-line); flex-shrink: 0;
            }
            .q-card-ia.is-result #q-result-img-col img {
                width: 100% !important; height: 100% !important;
                object-fit: cover !important; object-position: top center !important;
            }
            .q-card-ia.is-result #q-result-actions-col {
                width: 56% !important; padding: 28px 24px !important;
                display: flex !important; flex-direction: column !important;
                justify-content: flex-start; gap: 10px;
                overflow-y: auto;
            }
            .q-card-ia.is-result #q-related-products { padding: 0; margin-top: 4px; }
            .q-card-ia.is-result .q-res-mobile-only { display: flex !important; }
        }

        /* ── Error screen ── */
        #q-step-error {
            display: none; flex-direction: column; gap: 20px;
            align-items: center; text-align: center;
            padding: 52px 28px;
        }
        #q-step-error h2 {
            font-family: var(--font-display); font-size: 18px;
            letter-spacing: 3px; text-transform: uppercase; margin: 0; font-weight: 400;
        }
        #q-step-error p { font-size: 13px; color: var(--c-muted); margin: 0; line-height: 1.6; }

        /* ── Footer ── */
        .q-powered-footer {
            background: var(--c-surface); padding: 14px 20px;
            display: flex; align-items: center; justify-content: center; gap: 9px;
            flex-shrink: 0; border-top: 1px solid var(--c-line); text-decoration: none;
        }
        .q-powered-footer span { font-size: 9.5px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--c-muted); }
        .q-quantic-logo { height: 13px !important; width: auto !important; max-width: none !important; object-fit: contain; flex: 0 0 auto; opacity: 0.7; }
    `;


    // ─── IMAGEM DO BOTÃO (trigger) ─────────────────────────────────────────────
    const stampImageHTML = `<img src="https://cdn.shopify.com/s/files/1/0636/6334/1746/files/logo_provador.png?v=1772494793" alt="Provador Virtual" style="width:100%;height:100%;object-fit:contain;opacity:1;">`;



    // ─── HTML ─────────────────────────────────────────────────────────────────────


    const html = `
        <div id="q-modal-ia">
            <div class="q-card-ia">
                <button type="button" class="q-close-ia" id="q-close-btn">&times;</button>
                <div class="q-content-scroll">

                    <!-- Persistent header (all steps) -->
                    <div id="q-header-provador">
                        <h1>Provador Virtual</h1>
                    </div>

                    <!-- Main step -->
                    <div id="q-step-photo">
                        <!-- WhatsApp -->
                        <div class="q-phone-wrap">
                            <span class="q-field-label">Seu WhatsApp<span class="q-required-mark">*</span></span>
                            <input type="tel" id="q-phone" class="q-input" placeholder="(11) 99999-9999" maxlength="15">
                            <div id="q-phone-error" class="q-status-msg">N&#250;mero inv&#225;lido</div>
                            <div id="q-provas-restantes" class="q-provas-msg"></div>
                        </div>

                        <!-- Photo section -->
                        <p class="q-section-label">Envie sua foto</p>
                        <div class="q-tip-box">
                            <i class="ph ph-lightbulb"></i>
                            <span>Use uma foto n&#237;tida, de frente, com boa ilumina&#231;&#227;o.</span>
                        </div>

                        <!-- Face frame -->
                        <div class="q-face-frame" id="q-face-frame">
                            <div class="q-face-corner q-face-corner-tl"></div>
                            <div class="q-face-corner q-face-corner-tr"></div>
                            <div class="q-face-corner q-face-corner-bl"></div>
                            <div class="q-face-corner q-face-corner-br"></div>
                            <img id="q-pre-img" alt="Sua foto">
                            <div class="q-face-placeholder" id="q-face-placeholder">
                                <i class="ph ph-user-circle" style="font-size:80px;color:#d4d4d4;"></i>
                            </div>
                        </div>

                        <!-- Upload buttons -->
                        <div class="q-upload-btns">
                            <button class="q-upload-btn" id="q-btn-camera">
                                <i class="ph ph-camera"></i> Tirar foto
                            </button>
                            <button class="q-upload-btn" id="q-btn-gallery">
                                <i class="ph ph-image"></i> Da galeria
                            </button>
                            <input type="file" id="q-camera-input" accept="image/*" capture="user" style="display:none">
                            <input type="file" id="q-gallery-input" accept="image/*" style="display:none">
                        </div>

                        <!-- Terms -->
                        <label class="q-terms-row">
                            <input type="checkbox" id="q-accept-terms">
                            <span>Concordo com os <a href="http://provoulevou.com.br/termos.html" target="_blank">Termos e Condi&#231;&#245;es</a></span>
                        </label>

                        <div id="q-validation-hint" class="q-validation-hint"></div>
                        <button class="q-btn-black" id="q-btn-generate">Provar &#243;culos</button>
                    </div>

                    <!-- PIX -->
                    <div id="q-step-pix">
                        <h2>Prova Extra</h2>
                        <p class="q-pix-subtitle">Limite de 3 provas atingido.<br>Pague R$1 via PIX para mais uma:</p>
                        <p style="font-size: 11px; color: var(--c-muted); margin: 8px 0 0; line-height: 1.5; text-align: center;">&#8505;&#65039; Cobran&#231;a feita pela Provou Levou, n&#227;o pela loja</p>
                        <div class="q-pix-qr"><img id="q-pix-qr-img" alt="QR Code PIX"></div>
                        <div class="q-pix-copiacola">
                            <input type="text" id="q-pix-code" readonly placeholder="C&#243;digo PIX...">
                            <button id="q-pix-copy-btn">Copiar</button>
                        </div>
                        <div id="q-pix-status-msg" class="q-pix-status q-pix-waiting">Aguardando pagamento...</div>
                        <p class="q-pix-cancel" id="q-pix-cancel">Cancelar</p>
                    </div>

                    <!-- Loading -->
                    <div id="q-loading-box">
                        <div class="q-loading-texts">
                            <div class="q-loading-t1">Gerando sua prova...</div>
                            <a href="https://provoulevou.com.br?utm_source=widget&utm_medium=lojista&utm_campaign=wox" target="_blank" class="q-loading-t2">
                                <span>Powered by</span>
                                <img src="https://i.ibb.co/MD3B4FQf/Logo-provou-preto-1.png" alt="Provou Levou">
                            </a>
                        </div>
                        <div class="q-loading-bar"><div></div></div>
                    </div>

                    <!-- Resultado -->
                    <div id="q-step-result">
                        <span class="q-res-title">Veja como ficou em voc&ecirc;</span>
                        <div id="q-result-img-col">
                            <img id="q-final-view-img">
                        </div>
                        <div id="q-result-actions-col">
                            <div class="q-fakebuy" id="q-fakebuy"></div>
                            <div class="q-result-prodinfo" id="q-result-prodinfo" style="display:none;">
                                <div class="q-result-prodname" id="q-result-prodname"></div>
                                <div class="q-result-prodprice" id="q-result-prodprice"></div>
                                <div class="q-result-installment" id="q-result-installment"></div>
                                <div class="q-scarcity" id="q-scarcity" style="display:none;"><i class="ph-bold ph-fire"></i> APENAS <strong id="q-scarcity-n"></strong>&nbsp;UNIDADES RESTANTES</div>
                            </div>
                            <div class="q-seals" id="q-seals" style="display:none;">
                                <div class="q-seal"><i class="ph-fill ph-shield-check"></i><span>Compra<br>Segura</span></div>
                                <div class="q-seal"><i class="ph-fill ph-lock-key"></i><span>Pagamento<br>Seguro</span></div>
                            </div>
                            <button class="q-btn-buy-now" id="q-btn-buy-now" style="display:none;">Comprar Agora</button>
                            <button class="q-btn-outline" id="q-retry-btn" style="margin-top:10px;">Provar outra foto</button>
                            <div id="q-related-products" style="display:none;">
                                <h4>Veja tamb&eacute;m</h4>
                                <div class="q-related-grid" id="q-related-grid"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Erro -->
                    <div id="q-step-error">
                        <h2>ALTA DEMANDA</h2>
                        <p>Aguarde alguns segundos para tentar novamente.</p>
                        <button class="q-btn-outline" id="q-error-back">Voltar ao Produto</button>
                        <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(0,0,0,.08);"><p style="font-size:12px;color:var(--c-muted);margin:0 0 8px;">Continua com problema? Fale direto com a Provou Levou:</p><a href="https://wa.me/5511938034714?text=Ol%C3%A1!%20Tive%20um%20problema%20ao%20usar%20o%20provador." target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:7px;background:#25D366;color:#fff;border-radius:10px;padding:10px 18px;font-family:inherit;font-weight:700;font-size:13px;text-decoration:none;"><svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.9c0 2.1.55 4.06 1.6 5.8L2 22l4.44-1.65a9.9 9.9 0 0 0 5.6 1.72h.01c5.46 0 9.9-4.45 9.9-9.9C21.95 6.45 17.5 2 12.04 2zm5.8 14.15c-.24.68-1.4 1.3-1.94 1.34-.5.05-1.13.07-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.8-4.17-4.94-4.36-.15-.19-1.18-1.57-1.18-2.99 0-1.42.75-2.12 1.01-2.41.27-.29.58-.36.77-.36l.55.01c.18.01.42-.07.66.5.24.59.83 2.04.9 2.18.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.75 1.24 1.62 2.01 1.11.99 2.05 1.3 2.34 1.44.29.15.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.39-.24.66-.14.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.12.07.71-.17 1.39z"/></svg> Falar com a Provou Levou</a></div>
                    </div>

                </div>
                <a href="https://provoulevou.com.br?utm_source=widget&utm_medium=lojista&utm_campaign=wox" target="_blank" class="q-powered-footer">
                    <span>Powered by</span>
                    <img src="https://i.ibb.co/MD3B4FQf/Logo-provou-preto-1.png" class="q-quantic-logo" alt="Provou Levou">
                </a>
            </div>
        </div>
    `;


    // ─── CTA DE COMPRA NO RESULTADO ───────────────────────────────────────────────

    // Caminho do checkout da Nuvemshop. Se na loja o checkout direto não abrir,
    // troque para '/comprar/' por '/carrinho' (1 linha) — é o único ponto a validar ao vivo.
    var Q_CHECKOUT_URL = '/cart';

    function getMainPrice() {
        // Wox (tema custom): preço de VENDA é .price-item__group.price (compare-at é price-item--regular).
        var _woxP = document.querySelector('.price-item__group.price:not(.compare-at-price)');
        if (_woxP) { var _wt = (_woxP.textContent || '').replace(/pre[çc]o (promocional|normal)/ig, '').replace(/\s+/g, ' ').trim(); if (_wt && /\d/.test(_wt)) return _wt; }
        // 0) Shopify (tema usecand etc.): pega o preço COM DESCONTO (on-sale), não o compare-at/cheio.
        //    Sem isso, querySelector('.product__price') pegava o 1º (preço riscado) e mostrava o dobro.
        var saleEl = document.querySelector('.product__price.on-sale, .product-price.on-sale, .product-price--sale, .price-item--sale, .price__sale .price-item--sale');
        if (saleEl) {
            var st = (saleEl.textContent || '').replace(/\s+/g, ' ').trim();
            if (st && /\d/.test(st)) return st;
        }
        // 1) preço exibido na página (vários temas Nuvemshop)
        var sel = '.js-price-display, [data-product-price], .product__price .price, .product__price, .price-item--regular, .js-product-price, .price-display';
        var el = document.querySelector(sel);
        if (el) {
            var t = (el.getAttribute('data-product-price') || el.textContent || '').trim();
            if (t && /\d/.test(t)) {
                // normaliza "R$ 289,00" / "28900" -> "R$ 289,00"
                if (/^\d+$/.test(t)) { var n = (parseInt(t,10)/100).toFixed(2).replace('.',','); return 'R$ ' + n; }
                return t.replace(/\s+/g,' ');
            }
        }
        // 2) fallback: data-variants do produto principal (mesmo formato dos "Veja também")
        var dv = document.querySelector('[data-variants]');
        if (dv) {
            try { var v = JSON.parse(dv.getAttribute('data-variants'))[0]; if (v && v.price_short) return v.price_short; } catch (e) {}
        }
        return '';
    }

    function findStoreBuyBtn() {
        return document.querySelector('.js-addtocart, .btn-add-to-cart, .add-to-cart, button[name="add"], [data-component="product.add-to-cart"], button[type="submit"].js-addtocart, .wox-btn:not(.wox-btn--ghost)');
    }

    // Acha o form de produto real (o que tem o input add_to_cart = product_id)
    function getProductForm() {
        var f = document.getElementById('product_form');
        if (f && f.querySelector('input[name="add_to_cart"]')) return f;
        var inp = document.querySelector('input[name="add_to_cart"]');
        if (inp && inp.closest('form')) return inp.closest('form');
        return document.querySelector('form.js-product-form, form.product-single__form, form[action*="/cart/add"]');
    }

    // Compra de verdade: submete uma CÓPIA do form do produto (POST real).
    // A Nuvemshop só adiciona ao carrinho via POST — o GET antigo abria o
    // carrinho vazio. O clone não tem o AJAX do tema, então faz POST nativo:
    // servidor adiciona o item e redireciona pro carrinho JÁ com o produto.
    function buyNow() {
        // Tracking: registra o clique em "Comprar Agora" (marca carrinho_adicionado na prova)
        try {
            var _tp = (document.getElementById('q-phone') || {}).value || '';
            var _td = (document.querySelector('h1.product__title,.product-single__title,h1') || {}).innerText || document.title || '';
            fetch('https://n8n.segredosdodrop.com/webhook/pl-provador-buy-click', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: _tp, origin: location.origin, produto: _td }) }).catch(function () {});
        } catch (e) {}
        var src = getProductForm();
        if (src) {
            var clone = document.createElement('form');
            clone.method = 'post';
            clone.action = src.getAttribute('action') || '/comprar/';
            clone.style.display = 'none';
            src.querySelectorAll('input, select, textarea').forEach(function (el) {
                if (!el.name) return;
                if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) return;
                var h = document.createElement('input');
                h.type = 'hidden'; h.name = el.name; h.value = el.value;
                clone.appendChild(h);
            });
            if (!clone.querySelector('[name="quantity"]')) {
                var q = document.createElement('input');
                q.type = 'hidden'; q.name = 'quantity'; q.value = '1';
                clone.appendChild(q);
            }
            document.body.appendChild(clone);
            clone.submit();
            return;
        }
        // Fallback: botão nativo da loja
        var sb = findStoreBuyBtn();
        if (sb) { try { sb.click(); } catch (e) {} }
    }

    // Escassez — número estável por produto (não muda a cada refresh)
    function scarcityCount(name) {
        var h = 5381, s = String(name || '');
        for (var i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
        var FLOOR = 8, _st = 10 + (h % 4);   // estoque inicial por produto (10..13)
            var _dn = new Date(), _df = (_dn.getHours() * 60 + _dn.getMinutes()) / 1440;
            var _q = _st - Math.floor(_df * 5);   // cai ao longo do dia
            return _q < FLOOR ? FLOOR : _q;        // piso 8
    }
    // Notificações de compra (prova social)
    var Q_FAKE_NAMES = ['Ana C.','Carlos M.','Mariana S.','João P.','Beatriz R.','Pedro A.','Juliana F.','Lucas T.','Fernanda L.','Rafael O.','Camila N.','Bruno G.','Larissa D.','Gabriel V.','Patrícia H.','Thiago B.','Aline M.','Rodrigo S.','Vanessa P.','Felipe C.','Letícia M.','Marcos A.'];
    var Q_FAKE_WHEN = ['agora mesmo','há 1 minuto','há 2 minutos','há 4 minutos','há 6 minutos','há 9 minutos','há 12 minutos'];
    var _fakeBuyTimer = null;
    function _showFakeBuy() {
        var step = document.getElementById('q-step-result');
        var el = document.getElementById('q-fakebuy');
        if (!el || !step || step.style.display === 'none') return;
        var nm = Q_FAKE_NAMES[Math.floor(Math.random() * Q_FAKE_NAMES.length)];
        var wh = Q_FAKE_WHEN[Math.floor(Math.random() * Q_FAKE_WHEN.length)];
        el.innerHTML = '<i class="ph-fill ph-shopping-bag"></i><div><span style="font-size:12.5px;color:var(--c-ink);"><strong>' + nm + '</strong> comprou este produto</span><span>' + wh + ' &middot; compra verificada</span></div>';
        el.classList.add('show');
        clearTimeout(el._hideT);
        el._hideT = setTimeout(function () { el.classList.remove('show'); }, 4500);
    }
    function startFakeBuy() {
        stopFakeBuy();
        setTimeout(_showFakeBuy, 3000);
        _fakeBuyTimer = setInterval(_showFakeBuy, 12000);
    }
    function stopFakeBuy() {
        if (_fakeBuyTimer) { clearInterval(_fakeBuyTimer); _fakeBuyTimer = null; }
        var el = document.getElementById('q-fakebuy'); if (el) el.classList.remove('show');
    }

    // Parcelamento — o MESMO da pagina: pega a MAIOR parcela do produto ("em ate Nx de R$ X").
    // Le do data-variants (mesma fonte do preco). installments_data vem como STRING JSON aninhada.
    function getInstallment() {
        // Shopify (tema usecand): o tema já renderiza "Em até 10x de R$ X" no .precoParcela.
        var pp = document.querySelector('.precoParcela, .textoContSemValor');
        if (pp) {
            var pt = (pp.textContent || '').replace(/\s+/g, ' ').trim();
            if (/\dx\s*de\s*R\$/i.test(pt)) return pt;
        }
        // Nuvemshop: le do data-variants (mesma fonte do preco). installments_data = STRING JSON aninhada.
        var dv = document.querySelector('[data-variants]');
        if (!dv) return '';
        try {
            var v = JSON.parse(dv.getAttribute('data-variants'))[0];
            var idata = v.installments_data;
            if (!idata) return '';
            if (typeof idata === 'string') idata = JSON.parse(idata);
            var plans = idata[Object.keys(idata)[0]];
            if (!plans) return '';
            var best = null;
            Object.keys(plans).forEach(function (k) {
                var n = parseInt(k, 10);
                var p = plans[k];
                if (n >= 2 && p.installment_value > 0) {
                    var free = p.without_interests === true;
                    if (!best || (free && !best.free) || (free === best.free && n > best.n)) best = { n: n, val: p.installment_value, free: free };
                }
            });
            if (best) return best.n + 'x de R$ ' + Number(best.val).toFixed(2).replace('.', ',');
        } catch (e) {}
        return '';
    }

    function populateBuyCta() {
        var btn = document.getElementById('q-btn-buy-now');
        var trust = document.getElementById('q-seals');
        if (!btn) return;
        // Nome + valor do produto acima do botão
        var price = getMainPrice();
        var prodName = (document.querySelector('h1.product__title,.product-single__title,h1') || {}).innerText || document.title || '';
        var info = document.getElementById('q-result-prodinfo');
        var nameEl = document.getElementById('q-result-prodname');
        var priceEl = document.getElementById('q-result-prodprice');
        if (nameEl) nameEl.textContent = (prodName || '').trim();
        if (priceEl) priceEl.textContent = price || '';
        // Wox: só nome + valor no resultado — sem parcelamento e sem escassez.
        var instEl = document.getElementById('q-result-installment');
        if (instEl) { instEl.textContent = ''; instEl.style.display = 'none'; }
        if (info && ((prodName || '').trim() || price)) info.style.display = 'block';
        var sc = document.getElementById('q-scarcity');
        if (sc) sc.style.display = 'none';
        // Notificações de compra: desativadas em todos os provadores
        btn.style.display = 'flex';
        if (trust) trust.style.display = 'flex';
        btn.onclick = buyNow;
    }


    // ─── INIT ─────────────────────────────────────────────────────────────────────


    function init() {
        // --- FILTRO DE CATEGORIA (HAT) ---
        const productNameNormalized = (document.querySelector('h1.product__title,.product-single__title,h1')?.innerText || document.title).toUpperCase();
        if (productNameNormalized.includes('HAT')) {
            return;
        }

        // Phosphor Icons — carregado lazily na primeira abertura do modal
        // (não carrega na init para não impactar o tempo de carregamento da página)

        const styleTag = document.createElement('style');
        styleTag.textContent = styles;
        document.head.appendChild(styleTag);

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = html;
        document.body.appendChild(modalContainer);

        // Usa a MESMA FONTE da loja no provador (em vez de Bebas Neue / DM Sans)
        try {
            var _bodyF = getComputedStyle(document.body).fontFamily;
            var _h = document.querySelector('h1.product__title,.product-single__title,h1,h2');
            var _headF = _h ? getComputedStyle(_h).fontFamily : _bodyF;
            var _root = document.documentElement;
            if (_bodyF) _root.style.setProperty('--font-body', _bodyF);
            if (_headF) _root.style.setProperty('--font-display', _headF);
        } catch (e) {}


        // ── Botão imagem PNG ──
        const openBtn = document.createElement('button');
        openBtn.className = 'q-btn-trigger-ia';
        openBtn.id = 'q-open-ia';
        openBtn.setAttribute('aria-label', 'Abrir Provador Virtual');
        // Selo como BACKGROUND do botão (não <img>): imune às regras do tema que escondem
        // imagens da galeria (display:none / opacity:0 do lazyload). Antes, ancorado no
        // frame da galeria, a <img> do selo herdava display:none do tema e sumia.
        openBtn.style.backgroundImage = "url('https://cdn.shopify.com/s/files/1/0636/6334/1746/files/logo_provador.png?v=1772494793')";
        openBtn.style.backgroundSize = 'contain';
        openBtn.style.backgroundPosition = 'center';
        openBtn.style.backgroundRepeat = 'no-repeat';


        const imgContainers = ['.product__main-photos', '.product__photos', '.product__photo-container', '.product__photo', '.js-product-slide', '.product-image-column', '.js-swiper-product', '[data-store^="product-image-"]', '.product__media-wrapper', '.product-gallery__media', '.product__media', '.product-image-main', '.product-media-container', '[data-media-id]', '.product__media-item', '.product-gallery', '.product-single__media', '.media-gallery', '.wxp-main', '.wxp-wrap'];

        function tryPlaceTriggerBtn() {
            // Acha a imagem de PRODUTO (dentro de container de galeria, quadrada, fora de banner/hero).
            const BAD = '[class*="background-media"],[class*="banner"],[class*="hero"],[class*="newsletter"],[class*="slideshow__"],header,footer,[class*="logo"],[class*="rte"]';
            const GOOD = '.product-image-main, .image-wrap, .product__main-photos, .product__photos, .product__photo, .product__media, .product-single__media, [class*="product"][class*="photo"], [class*="product"][class*="media"], [class*="product"][class*="image"], .wxp-main, .wxp-wrap';
            // Containers de slide ativo (carrossel): Flickity/Swiper/genérico. O selo TEM que ir no slide
            // que aparece primeiro, não no maior — senão fica preso num slide oculto e some na 1ª foto.
            const ACTIVE = '.is-selected, .is-active, .swiper-slide-active, [class*="starting-slide"], [class*="active-slide"]';
            // Container ESTÁVEL da galeria (não troca quando o usuário passa as fotos): ancoramos o selo aqui.
            const STABLE = '.flickity-viewport, .swiper-container, .swiper, .swiper-wrapper, [class*="slideshow"]';
            let best = null, bestScore = -Infinity, bestHost = null;
            for (const img of document.querySelectorAll('img')) {
                const r = img.getBoundingClientRect();
                if (r.width < 180 || r.height < 180) continue;          // ignora thumbs/ícones
                const ar = r.width / r.height;
                if (ar > 2.1 || ar < 0.45) continue;                    // descarta banners (largos/altos demais)
                const src = (img.currentSrc || img.src || '').toLowerCase();
                if (/logo|icon|sprite|payment|selo|badge|provador/.test(src)) continue;
                if (img.closest(BAD)) continue;                         // descarta banner/hero/header
                const host = img.closest(GOOD);
                if (!host) continue;                                    // só imagem dentro de container de PRODUTO
                const area = r.width * r.height;
                // pontuação: slide ATIVO domina; depois mais à ESQUERDA (1ª foto do carrossel); depois maior área.
                const inActive = img.closest(ACTIVE) ? 1 : 0;
                const score = inActive * 1e13 - r.left * 1e6 + area;
                if (score > bestScore) { bestScore = score; best = img; bestHost = host; }
            }
            if (best && bestHost) {
                // Ancora no frame ESTÁVEL da galeria se existir (carrossel), senão no container da imagem.
                const anchor = best.closest(STABLE) || bestHost;
                if (window.getComputedStyle(anchor).position === 'static') anchor.style.position = 'relative';
                anchor.appendChild(openBtn);
                return true;
            }
            return false;
        }

        if (!tryPlaceTriggerBtn()) {
            // Lazyload: espera a foto carregar e ganhar tamanho (poll até ~15s). SEM fallback no canto.
            let _tries = 0;
            const _iv = setInterval(() => {
                if (tryPlaceTriggerBtn() || ++_tries > 30) clearInterval(_iv);
            }, 500);
        }
        // Auto-correção contínua: o tema da Wox (wxp/wxps) carrega a foto tarde e re-renderiza.
        // Se o selo sumir/ficar 0px/desconectar, recoloca — não depende do timing da 1ª carga.
        function _ensureSelo() {
            try { if (!openBtn.isConnected || openBtn.offsetWidth === 0) tryPlaceTriggerBtn(); } catch (e) {}
        }
        setInterval(_ensureSelo, 1500);


        const modal = document.getElementById('q-modal-ia');

        // ── Botão inline acima do botão de compra ──
        const inlineBtn = document.createElement('button');
        inlineBtn.className = 'q-btn-inline-provador';
        inlineBtn.type = 'button';

        const inlineSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        inlineSvg.setAttribute('viewBox', '0 0 24 24');
        inlineSvg.setAttribute('width', '18');
        inlineSvg.setAttribute('height', '18');
        inlineSvg.setAttribute('fill', 'none');
        inlineSvg.setAttribute('stroke', 'currentColor');
        inlineSvg.setAttribute('stroke-width', '1.5');
        inlineSvg.setAttribute('stroke-linecap', 'round');
        inlineSvg.setAttribute('stroke-linejoin', 'round');
        const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path1.setAttribute('d', 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2');
        const circle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle1.setAttribute('cx', '12');
        circle1.setAttribute('cy', '7');
        circle1.setAttribute('r', '4');
        inlineSvg.appendChild(path1);
        inlineSvg.appendChild(circle1);
        inlineBtn.appendChild(inlineSvg);

        const inlineBtnText = document.createTextNode('Provador Virtual');
        inlineBtn.appendChild(inlineBtnText);

        inlineBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const prodName = document.querySelector('h1.product__title,.product-single__title,h1')?.innerText || document.title;
            applyProduct(detectProduct(prodName));
            populateImageSelector();
            openModal();
        });

        // Posiciona acima do botão de compra, herdando o MESMO design/tamanho do tema
        const buyBtn = document.querySelector('.js-addtocart, .btn-add-to-cart, [data-component="product.add-to-cart"], button[name="add"], .product-form__submit, .wox-btn:not(.wox-btn--ghost)');
        if (buyBtn) {
            // Herda as classes do tema (MESMO TAMANHO do botão de compra).
            inlineBtn.className = (buyBtn.className ? buyBtn.className + ' ' : '') + 'q-provador-trigger';
            // Inline + !important: maior prioridade do CSS -> vence qualquer regra do tema no elemento.
            inlineBtn.style.setProperty('background', '#fff', 'important');
            inlineBtn.style.setProperty('background-color', '#fff', 'important');
            inlineBtn.style.setProperty('background-image', 'none', 'important');
            inlineBtn.style.setProperty('color', '#000', 'important');
            inlineBtn.style.setProperty('border', '1.5px solid #111', 'important');
            inlineBtn.style.setProperty('box-shadow', 'none', 'important');
            inlineBtn.style.setProperty('display', 'flex', 'important');
            inlineBtn.style.setProperty('align-items', 'center', 'important');
            inlineBtn.style.setProperty('justify-content', 'center', 'important');
            inlineBtn.style.setProperty('gap', '8px', 'important');
            inlineBtn.style.marginBottom = '10px';
            inlineBtn.style.setProperty('cursor', 'pointer', 'important');
            // pseudo-elementos do tema (não dá inline) -> <style> com especificidade dobrada
            if (!document.getElementById('q-provador-btn-style')) {
                var _st = document.createElement('style');
                _st.id = 'q-provador-btn-style';
                _st.textContent = '.q-provador-trigger.q-provador-trigger::before,.q-provador-trigger.q-provador-trigger::after{background:none !important;background-color:transparent !important;background-image:none !important;box-shadow:none !important;border:0 !important;opacity:0 !important;content:none !important;}.q-provador-trigger svg{width:18px !important;height:18px !important;flex:0 0 auto;}';
                document.head.appendChild(_st);
            }
            buyBtn.parentNode.insertBefore(inlineBtn, buyBtn);
        } else {
            const variantsContainer = document.querySelector('.js-product-variants, .product-form__buttons, product-form');
            if (variantsContainer) {
                variantsContainer.parentNode.insertBefore(inlineBtn, variantsContainer);
            }
        }
        const genBtn      = document.getElementById('q-btn-generate');
        const nextBtn     = null; // single-step flow — no next button
        const phoneStep   = null;
        const photoStep   = document.getElementById('q-step-photo');
        const uploadStep  = photoStep; // alias for PIX/error refs

        const closeBtn    = document.getElementById('q-close-btn');
        const backBtn     = document.getElementById('q-btn-back');
        const retryBtn    = document.getElementById('q-retry-btn');
        const cameraInput = document.getElementById('q-camera-input');
        const galleryInput= document.getElementById('q-gallery-input');
        const phoneInput  = document.getElementById('q-phone');
        const preImg      = document.getElementById('q-pre-img');
        const facePlaceholder = document.getElementById('q-face-placeholder');

        // keep realInput alias so PIX code still works
        const realInput   = galleryInput;

        let userPhoto = null;
        let pixPaymentId = null;
        let selectedProductImgUrl = '';

        // Upgrade Nuvemshop CDN URLs to 1024px version
        function upgradeImgUrl(url) {
            // (1) http:// numa página https = mixed-content bloqueado; força https.
            // (2) {width} = placeholder do lazyload do Shopify (data-srcset) que às vezes vem
            //     antes do lazysizes reescrever -> a URL 404 e a prova sai SEM imagem de produto.
            //     Substitui por um tamanho real pra a imagem resolver.
            url = String(url || '').replace(/^http:\/\//i, 'https://').replace(/\{width\}/g, '1200');
            if (url.includes('mitiendanube.com') || url.includes('nuvemshop.com')) {
                return url.replace(/-\d+-\d+\.webp/, '-1024-1024.webp');
            }
            // Shopify CDN: o tema serve variantes pequenas/placeholder. Pega a foto grande:
            // tira o sufixo de tamanho (_400x400) -> master, preserva ?v= e força width=1200.
            if (url.indexOf('cdn.shopify.com') !== -1 || url.indexOf('/cdn/shop/') !== -1) {
                var parts = url.split('?');
                var base = parts[0].replace(/_(\d+)x(\d+)?(\.[a-z]{3,4})$/i, '$3');
                var vm = (parts[1] || '').match(/(?:^|&)(v=\d+)/);
                return base + '?width=1200' + (vm ? '&' + vm[1] : '');
            }
            return url;
        }

        // ─── SHOPIFY: imagem da VARIANTE (COR) selecionada ──────────────────────────
        // BUG corrigido: no Shopify a galeria carrega as fotos de TODAS as cores em ordem
        // fixa no DOM, então pegar imgs[1]/face-detect mandava SEMPRE a 1ª cor, mesmo
        // quando o cliente trocava a variante. Aqui lemos a variante realmente selecionada
        // (?variant= na URL / [name="id"]) e usamos o featured_image DELA via o endpoint
        // /products/{handle}.js (cacheado). Se falhar, cai no comportamento antigo.
        var _plProductJsonCache = null;
        function _plSelectedVariantId() {
            try { var u = new URLSearchParams(location.search).get('variant'); if (u) return u; } catch (e) {}
            var el = document.querySelector('form[action*="/cart/add"] [name="id"]:checked')
                  || document.querySelector('form[action*="/cart/add"] select[name="id"]')
                  || document.querySelector('[name="id"]:checked')
                  || document.querySelector('select[name="id"]')
                  || document.querySelector('form[action*="/cart/add"] [name="id"]')
                  || document.querySelector('[name="id"]');
            return (el && el.value) ? el.value : '';
        }
        async function selectedVariantImgUrl() {
            try {
                var vid = _plSelectedVariantId();
                if (!vid) return '';
                if (!_plProductJsonCache) {
                    var path = location.pathname.split('?')[0].replace(/\/$/, '');
                    var res = await fetch(path + '.js', { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' });
                    if (res.ok) _plProductJsonCache = await res.json();
                }
                var prod = _plProductJsonCache;
                if (!prod || !prod.variants) return '';
                var v = prod.variants.filter(function (x) { return String(x.id) === String(vid); })[0];
                var src = v && v.featured_image && v.featured_image.src;
                if (!src) return '';
                if (src.indexOf('//') === 0) src = 'https:' + src;
                return upgradeImgUrl(String(src).replace(/^http:\/\//i, 'https://'));
            } catch (e) { return ''; }
        }

        // Temas Shopify põem a foto real no srcset (o src é placeholder/lazy-load). Pega a maior.
        function largestSrc(img) {
            var ss = img.getAttribute('srcset') || img.getAttribute('data-srcset') || '';
            if (!ss) return '';
            var best = '', bestW = -1;
            ss.split(',').forEach(function (p) {
                var seg = p.trim().split(/\s+/);
                var u = seg[0], w = parseInt((seg[1] || '').replace(/\D/g, '')) || 0;
                if (u && w >= bestW) { bestW = w; best = u; }
            });
            return best;
        }

        function extractImages() {
            const containersSelectors = '.product__main-photos, .product__photos, .js-product-slide, .product-image-column, .js-swiper-product, [data-store^="product-image-"], .product__media-wrapper, .product-gallery__media, .product__media, .product-image-main, .product-media-container, [data-media-id], .product__media-item, .product-gallery, .product-single__media, .media-gallery, [data-component="product.gallery"], .swiper-slide:not(.swiper-slide-duplicate), .slider-wrapper, .wxp-main';
            const possibleContainers = Array.from(document.querySelectorAll(containersSelectors));
            let imgEls = [];
            possibleContainers.forEach(c => {
                if (!c.closest('#q-modal-ia')) {
                    const foundImgs = c.querySelectorAll('img');
                    imgEls.push(...Array.from(foundImgs));
                }
            });
            let uniqueImgs = [];
            imgEls.forEach(img => {
                let src = largestSrc(img) || img.dataset?.src || img.getAttribute('data-src') || img.src;

                if (src && src.includes('data:image')) {
                    // NÃO cair pro href da <a> às cegas: em muitos temas o link é a PÁGINA
                    // do produto (HTML), não a foto — isso ia pro gerador como "image/jpeg",
                    // o Gemini rejeitava com 400 "Unable to process input image" e a prova
                    // virava "ALTA DEMANDA". Só aceita o href se ele for mesmo uma imagem.
                    const parentA = img.closest('a');
                    const ah = (parentA && parentA.href && !parentA.href.includes('javascript:')) ? parentA.href : '';
                    if (ah && /\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i.test(ah)) {
                        src = ah;
                    } else if (img.getAttribute('data-srcset')) {
                        src = img.getAttribute('data-srcset').split(',')[0].trim().split(' ')[0];
                    }
                }

                if (!src || src.includes('data:image')) return;

                const lowerSrc = src.toLowerCase();
                const invalidKeywords = ['provador', 'logo', 'provoulevou', 'icon', 'play', 'video', 'transparent', 'placeholder', 'blank', 'spacer'];
                if (invalidKeywords.some(kw => lowerSrc.includes(kw))) return;

                // Filter out tiny images (1x1 pixels, spacers, etc.)
                if (img.naturalWidth > 0 && img.naturalWidth < 50) return;
                if (img.naturalHeight > 0 && img.naturalHeight < 50) return;

                let cleanSrc = src.split('?')[0].replace(/-\d+-\d+\.webp|_\d+x\d+/, '');

                // Upgrade to 1024px version
                src = upgradeImgUrl(src);

                if (!uniqueImgs.some(u => u.split('?')[0].replace(/-\d+-\d+\.webp|_\d+x\d+/, '') === cleanSrc)) {
                    uniqueImgs.push(src);
                }
            });
            if (uniqueImgs.length === 0) {
                const og = document.querySelector('meta[property="og:image"]')?.content;
                if (og) uniqueImgs.push(upgradeImgUrl(og));
            }
            return uniqueImgs.slice(0, 4);
        }

        function populateImageSelector() {
            const imgs = extractImages();
            const group = document.getElementById('q-photo-selector-group');
            if (group) group.style.display = 'none';
            // Cand: a foto principal de referência é a 2ª da página (a 1ª costuma ser
            // banner/lifestyle, não o óculos limpo). Fallback pra 1ª se só houver uma.
            // OBS: isso é só o DEFAULT — a detecção de rosto (startFaceDetect) sobrescreve
            // selectedProductImgUrl pela foto do óculos NO ROSTO quando encontra uma.
            selectedProductImgUrl = imgs[0] || imgs[1] || '';
        }

        // ── Detecção de rosto ──────────────────────────────────────────────
        // O óculos no rosto de uma modelo é a melhor referência, mas vem em posição
        // variável (2ª, 3ª...). Aqui varremos as primeiras fotos da galeria do produto
        // e escolhemos a 1ª que tem rosto como foto PRINCIPAL. Roda no navegador:
        // FaceDetector nativo (Chromium) e, se não houver, MediaPipe via CDN (cross-browser).
        // Se nada detectar (ou o detector falhar), mantém o default acima — sem regressão.
        var faceDetectPromise = null;
        var _faceDet = null, _faceDetTried = false;
        async function getFaceDetector() {
            if (_faceDetTried) return _faceDet;
            _faceDetTried = true;
            try {
                if ('FaceDetector' in window) { _faceDet = { native: new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 }) }; return _faceDet; }
            } catch (e) {}
            try {
                var vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs');
                var fileset = await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm');
                var det = await vision.FaceDetector.createFromOptions(fileset, {
                    baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite' },
                    runningMode: 'IMAGE'
                });
                _faceDet = { mp: det };
            } catch (e) { _faceDet = null; }
            return _faceDet;
        }
        function _loadCorsImg(url) {
            return new Promise(function (resolve) {
                var img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = function () { resolve(img); };
                img.onerror = function () { resolve(null); };
                img.src = url;
            });
        }
        async function _imgHasFace(det, img) {
            try {
                if (det.native) { var f = await det.native.detect(img); return !!(f && f.length); }
                if (det.mp) { var r = det.mp.detect(img); return !!(r && r.detections && r.detections.length); }
            } catch (e) {}
            return false;
        }
        // Fotos SÓ da galeria principal do produto (não "Veja também"), em ordem, capadas.
        function productGalleryUrls(limit) {
            var main = document.querySelector('.product__main-photos, .product-slideshow, .product-image-main, .product__photos');
            var urls = [], seen = {};
            if (main) {
                [].slice.call(main.querySelectorAll('img')).forEach(function (im) {
                    var src = largestSrc(im) || im.getAttribute('data-src') || im.src || '';
                    if (!src || src.indexOf('data:image') !== -1) return;
                    var low = src.toLowerCase();
                    if (/logo|icon|sprite|provador|placeholder|spacer/.test(low)) return;
                    var key = src.split('?')[0].replace(/_(\d+)x(\d+)?\./, '.');
                    if (seen[key]) return; seen[key] = 1;
                    urls.push(upgradeImgUrl(src));
                });
            }
            return urls.slice(0, limit || 8);
        }
        async function detectFacePhoto(urls) {
            if (!urls || !urls.length) return null;
            var det = await getFaceDetector();
            if (!det) return null;
            for (var i = 0; i < urls.length; i++) {
                var img = await _loadCorsImg(urls[i]);
                if (!img) continue;
                if (await _imgHasFace(det, img)) return urls[i];
            }
            return null;
        }
        function startFaceDetect() {
            if (faceDetectPromise) return faceDetectPromise;
            faceDetectPromise = detectFacePhoto(productGalleryUrls(8)).then(function (u) {
                if (u) { selectedProductImgUrl = u; try { console.log('[PL Cand] foto no rosto detectada como principal'); } catch (e) {} }
                return u;
            }).catch(function () { return null; });
            return faceDetectPromise;
        }

        function openModal() {
            // Lazy-load Phosphor Icons na primeira abertura
            if (!window.phosphorIconsLoaded) {
                var ph = document.createElement('script');
                ph.src = 'https://unpkg.com/@phosphor-icons/web';
                document.head.appendChild(ph);
                window.phosphorIconsLoaded = true;
            }
            modal.style.display = 'flex';
            lockBodyScroll();
            // Dispara a detecção de rosto em background — termina enquanto o cliente
            // digita telefone e tira a foto, então o gerar já tem a foto certa.
            try { startFaceDetect(); } catch (e) {}
            // Mostra contador imediatamente (só por IP) ao abrir o modal
            if (typeof _checkProvasRestantes === 'function') _checkProvasRestantes();
        }


        function closeModal() {
            // Só esconde — mantém o resultado (a foto provada). "Provar outra foto" é quem reseta.
            modal.style.display = 'none';
            unlockBodyScroll();
            try { stopFakeBuy(); } catch (e) {}
        }


        function applyProduct(product) {
            currentProduct = product;
        }


        openBtn.onclick = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            const prodName = document.querySelector('h1.product__title,.product-single__title,h1')?.innerText || document.title;
            applyProduct(detectProduct(prodName));
            populateImageSelector();
            openModal();
        };


        closeBtn.onclick = () => closeModal();
        if (backBtn) backBtn.onclick = () => closeModal();


        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });


        if (retryBtn) retryBtn.onclick = () => {
            try { if (typeof cameraInput !== 'undefined' && cameraInput) cameraInput.value = ''; if (typeof galleryInput !== 'undefined' && galleryInput) galleryInput.value = ''; } catch (e) {}
            document.getElementById('q-step-result').style.display = 'none';
            photoStep.style.display = 'flex';
            document.querySelector('.q-card-ia').classList.remove('is-result');
            userPhoto = null;
            pixPaymentId = null;
            preImg.style.display = 'none';
            if (facePlaceholder) facePlaceholder.style.display = 'flex';
            checkFields();
        };

        // Camera / gallery buttons
        document.getElementById('q-btn-gallery').onclick = function() { galleryInput.click(); };
        document.getElementById('q-face-frame').onclick = function() { galleryInput.click(); };

        // ── Câmera ao vivo (getUserMedia) — abre a câmera de verdade dentro do provador.
        //    Fallback p/ <input capture> só quando getUserMedia não existe / é negado
        //    (ex.: contexto inseguro ou webview que bloqueia a câmera). ──
        let camStream = null, camFacing = 'user', camOverlay = null;
        function buildCamOverlay() {
            if (camOverlay) return camOverlay;
            camOverlay = document.createElement('div');
            camOverlay.className = 'q-cam-overlay';
            camOverlay.innerHTML =
                '<video class="q-cam-video" autoplay playsinline muted></video>' +
                '<button class="q-cam-mini q-cam-close" type="button" aria-label="Fechar">&#10005;</button>' +
                '<div class="q-cam-controls">' +
                  '<button class="q-cam-mini q-cam-flip" type="button" aria-label="Virar câmera">&#8635;</button>' +
                  '<button class="q-cam-shutter" type="button" aria-label="Tirar foto"></button>' +
                  '<span style="width:46px"></span>' +
                '</div>';
            document.body.appendChild(camOverlay);
            camOverlay.querySelector('.q-cam-close').onclick = closeLiveCamera;
            camOverlay.querySelector('.q-cam-flip').onclick = flipCamera;
            camOverlay.querySelector('.q-cam-shutter').onclick = snapPhoto;
            return camOverlay;
        }
        async function startStream() {
            const v = camOverlay.querySelector('.q-cam-video');
            if (camStream) camStream.getTracks().forEach(t => t.stop());
            camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: camFacing }, audio: false });
            v.srcObject = camStream;
            camOverlay.classList.toggle('is-front', camFacing === 'user');
        }
        async function openLiveCamera() {
            if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) || !window.isSecureContext) {
                cameraInput.click(); return;
            }
            buildCamOverlay();
            camOverlay.classList.add('is-open');
            try { await startStream(); }
            catch (e) { closeLiveCamera(); cameraInput.click(); }
        }
        function closeLiveCamera() {
            if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; }
            if (camOverlay) camOverlay.classList.remove('is-open');
        }
        async function flipCamera() {
            const prev = camFacing;
            camFacing = camFacing === 'user' ? 'environment' : 'user';
            try { await startStream(); } catch (e) { camFacing = prev; try { await startStream(); } catch (_) {} }
        }
        function snapPhoto() {
            const v = camOverlay.querySelector('.q-cam-video');
            if (!v || !v.videoWidth) return;
            const c = document.createElement('canvas');
            c.width = v.videoWidth; c.height = v.videoHeight;
            // captura SEM espelhar (imagem fiel p/ a IA), mesmo com preview espelhado
            c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
            c.toBlob(function(blob) {
                const file = new File([blob], 'foto.jpg', { type: 'image/jpeg' });
                closeLiveCamera();
                handlePhotoSelected(file);
            }, 'image/jpeg', 0.95);
        }
        document.getElementById('q-btn-camera').onclick = openLiveCamera;

        function loadRelatedProducts() {
            var grid = document.getElementById('q-related-grid');
            var section = document.getElementById('q-related-products');
            if (!grid || !section) return;

            var items = document.querySelectorAll('.js-swiper-related .js-item-product');
            if (!items.length) items = document.querySelectorAll('.js-item-product');
            var products = [];

            items.forEach(function(item) {
                if (products.length >= 3) return;
                var container = item.querySelector('[data-variants]');
                if (!container) return;
                try {
                    var variants = JSON.parse(container.getAttribute('data-variants'));
                    if (!variants || !variants.length) return;
                    var v = variants[0];
                    var imgRaw = v.image_url || '';
                    var img = imgRaw ? 'https:' + imgRaw.replace(/\\/g, '').replace('-1024-1024.webp', '-480-0.webp') : '';
                    var price = v.price_short || '';
                    // Name from img alt (Nuvemshop sets it reliably)
                    var imgEl = item.querySelector('img[alt]');
                    var name = imgEl ? imgEl.getAttribute('alt').trim() : '';
                    // Link from any anchor pointing to /produtos/
                    var linkEl = item.querySelector('a[href*="/produtos/"]');
                    var link = linkEl ? linkEl.getAttribute('href') : '';
                    if (img && (name || price)) {
                        products.push({ name: name, img: img, price: price, link: link });
                    }
                } catch(e) {}
            });

            if (!products.length) return;

            while (grid.firstChild) grid.removeChild(grid.firstChild);
            products.forEach(function(p) {
                var a = document.createElement('a');
                a.className = 'q-related-card';
                a.href = p.link || '#';
                a.target = '_blank';
                var img = document.createElement('img');
                img.src = p.img;
                img.alt = p.name;
                img.loading = 'lazy';
                var nameEl = document.createElement('span');
                nameEl.className = 'q-related-card-name';
                nameEl.textContent = p.name;
                a.appendChild(img);
                a.appendChild(nameEl);
                grid.appendChild(a);
            });
            section.style.display = 'block';
        }

        // ── Barra de progresso simulada (não há evento real de progresso do backend).
        // Desacelera perto de 92% e se auto-encerra sozinha quando a tela de loading
        // for escondida (sucesso, erro ou limite) — não precisa de hook em cada saída. ──
        var _qProgressTimer = null;
        function startLoadingProgress() {
            if (_qProgressTimer) { clearInterval(_qProgressTimer); _qProgressTimer = null; }
            var lb = document.getElementById('q-loading-box');
            var bar = lb ? lb.querySelector('.q-loading-bar > div') : null;
            if (!lb || !bar) return;
            bar.style.transition = 'none';
            bar.style.transform = 'scaleX(0)';
            void bar.offsetWidth;
            bar.style.transition = 'transform 0.3s ease-out';
            var progress = 0;
            _qProgressTimer = setInterval(function () {
                if (lb.style.display !== 'flex') { clearInterval(_qProgressTimer); _qProgressTimer = null; return; }
                var remaining = 92 - progress;
                progress += Math.max(remaining * 0.06, 0.15);
                if (progress > 92) progress = 92;
                bar.style.transform = 'scaleX(' + (progress / 100) + ')';
            }, 200);
        }

        function showError() {
            var lb = document.getElementById('q-loading-box');
            var su = photoStep;
            var se = document.getElementById('q-step-error');
            if (lb) lb.style.display = 'none';
            if (su) su.style.display = 'none';
            if (se) se.style.display = 'flex';
        }
        var _eb = document.getElementById('q-error-back'); if (_eb) _eb.onclick = function() { closeModal(); };



        phoneInput.addEventListener('input', function (e) {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
            checkPhoneStep();
        });
        // ── Contador de provas restantes (debounced) ──
        let _provasDebounce;
        async function _checkProvasRestantes() {
            const _els = document.querySelectorAll('.q-provas-msg');
            if (!_els.length) return;
            const nums = phoneInput.value.replace(/\D/g, '');
            const phoneOk = isValidBRPhone(nums);
            // Phone vazio/incompleto → manda '0' pra pegar só o ip_count.
            const phone = phoneOk ? '55' + nums : '0';
            try {
                const r = await fetch(WEBHOOK_CHECK_LIMIT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone })
                });
                const d = await r.json();
                const used = Math.max(d.phone_count || 0, d.ip_count || 0, d.count || 0);
                const restantes = Math.max(0, 3 - used);
                if (restantes > 0) {
                    const _txt = restantes + (restantes === 1 ? ' prova restante hoje' : ' provas restantes hoje');
                    _els.forEach(el => { el.textContent = _txt; el.classList.remove('is-warn'); });
                } else {
                    _els.forEach(el => { el.textContent = ''; el.classList.remove('is-warn'); });   // limite: não avisa na tela inicial; o PIX aparece só ao enviar a foto
                }
            } catch(_) { _els.forEach(el => { el.textContent = ''; el.classList.remove('is-warn'); }); }
        }
        phoneInput.addEventListener('input', () => {
            clearTimeout(_provasDebounce);
            _provasDebounce = setTimeout(_checkProvasRestantes, 600);
        });



        function flashError(targetEl, hintMsg) {
            var hint = document.getElementById('q-validation-hint');
            if (hint) {
                hint.textContent = '\u26A0\uFE0F ' + hintMsg;
                hint.classList.add('is-visible');
            }
            if (targetEl) {
                targetEl.classList.add('is-error', 'q-shake');
                setTimeout(function(){ targetEl.classList.remove('q-shake'); }, 600);
                try { targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {}
                if (targetEl.focus) setTimeout(function(){ targetEl.focus(); }, 350);
            }
        }
        function checkPhoneStep() {
            const nums = phoneInput.value.replace(/\D/g, '');
            const phoneOk = isValidBRPhone(nums);
            document.getElementById('q-phone-error').style.display = (phoneInput.value.length > 0 && !phoneOk) ? 'block' : 'none';
            phoneInput.style.borderColor = (phoneInput.value.length > 0 && !phoneOk) ? '#ef4444' : 'var(--q-border)';
            checkFields();
        }

        function checkFields() {
            const nums = phoneInput.value.replace(/\D/g, '');
            const phoneOk = isValidBRPhone(nums);
            /* aggressive validation: botão sempre clicável */
        }

        document.getElementById('q-accept-terms').onchange = checkFields;

        function handlePhotoSelected(file) {
            if (!file) return;
            userPhoto = file;
            const rd = new FileReader();
            rd.onload = ev => {
                preImg.src = ev.target.result;
                preImg.style.display = 'block';
                if (facePlaceholder) facePlaceholder.style.display = 'none';
                checkFields();
            };
            rd.readAsDataURL(file);
        }

        cameraInput.onchange  = (e) => handlePhotoSelected(e.target.files[0]);
        galleryInput.onchange = (e) => handlePhotoSelected(e.target.files[0]);


        function resizeImage(fileOrBlob, maxSize) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    let w = img.width, h = img.height;
                    if (w <= maxSize && h <= maxSize) { resolve(fileOrBlob); return; }
                    if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
                    else { w = Math.round(w * maxSize / h); h = maxSize; }
                    const c = document.createElement('canvas');
                    c.width = w; c.height = h;
                    c.getContext('2d').drawImage(img, 0, 0, w, h);
                    c.toBlob(b => resolve(b), 'image/jpeg', 0.95);
                };
                const url = URL.createObjectURL(fileOrBlob instanceof Blob ? fileOrBlob : new Blob([fileOrBlob]));
                img.src = url;
            });
        }

        // ── PIX: polling e controle ──
        let pixPollingTimer = null;

        function stopPixPolling() {
            if (pixPollingTimer) { clearInterval(pixPollingTimer); pixPollingTimer = null; }
        }

        function showPixScreen() {
            uploadStep.style.display = 'none';
            document.getElementById('q-step-pix').style.display = 'block';
            document.getElementById('q-pix-status-msg').textContent = 'Aguardando pagamento...';
            document.getElementById('q-pix-status-msg').className = 'q-pix-status q-pix-waiting';
        }

        function hidePixScreen() {
            stopPixPolling();
            document.getElementById('q-step-pix').style.display = 'none';
        }

        // ── Reaproveitamento de PIX pendente ──
        // Evita criar um novo QR a cada abertura do modal: se há PIX pendente do
        // mesmo telefone gerado há menos de 25min, reaproveita e continua polando.
        const _PIX_LS_KEY = 'pl_pix_pending_v1';
        const _PIX_TTL_MS = 25 * 60 * 1000; // 25 min (PIX MP expira em 30min)
        function _pixLoadPending(phone) {
            try {
                const raw = localStorage.getItem(_PIX_LS_KEY);
                if (!raw) return null;
                const arr = JSON.parse(raw);
                const now = Date.now();
                const valid = arr.filter(p => p.phone === phone && (now - p.ts) < _PIX_TTL_MS);
                return valid[0] || null;
            } catch(_) { return null; }
        }
        function _pixSavePending(phone, payment_id, qr_code, qr_code_base64) {
            try {
                const raw = localStorage.getItem(_PIX_LS_KEY);
                let arr = [];
                try { arr = raw ? JSON.parse(raw) : []; } catch(_) {}
                // Limpa expirados
                const now = Date.now();
                arr = arr.filter(p => (now - p.ts) < _PIX_TTL_MS && p.phone !== phone);
                arr.push({ phone, payment_id, qr_code, qr_code_base64, ts: now });
                localStorage.setItem(_PIX_LS_KEY, JSON.stringify(arr));
            } catch(_) {}
        }
        function _pixClearPending(phone) {
            try {
                const raw = localStorage.getItem(_PIX_LS_KEY);
                if (!raw) return;
                let arr = JSON.parse(raw);
                arr = arr.filter(p => p.phone !== phone);
                localStorage.setItem(_PIX_LS_KEY, JSON.stringify(arr));
            } catch(_) {}
        }

        async function createPixAndPoll(_isRetry) {
            showPixScreen();
            const phone = '55' + phoneInput.value.replace(/\D/g, '');
            try {
                let pix;
                // Numa retry, ignora o pendente (foi ele que deu QR quebrado).
                const pending = _isRetry ? null : _pixLoadPending(phone);
                // Só reaproveita pendente COMPLETO (com QR base64). Pendente parcial
                // (base64 vazio) geraria 'data:image/png;base64,undefined' = QR quebrado.
                if (pending && pending.qr_code_base64) {
                    // Reaproveita PIX pendente
                    pix = { payment_id: pending.payment_id, qr_code: pending.qr_code, qr_code_base64: pending.qr_code_base64 };
                } else {
                    if (pending) _pixClearPending(phone); // limpa o pendente quebrado
                    const resp = await fetch(WEBHOOK_PIX, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: 'cliente@provoulevou.com.br', phone, loja: 'cand', origin: location.origin })
                    });
                    pix = await resp.json();
                    // Exige o base64 também — sem ele o QR não renderiza.
                    if (!pix.payment_id || !pix.qr_code || !pix.qr_code_base64) throw new Error('PIX inválido');
                    _pixSavePending(phone, pix.payment_id, pix.qr_code, pix.qr_code_base64);
                }

                const _qrImg = document.getElementById('q-pix-qr-img');
                // Auto-recuperação: se o QR não carregar, limpa e refaz UMA vez.
                _qrImg.onerror = function () {
                    _qrImg.onerror = null;
                    if (!_isRetry) { _pixClearPending(phone); stopPixPolling(); createPixAndPoll(true); }
                };
                _qrImg.src = 'data:image/png;base64,' + pix.qr_code_base64;
                document.getElementById('q-pix-code').value = pix.qr_code;

                // Polling a cada 3s por até 5min
                let attempts = 0;
                pixPollingTimer = setInterval(async () => {
                    attempts++;
                    if (attempts > 100) { stopPixPolling(); return; }
                    try {
                        const sr = await fetch(WEBHOOK_PIX_STATUS + '?payment_id=' + pix.payment_id);
                        const st = await sr.json();
                        if (st.status === 'approved') {
                            stopPixPolling();
                            _pixClearPending(phone);
                            document.getElementById('q-pix-status-msg').textContent = 'Pagamento confirmado!';
                            document.getElementById('q-pix-status-msg').className = 'q-pix-status q-pix-approved';
                            setTimeout(() => {
                                hidePixScreen();
                                pixPaymentId = pix.payment_id;
                                runGeneration();
                            }, 1200);
                        }
                    } catch (_) {}
                }, 3000);
            } catch (e) {
                hidePixScreen();
                uploadStep.style.display = 'block';
                showError();
            }
        }

        // Botão copiar PIX
        document.getElementById('q-pix-copy-btn').onclick = () => {
            const code = document.getElementById('q-pix-code').value;
            navigator.clipboard.writeText(code).then(() => {
                document.getElementById('q-pix-copy-btn').textContent = 'Copiado!';
                setTimeout(() => { document.getElementById('q-pix-copy-btn').textContent = 'Copiar'; }, 2000);
            });
        };

        // Botão cancelar PIX
        document.getElementById('q-pix-cancel').onclick = () => {
            hidePixScreen();
            uploadStep.style.display = 'block';
        };

        // ── GERAÇÃO PRINCIPAL ──
        async function runGeneration() {

            if (runGeneration._busy) return;

            runGeneration._busy = true;

            try {
                const keyToUse = window.PROVOU_LEVOU_API_KEY;
                if (!keyToUse || keyToUse.includes("COLOQUE_A_CHAVE_AQUI")) {
                    showError();
                    return;
                }

                // Aguarda a detecção de rosto (se ainda rodando) p/ garantir que a foto
                // do óculos NO ROSTO seja a principal. Timeout 4s -> usa o default se demorar.
                try {
                    if (faceDetectPromise) {
                        await Promise.race([faceDetectPromise, new Promise(function (r) { setTimeout(r, 4000); })]);
                    }
                } catch (e) {}

                // Prioridade: imagem da COR selecionada (corrige "vai a cor errada").
                let variantImg = '';
                try { variantImg = await selectedVariantImgUrl(); } catch (e) {}
                const prodImg = variantImg || selectedProductImgUrl || (document.querySelector('meta[property="og:image"]')?.content || '');
                const prodName = document.querySelector('h1.product__title,.product-single__title,h1')?.innerText || document.title;

                uploadStep.style.display = 'none';
                document.getElementById('q-loading-box').style.display = 'flex';
                startLoadingProgress();

                try {
                    const fd = new FormData();
                    fd.append('person_image', await toJpeg(userPhoto), 'person.jpg');
                    fd.append('whatsapp', '55' + phoneInput.value.replace(/\D/g, ''));
                    fd.append('phone_raw', phoneInput.value);
                    fd.append('product_name', prodName);
                    fd.append('product_type', currentProduct.category);
                    fd.append('product_fit', currentProduct.fit);
                    fd.append('api_key', keyToUse);
                    if (pixPaymentId) fd.append('pix_payment_id', pixPaymentId);

                    if (currentProduct.category === 'top') {
                        fd.append('height', '');
                        fd.append('weight', '');
                    } else {
                        fd.append('height', '');
                        fd.append('weight', '');
                        fd.append('cintura', '');
                        fd.append('quadril', '');
                    }

                    // Coleta até 4 fotos do produto: 1ª como binary (compat), 2ª-4ª como base64 text.
                    // 1ª = prodImg (escolhida pelo cliente ou default); demais = extractImages() exceto a 1ª.
                    let allProdImgs = [];
                    if (prodImg) allProdImgs.push(prodImg);
                    // Só junta extras da galeria quando NÃO temos a imagem da variante:
                    // a galeria tem fotos de todas as cores, então mandar extras junto da
                    // cor certa contaminaria a geração. Com variantImg, mandamos só ela.
                    try {
                        if (!variantImg && typeof extractImages === 'function') {
                            const extra = extractImages();
                            for (const u of extra) {
                                const cleanU = String(u || '').split('?')[0];
                                if (!allProdImgs.some(p => String(p).split('?')[0] === cleanU)) {
                                    allProdImgs.push(u);
                                }
                            }
                        }
                    } catch (_) {}
                    allProdImgs = allProdImgs.slice(0, 4);
                    // Guarda anti-"ALTA DEMANDA": só manda blobs que são REALMENTE imagem.
                    // Se uma URL resolver pra HTML/404 (ex: página do produto), o Gemini
                    // rejeita com 400 e a prova quebra. Aqui pulamos o não-imagem; a 1ª
                    // imagem VÁLIDA vira a principal (binary), o resto vai como base64.
                    let _primaryDone = false, _slot = 1;
                    for (let _pi = 0; _pi < allProdImgs.length; _pi++) {
                        try {
                            const _u = String(allProdImgs[_pi] || '').replace(/^http:\/\//i, 'https://').replace(/\{width\}/g, '1200');
                            const _b = await fetch(_u).then(r => r.blob());
                            if (!_b || !/^image\//i.test(_b.type)) continue;
                            if (!_primaryDone) {
                                fd.append('product_image', _b, 'product.jpg');
                                _primaryDone = true;
                            } else {
                                _slot++;
                                const _b64 = await new Promise((resolve, reject) => {
                                    const _r = new FileReader();
                                    _r.onloadend = () => resolve(_r.result.split(',')[1]);
                                    _r.onerror = reject;
                                    _r.readAsDataURL(_b);
                                });
                                fd.append('product_image_' + _slot + '_b64', _b64);
                            }
                        } catch (_) { }
                    }
                    if (!_primaryDone) {
                        // Sem imagem de produto válida o gerador não tem o que provar e o nó
                        // "Extract Product Image" quebra (Provided parameter is not a string).
                        // Aborta com erro claro em vez de mandar um request quebrado pro workflow.
                        console.warn('[PL Cand] nenhuma imagem de produto válida — abortando prova');
                        try { document.getElementById('q-loading-box').style.display = 'none'; } catch (_) {}
                        try { photoStep.style.display = 'flex'; } catch (_) {}
                        try { showError(); } catch (_) {}
                        return;
                    }

                    calculateFinalSize();

                    const res = await (async () => {
                        let _d = 1500;
                        for (let _i = 0; _i < 4; _i++) {
                            const _r = await fetch(WEBHOOK_PROVA, { method: 'POST', body: fd });
                            if (_r.ok || _r.status === 400 || _r.status === 401 || _r.status === 403) return _r;
                            if (_i === 3) return _r;
                            await new Promise(_x => setTimeout(_x, _d + Math.random() * 500));
                            _d *= 2;
                        }
                    })();

                    const contentType = res.headers.get("content-type") || "";
                    if (contentType.includes("application/json")) {
                        const data = await res.json();
                        if (data.error) {
                            document.getElementById('q-loading-box').style.display = 'none';
                            photoStep.style.display = 'flex';
                            if (data.error === "Chave invalida, vencida ou inativa." || data.error.includes("vencida ou inativa")) {
                                showError();
                            } else {
                                alert(data.error);
                            }
                            return;
                        }
                    }

                    if (res.ok) {
                        const blob = await res.blob();
                        document.getElementById('q-loading-box').style.display = 'none';
                        document.getElementById('q-final-view-img').src = URL.createObjectURL(blob);
                        document.querySelector('.q-card-ia').classList.add('is-result');
                        document.getElementById('q-step-result').style.display = 'flex';
                        populateBuyCta();
                        if (typeof _checkProvasRestantes === 'function') _checkProvasRestantes();
                    } else if (res.status === 401 || res.status === 403) {
                        document.getElementById('q-loading-box').style.display = 'none';
                        photoStep.style.display = 'flex';
                        showError();
                    } else { throw new Error(); }
                } catch (e) {
                    document.getElementById('q-loading-box').style.display = 'none';
                    photoStep.style.display = 'flex';
                    showError();
                }
        

            } finally {

                runGeneration._busy = false;

            }
        }

        

        genBtn.onclick = async () => {
            // Validação agressiva (UI feedback)
            var _vNums = (phoneInput.value || '').replace(/\D/g, '');
            var _vPhoneOk = isValidBRPhone(_vNums);
            var _vFaceFrame = document.getElementById('q-face-frame');
            var _vTerms = document.getElementById('q-accept-terms');
            if (!_vPhoneOk) { flashError(phoneInput, 'Preencha seu WhatsApp para continuar'); return; }
            if (!userPhoto) { flashError(_vFaceFrame, 'Envie ou tire sua foto para continuar'); return; }
            if (_vTerms && !_vTerms.checked) { flashError(document.querySelector('.q-terms-row'), 'Aceite os termos para continuar'); return; }
            var _vHint = document.getElementById('q-validation-hint');
            if (_vHint) _vHint.classList.remove('is-visible');
            phoneInput.classList.remove('is-error');
            if (_vFaceFrame) _vFaceFrame.classList.remove('is-error');

            if (!userPhoto) return;
            const _gNums = (phoneInput.value || '').replace(/\D/g, '');
            const _gPhoneOk = (_gNums.length === 10 || _gNums.length === 11) && /^[1-9][1-9]/.test(_gNums) && (_gNums.length === 10 || _gNums[2] === '9');
            if (!_gPhoneOk) { phoneInput.focus(); return; }

            const phone = '55' + phoneInput.value.replace(/\D/g, '');
            genBtn.disabled = true;

            // Feedback imediato: mostra a animacao na hora; o check de limite roda enquanto ela ja aparece.
            try { uploadStep.style.display = 'none'; } catch (_) {}
            try { document.getElementById('q-loading-box').style.display = 'flex';
 startLoadingProgress(); } catch (_) {}


            try {
                const resp = await fetch(WEBHOOK_CHECK_LIMIT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone })
                });
                const data = await resp.json();
                if (data.limited) {
            try { document.getElementById('q-loading-box').style.display = 'none'; } catch (_) {}
                    genBtn.disabled = false;
                    try { var _eh=document.querySelector('#q-step-error h2'); var _ep=document.querySelector('#q-step-error p');
                          if(_eh)_eh.textContent='Limite de hoje atingido';
                          if(_ep)_ep.textContent='Voce ja fez suas 3 provas de hoje. Volte amanha para experimentar mais! 😊'; } catch(_){}
                    showError();
                    return;
                }
            } catch (_) {
                // se o check falhar, deixa gerar (evita bloquear por erro de rede)
            }

            genBtn.disabled = false;
            runGeneration();
        };
    }

    // ─── EXECUTA APENAS EM PÁGINAS DE PRODUTO (Shopify estrito) ──────────────────
    // Só roda se a página for produto de verdade: og:type=product E /products/<handle>.
    // Evita aparecer em /products cru, coleções, home, etc. (pedido do lojista Cand).
    const isProductPage = !!document.querySelector('meta[property="og:type"][content="product"]') && /\/products\/[^\/?#]+/.test(window.location.pathname);

    if (isProductPage && !PROVADOR_OFF) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
        else init();
    }

})();
