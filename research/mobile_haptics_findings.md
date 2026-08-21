# 移动网页触觉反馈核查

| 平台 | 网页 `navigator.vibrate()` | Dice6 行为 |
| --- | --- | --- |
| Android Chromium 浏览器 | 支持 Vibration API（需用户手势）。 | 在骰子落定时触发一次短促震动。 |
| iPhone / iPad Safari 与主屏幕网页 | WebKit 未实现 Vibration API。 | 不能保证网页层面的真实触觉震动；代码将静默降级，不报错或显示无效提示。 |

> W3C 的实现报告写明：“WebKit has never shipped the API and formally opposes it.”

## 来源

1. MDN, Navigator: vibrate() method: <https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate>
2. W3C, Vibration API Implementation Report: <https://w3c.github.io/vibration/reports/implementation.html>

## 实施结论

Dice6 可以在检测到 `navigator.vibrate` 的设备上提供短促落定震动；在 iPhone Safari 和由 Safari 驱动的已安装网页中，无法以标准网页技术确保 Haptic Feedback。要保证 iPhone 真正的系统级触觉，需要原生 iOS 封装并调用 UIKit/Core Haptics，而不是纯网页/PWA。
