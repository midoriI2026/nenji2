(function() {
'use strict';

if (!location.href.includes("page=DBTaskForm")) return;

const rid = new URL(location.href).searchParams.get("rid");
const category = document.querySelector(`#record-value-2849-${rid}`)?.textContent.trim();

const btn = document.createElement("button");
btn.textContent = "年次フロー前チェック_累計・申請内容整合";
styleBtn(btn, "310px");

btn.onclick = runCheck;
document.body.appendChild(btn);

async function runCheck() {

    try {

        const results = [];

        const reqDays  = getText(`#record-value-508-${rid}`);
        const reqHours = getText(`#record-value-509-${rid}`);

        const preNowDays  = getText(`#record-value-504-${rid}`);
        const preNowHours = getText(`#record-value-505-${rid}`);

        // ===== 検索 =====
        const searchUrl =
          `${location.origin}/o/ag.cgi?Page=DBSearchResult&DID=35&Text=${encodeURIComponent(category)}`;

        const html = await fetch(searchUrl, { credentials: "include" }).then(r=>r.text());
        const doc  = new DOMParser().parseFromString(html,"text/html");

        // ===== 一覧取得 =====
        const list = [];

        doc.querySelectorAll('a[href*="page=DBRecord"]').forEach(a=>{
            const u = new URL(a.href, location.origin);
            const r = u.searchParams.get("rid");
            if (r) list.push({rid: parseInt(r), url: u});
        });

        // ★ RID降順にソート（新→旧）
        list.sort((a,b)=>b.rid-a.rid);

        // ===== 自分の位置 =====
        const idx = list.findIndex(x => x.rid == rid);

        let prevDays=null, prevHours=null, hasPrev=false;
        let prev = null;
        if (idx !== -1 && idx < list.length-1) {

            prev = list[idx+1]; // ←これが前レコード

            const html2 = await fetch(prev.url, { credentials:"include"}).then(r=>r.text());
            const doc2  = new DOMParser().parseFromString(html2,"text/html");

            prevDays  = doc2.querySelector(`#record-value-719-${prev.rid}`)?.textContent.trim();
            prevHours = doc2.querySelector(`#record-value-723-${prev.rid}`)?.textContent.trim();

            if (prevDays || prevHours) hasPrev=true;
        }

        // ===== メッセージ（完全再現） =====
        if (!hasPrev) {
            results.push("前レコードなし（今回分のみチェック実行）");
        }

        if (hasPrev) {

            results.push(preNowDays === prevDays
                ? `累計日数：OK（申請前rid${rid}=${preNowDays} / 前レコード累計rid${prev.rid}=${prevDays}）`
                : `累計日数：NG（申請前rid${rid}=${preNowDays} / 前レコード累計rid${prev.rid}=${prevDays}）`
            );

            results.push(preNowHours === prevHours
                ? `累計時間：OK（申請前rid${rid}=${preNowHours} / 前レコード累計rid${prev.rid}=${prevHours}）`
                : `累計時間：NG（申請前rid${rid}=${preNowHours} / 前レコード累計rid${prev.rid}=${prevHours}）`
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

        // ===== 区分チェック（そのまま再現） =====
        const numDays  = parseFloat(reqDays.replace(/[^\d.]/g,"")||"0");
        const numHours = parseFloat(reqHours.replace(/[^\d.]/g,"")||"0");

        const start = getText(`#record-value-2735-${rid}`);
        const end   = getText(`#record-value-2736-${rid}`);

        const parse = t=>{
            const m=t.match(/(\d+)時(\d+)分/);
            return m ? (parseInt(m[1])*60+parseInt(m[2])) : null;
        };

        const s=parse(start), e=parse(end);

        if (isDay || isAM || isPM) {
            results.push(
                numDays>0 && numHours===0
                    ? `日/半日：OK（日数=${reqDays} 時間=${reqHours})`
                    : `日/半日：NG（日数=${reqDays} 時間=${reqHours})`
            );
        }

        if (isDay) {
            results.push(
                numDays>=1 && numHours===0
                    ? `請求日数_日：OK（日数=${reqDays} 時間=${reqHours})`
                    : `請求日数_日：NG（日数=${reqDays} 時間=${reqHours})`
            );

            if (s!==null && e!==null) {
                const diff=(e-s)/60;
                results.push(
                    Math.abs(diff-8.75)<0.01
                    ? `請求時間_日単位：OK（開始=${start} / 終了=${end} / 差=${diff}h / 請求=${reqDays}）`
                    : `請求時間_日単位：NG（開始=${start} / 終了=${end} / 差=${diff}h / 請求=${reqDays}）`
                );
            } else {
                results.push("日単位：NG（時間取得不可）");
            }
        }

        if (isAM || isPM) {
            results.push(
                numDays === 0.5 && numHours === 0
                    ? `請求日数_半日：OK（日数=${reqDays} 時間=${reqHours})`
                    : `請求日数_半日：NG（日数=${reqDays} 時間=${reqHours})`
            );
            if (s !== null && e !== null) {
                const diff = (e - s) / 60;
                if (isAM) {
                    if(end==="12時00分"){
                        results.push(
                            Math.abs(diff - 3) < 0.01 || (diff - 3.5) < 0.01 || (diff - 4) < 0.01
                            ? `請求時間_半日単位：OK（開始=${start} / 終了=${end} / 差=${diff}h / 請求=${reqDays}）`
                            : `請求時間_半日単位：NG（開始=${start} / 終了=${end} / 差=${diff}h / 請求=${reqDays}）`
                        );
                    } else {
                        results.push(`請求時間_半日単位：NG　終了=${end}　半日単位午前は終了時間12:00）`);
                    }
                }
                if (isPM) {
                    if(start==="13時00分"){
                        results.push(
                            Math.abs(diff - 3.75) < 0.01 || (diff - 4.25) < 0.01 || (diff - 4.75) < 0.01
                            ? `請求時間_半日単位：OK（開始=${start} / 終了=${end} / 差=${diff}h / 請求=${reqDays}）`
                            : `請求時間_半日単位：NG（開始=${start} / 終了=${end} / 差=${diff}h / 請求=${reqDays}）`
                        );
                    } else {
                        results.push(`請求時間_半日単位：NG　開始=${start}　半日単位午後は開始時間13:00）`);
                    }
                }
            } else {
                results.push("半日単位：NG（時間取得不可）");
            }
        }
        if (is3h) {
            // ===== 請求日数チェック（3時間以内） =====
            if (numDays > 0) {
                results.push(`請求日数：NG（3時間以内は日数=0のみ可 / 入力=${reqDays}）`);
            } else {
                results.push("請求日数：OK（3時間以内）");
            }

            if (s !== null && e !== null) {
                const diff = (e - s) / 60;
                results.push(
                    Math.abs(diff - numHours) < 0.01
                    ? `請求時間_3時間以内：OK（開始=${start} / 終了=${end} / 差=${diff}h / 請求=${reqHours}）`
                    : `請求時間_3時間以内：NG（開始=${start} / 終了=${end} / 差=${diff}h / 請求=${reqHours}）`
                );
            } else {
                results.push("3時間以内：NG（時間取得不可）");
            }
        }

        showPanel(results,rid);

    } catch(e){
        console.error(e);
        alert("処理エラー");
    }
}

/******** 共通 ********/
function getText(s){return document.querySelector(s)?.textContent.trim()||"";}
function hasImg(s){return document.querySelector(s+" img")!==null;}
function styleBtn(b,t){b.style=`position:fixed;top:${t};right:20px;z-index:9999;padding:10px;background:#0078D4;color:#fff;`;}
function showPanel(r,id){
    const p=document.createElement("div");
    p.style=`position:fixed;top:80px;right:20px;background:#fff;border:2px solid #333;padding:12px;z-index:999999;width:650px;height:250px;overflow:auto;`;
    r.forEach(x=>{
        const d=document.createElement("div");
        d.textContent=x;
        if(x.includes("NG")) d.style.color="red";
        p.appendChild(d);
    });
    const b=document.createElement("button");
    b.textContent="OK";
    b.onclick=()=>p.remove();
    p.appendChild(b);
    document.body.appendChild(p);
}

})();
