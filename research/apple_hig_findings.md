# Apple HIG 核查笔记

本核查使用 Apple 官方人机界面指南，重点覆盖视觉层级、触控手势和辅助功能。

| 主题 | 官方要点 | 对 Dice6 的影响 |
| --- | --- | --- |
| 设计层级 | HIG 强调内容优先、清晰层级和一致设计原则。 | 黑色留白和单颗骰子可保留；功能设置不能以装饰性控件干扰主体。 |
| 自定义手势 | 自定义手势应当可发现、易操作、与其他手势区分，并且不应是重要操作的唯一入口。 | 长按骰子可作为快捷方式，但音效与震动设置不应只依赖不可发现的长按。 |
| 手势反馈 | 手势应尽快响应，并提供帮助用户理解结果的即时反馈。 | 长按达到阈值时应提供可感知的反馈，并明确展示设置面板。 |

## 来源

1. Apple Human Interface Guidelines 总览：<https://developer.apple.com/design/human-interface-guidelines>
2. Apple Gestures：<https://developer.apple.com/design/human-interface-guidelines/gestures>

3. Apple Accessibility：<https://developer.apple.com/design/human-interface-guidelines/accessibility>
4. Apple Materials：<https://developer.apple.com/design/human-interface-guidelines/materials>

> Apple 在 Gestures 指南中说明：自定义手势应当 “Discoverable, Straightforward to perform, Distinct from other gestures, Not the only way to perform an important action in your app or game”。

## 新增发现

| 主题 | 官方要点 | 对 Dice6 的影响 |
| --- | --- | --- |
| 辅助功能 | 界面应具备直观、可感知、可适配的交互，且不依赖单一传达方式。 | 当前长按设置拥有 ARIA 标签，但仍缺少键盘可发现的替代入口；应增加无视觉干扰的键盘入口并提供一次性提示。 |
| 对比度 | Apple 将 WCAG AA 作为可接受对比度的检查依据；小尺寸文本建议至少 4.5:1。 | 设置面板内较弱的灰色说明文字需要提高对比度，或者在减少透明度/增大对比度场景下提供替代。 |
| 材料 | 材料用于分离功能层与内容层；Apple 建议节制使用材质效果，并为文本较多的临时面板使用能维持可读性的常规材质。 | 当前设置面板作为短暂功能层是合理的，但应强化不透明度并保留简洁的磨砂层，避免控制文字与黑底混淆。 |
