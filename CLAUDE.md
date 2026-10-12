# birds SEE you — 給 Claude 的交接

給孩子用的台灣賞鳥 PWA。Ben（爸爸）出想法，Claude 負責所有修改。對不確定的事先跟 Ben 討論。
網址：https://72es.github.io/birdseeyou/ ，repo：github.com/72es/birdseeyou（GitHub Pages，main 分支直接上線）。

## 架構
- 靜態網站：`index.html`、`app.js`（全部邏輯）、`app.css`（全部樣式）。hash 路由：`#/`、`#/all`、`#/r/{區域}`、`#/b/{鳥}/{來源}`、`#/me`、`#/wish`。
- 資料：`data/birds.json`（92 種鳥：名稱、介紹、故事、認鳥重點、公母、相簿 photos、叫聲 sounds、like/key 易混淆）、`data/regions.json`（首頁順序 城市→關渡→大雪山、回饋表單 endpoint）、`data/regions/*.json`。
- 照片 `img/`：iNaturalist CC 授權，每張都要目視確認物種和公母，台灣照片優先。每個公/母/成鳥/幼鳥相簿最多 5 張。
- 叫聲 `snd/`：xeno-canto（台灣錄音優先）＋ iNaturalist（鵲鴒、白尾八哥，xeno-canto 限制物種）。一般授權的錄音剪成 5–15 秒；ND（禁止改作）授權的只轉格式、不剪，`original: true`，播放音量用 `gain` 在播放器調整。流程見 `tools/sounds/README.md`。xeno-canto API 金鑰只能用環境變數 `XC_KEY`，絕不能 commit。
- 紀錄存在使用者手機 localStorage `bsy-v1`（不上雲端），靠「我的」頁的家庭備份碼搬移。
- 回饋表單走 FormSubmit 代碼 endpoint（不要把 email 寫進程式）。

## 每次修改後
1. `python3 tools/build_sw.py`（更新離線快取清單與版本號，必做）。
2. commit 後 push 到 main，約 1 分鐘上線；用 `curl https://72es.github.io/birdseeyou/version.js` 確認版本。

## Ben 已定案的設計
- 美術：透光彩繪玻璃風格，色票在 app.css `:root`。
- 收集過的卡片：寶可夢卡風格的金屬箔外框（漸層、亮粉、細雙線、慢速反光），只在已收集的卡片出現。
- 照片上不放「左右滑看 N 張」，只用點點表示張數。
- 叫聲按鈕放在鳥名下方、照片上方，不同類型不同顏色，最多 5 顆，只顯示倒數秒數、不放音訊軸（不想讓孩子盯著螢幕）；按鈕下方只寫城市，錄音者、授權放在頁面最下方的來源區。
- 沒有可靠素材時就不放，也不放說明文字（例如黑面琵鷺、東方白鸛、唐白鷺沒有叫聲）。
- 搜尋：首頁標題右邊、ALL BIRDS 分類列右邊各有放大鏡；可以搜中文、英文、學名和標籤（特有種、候鳥、留鳥、濕地、草地、高海拔、城市公園、幸運星、外來種）。

## 待辦想法
- 「這週新鮮事」：半自動的新聞／活動摘要（定時任務產生草稿，Ben 審過再上線；稀有鳥的精確位置不公開）。先做「這週可能遇到的鳥」（零維護）。
- 「聽聲猜鳥」小遊戲（可以沿用現有的叫聲素材）。
