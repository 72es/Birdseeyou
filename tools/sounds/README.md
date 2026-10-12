# 鳥叫聲處理流程（給 Claude）

需要環境變數 `XC_KEY`（xeno-canto API 金鑰，**不要寫進 repo**）。工作檔放在 `SND_WORK`（預設 ~/bsy-snd-work），不進 repo。

1. `python3 pick.py <bird_id> ...` 選錄音：台灣優先、排除 ND 授權、A/B/C 級、類型分散、最多 5 段、背景鳥多的不當第 3 段以後。
2. 下載 picks.json 裡每段的 `file` 到 `$SND_WORK/raw/XC<id>`。
3. `python3 cut.py <bird_id> ...` 自動找鳥叫最密的 8–15 秒、對齊空檔、淡入淡出、統一音量，輸出 m4a（AAC 64k）。低音鳥會加低通濾掉蟬聲。
4. `python3 qc.py <bird_id> ...` 產生聲紋圖 sheet_<id>.png，逐張目視檢查；不合格的從 picks.json 刪掉。
5. `python3 merge.py` 把檔案複製到 `snd/`、寫入 birds.json 的 `sounds`。
6. `python3 tools/build_sw.py`。
