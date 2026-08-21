# Dice6 真实骰子音效素材核查

## 候选来源

| 来源 | 真实性 | 授权核查 | 结论 |
| --- | --- | --- | --- |
| Freesound `dice-rolling` 标签 | 包含木桌、桌游板与实体骰子录音 | 单条素材采用各自 Creative Commons 授权，下载通常需要账户 | 不作为默认内置资源，避免素材许可与下载登录的不确定性。 |
| Pixabay Dice Roll | 搜索结果显示为免版税骰子效果 | 当前环境无法建立站点连接，无法独立验证下载条款及取得文件 | 不采用。 |
| OpenGameArt CC0 Sound Effects | 索引明确列出 `Wooden dice on wodden table roll` 与 `2 dice roll (29 throws)` | 页面明确标注“Sound effects with attribution not required”，并作为 CC0 声效集合展示 | 优先采用。 |

## 实现原则

默认保持静音。仅在用户主动开启音效后加载并播放真实录音；音频与约 920ms 投掷动画同步开始，并在落定前结束。开关应默认隐藏，可从屏幕边缘短暂唤出；选择会保存到本地浏览器。

## 选定素材

OpenGameArt 的 [Wooden dice on wodden table roll](https://opengameart.org/content/wooden-dice-on-wodden-table-roll) 由 Wuzzy 发布，页面标明 **CC0**，包含四个真实木骰子在木桌上的滚动录音。直接资源为：

- `https://opengameart.org/sites/default/files/Holzw%C3%BCrfel_auf_Holztisch_1.flac`
- `https://opengameart.org/sites/default/files/Holzw%C3%BCrfel_auf_Holztisch_2.flac`
- `https://opengameart.org/sites/default/files/Holzw%C3%BCrfel_auf_Holztisch_3.flac`
- `https://opengameart.org/sites/default/files/Holzw%C3%BCrfel_auf_Holztisch_4.flac`
