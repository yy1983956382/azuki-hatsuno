# 更新单词库

1. 在主文件夹 `wordlibrary.xlsx` 的 `wordlibrary` 工作表末尾追加单词，沿用五列格式（编号、单词、美式音标、释义、日语释义）。保留重复词条。
2. 在项目主目录运行 `python scripts/sync-wordlibrary.py`，生成网站实际读取的 `wordlibrary.json`。
3. 运行 `python scripts/sync-wordlibrary.py --check` 核对一致性。
4. 将 Excel 和 JSON 一起提交并推送至 GitHub。单词角刷新页面后自动读取新词库，无需修改 `app.js`。

转换脚本仅使用 Python 3 标准库，无需安装第三方依赖。GitHub Actions 会检查两份词库是否一致。
