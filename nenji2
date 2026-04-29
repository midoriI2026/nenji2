(function() {
    'use strict';

    /********** ① DBTaskForm：詳細自動表示＋検索 **********/
    if (location.href.includes("page=DBTaskForm")) {

        const detailLink = document.querySelector('a[href*="dispDetail"]');
        if (detailLink) detailLink.click();

        const rid = new URL(location.href).searchParams.get("rid");
        const category = document.querySelector(`#record-value-2849-${rid}`)?.textContent.trim();

        const btn = document.createElement("button");
        btn.textContent = "年次フロー前チェック_累計・申請内容整合";
        styleBtn(btn, "310px");

        btn.onclick = () => {
            const url =
              `https://midorinet-iwate.cybozu.com/o/ag.cgi?Page=DBSearchResult` +
              `&DID=35&QID=86324&VID=1732&Text=${encodeURIComponent(category)}` +
              `&fromSearch=1`;
            window.open(url, "_blank");
        };

        document.body.appendChild(btn);
    }

    /********** ② 検索結果 → 対象レコード開く **********/
    if (location.href.includes("Page=DBSearchResult")) {

        const url = new URL(location.href);
        if (url.searchParams.get("fromSearch") !== "1") return;

        const targetCategory = url.searchParams.get("Text")?.trim();
        const rows = document.querySelectorAll("tr");

        for (const tr of rows) {
            const catCell = tr.querySelector('.record-value-2849');
            if (!catCell) continue;

            if (catCell.textContent.trim() === targetCategory) {
                const link = tr.querySelector('a[href*="page=DBRecord"]');
                if (link) {
                    window.open(link.href + "&fromCheck=1", "_blank");
                    window.close();
                    return;
                }
            }
        }
    }

    /********** ③ DBRecord：チェック実行 **********/
    if (location.href.includes("page=DBRecord")) {

        const url = new URL(location.href);
        if (url.searchParams.get("fromCheck") !== "1") return;

        setTimeout(runCheck, 500);
    }

    async function runCheck() {

        const results = [];
        const url = new URL(location.href);
        const rid = url.searchParams.get("rid");

        // ===== 現在レコード =====
        const reqDays  = getText(`#record-value-508-${rid}`);
        const reqHours = getText(`#record-value-509-${rid}`);

        // ★追加：申請前累計（今回の修正ポイント）
        const preNowDays  = getText(`#record-value-504-${rid}`);
        const preNowHours = getText(`#record-value-505-${rid}`);

        // ===== 前レコード取得 =====
        let prevDays = null;
        let prevHours = null;
        let hasPrev = false;

        const nextLink = [...document.querySelectorAll("a")]
        .find(a => a.textContent.includes("次へ"));

        if (nextLink) {

            const prevUrl = nextLink.href;

            if (prevUrl && !prevUrl.includes("javascript:") && prevUrl !== location.href) {

                const prevTab = window.open(prevUrl, "_blank");
                await waitLoad(prevTab);

                const prevRid = new URL(prevUrl).searchParams.get("rid");

                prevDays  = prevTab.document.querySelector(`#record-value-719-${prevRid}`)?.textContent.trim();
                prevHours = prevTab.document.querySelector(`#record-value-723-${prevRid}`)?.textContent.trim();

                // 再取得（描画遅延対策）
                if (!prevDays && !prevHours) {
                    await new Promise(r => setTimeout(r, 300));

                    prevDays  = prevTab.document.querySelector(`#record-value-719-${prevRid}`)?.textContent.trim();
                    prevHours = prevTab.document.querySelector(`#record-value-723-${prevRid}`)?.textContent.trim();
                }

                prevTab.close();

                if (prevDays || prevHours) {
                    hasPrev = true;
                }
            }
        }

        // ===== メッセージ =====
        if (!hasPrev) {
            results.push("前レコードなし（今回分のみチェック実行）");
        }

        // ===== 累計チェック =====
        if (hasPrev) {

            results.push(preNowDays === prevDays
                         ? `累計日数：OK（申請前=${preNowDays} / 前累計=${prevDays}）`
                         : `累計日数：NG（申請前=${preNowDays} / 前累計=${prevDays}）`
                        );

            results.push(preNowHours === prevHours
                         ? `累計時間：OK（申請前=${preNowHours} / 前累計=${prevHours}）`
                         : `累計時間：NG（申請前=${preNowHours} / 前累計=${prevHours}）`
                        );

        } else {
            results.push("累計チェック：スキップ（前レコードなし）");
        }
        // ===== 年次区分 =====
        const isDay = hasImg(`#record-value-598-${rid}`);
        const isAM  = hasImg(`#record-value-599-${rid}`);
        const isPM  = hasImg(`#record-value-601-${rid}`);
        const is3h  = hasImg(`#record-value-600-${rid}`);

        const checked = [isDay, isAM, isPM, is3h].filter(v => v).length;

        results.push(
            checked !== 1
                ? "年次区分：NG（1つのみ選択必須）"
                : "年次区分：OK"
        );

        // ===== 区分別チェック =====
        const numDays  = parseFloat(reqDays.replace(/[^\d.]/g, "") || "0");
        const numHours = parseFloat(reqHours.replace(/[^\d.]/g, "") || "0");

        if (isDay || isAM || isPM) {
            results.push(
                numDays > 0 && numHours === 0
                    ? "日/半日：OK"
                    : `日/半日：NG（日数=${reqDays} 時間=${reqHours})`
            );
        }

        if (is3h) {
            // ===== 請求日数チェック（3時間以内） =====
            if (numDays > 0) {
                results.push(`請求日数：NG（3時間以内は日数=0のみ可 / 入力=${reqDays}）`);
            } else {
                results.push("請求日数：OK（3時間以内）");
            }
            const start = getText(`#record-value-2735-${rid}`);
            const end   = getText(`#record-value-2736-${rid}`);

            const parse = t => {
                const m = t.match(/(\d+)時(\d+)分/);
                return m ? (parseInt(m[1]) * 60 + parseInt(m[2])) : null;
            };

            const s = parse(start);
            const e = parse(end);

            if (s !== null && e !== null) {
                const diff = (e - s) / 60;

                results.push(
                    Math.abs(diff - numHours) < 0.01
                        ? `3時間以内：OK（開始=${start} / 終了=${end} / 差=${diff}h / 請求=${reqHours}）`
                        : `3時間以内：NG（開始=${start} / 終了=${end} / 差=${diff}h / 請求=${reqHours}）`
                );
            } else {
                results.push("3時間以内：NG（時間取得不可）");
            }
        }

        showPanel(results, rid);
    }

    // ===== 共通関数 =====
    function getText(selector) {
        return document.querySelector(selector)?.textContent.trim() || "";
    }

    function hasImg(selector) {
        return document.querySelector(selector + " img") !== null;
    }

    async function waitLoad(tab) {
        let c = 80;
        while (tab.location.href === "about:blank" && c-- > 0) {
            await new Promise(r => setTimeout(r, 100));
        }
        while (tab.document.readyState !== "complete") {
            await new Promise(r => setTimeout(r, 100));
        }
    }

    function styleBtn(btn, top) {
        btn.style.position = "fixed";
        btn.style.top = top;
        btn.style.right = "20px";
        btn.style.zIndex = 9999;
        btn.style.padding = "10px";
        btn.style.background = "#0078D4";
        btn.style.color = "white";
    }

    function showPanel(results, rid) {
        const panel = document.createElement("div");
        panel.style = `
            position:fixed;top:80px;right:20px;
            background:#fff;border:2px solid #333;
            padding:12px;z-index:999999;
            max-width:420px;max-height:70vh;overflow:auto;
        `;

        const title = document.createElement("div");
        title.textContent = `チェック結果（RID: ${rid}）`;
        title.style.fontWeight = "bold";
        panel.appendChild(title);

        results.forEach(r => {
            const d = document.createElement("div");
            d.textContent = r;
            if (r.includes("NG")) d.style.color = "red";
            panel.appendChild(d);
        });

        const okBtn = document.createElement("button");
        okBtn.textContent = "OK";
        okBtn.style.position = "absolute";
        okBtn.style.bottom = "10px";
        okBtn.style.right = "10px";
        okBtn.onclick = () => {

            panel.remove();

            try {

                if (window.opener && !window.opener.closed) {

                    const opener = window.opener;

                    // ★フォーカスは諦めて「再描画＋トップ遷移」
                    opener.location.href = opener.location.href;

                    // 保険（効く環境だけ）
                    setTimeout(() => {
                        opener.focus();
                        opener.document.body.click();
                    }, 200);
                }

            } catch (e) {
                console.log(e);
            }

            // ★子タブは確実に閉じる
            setTimeout(() => window.close(), 300);
        };
        panel.appendChild(okBtn);
        document.body.appendChild(panel);
    }

})();
