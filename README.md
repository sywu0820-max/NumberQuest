# Number Quest 數字探險隊

給約 7 歲孩子使用的觸控優先數學闖關遊戲，練習九九乘法（1–9）與 100 以內加減。

## 產品原則
不是「題庫換皮」，而是短回合探險：世界地圖、解鎖、星等、XP 與寶石。答錯不扣生命、不清除進度，改為鼓勵提示＋再挑戰。

## 裝置
iPad Safari 與 Surface Pro Edge 都是第一級目標。核心遊戲無帳號、無後端、無 API、無廣告；進度保存在裝置 localStorage。

## PWA 部署
GitHub Pages 從 `main` / repository root 發布。詳細步驟見 `docs/DEPLOY_PWA.md`。

## AI 開發工作流
`AGENTS.md` 是 engineering contract；`docs/CODEX_HANDOFF.md` 定義 Codex → branch/PR → ChatGPT review/repair 的 bounded workflow。