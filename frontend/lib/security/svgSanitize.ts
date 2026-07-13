// SVGインジェクション対策。<script>・イベントハンドラ属性・外部参照(<use>)・
// <foreignObject> を除去し、描画に必要な要素のみを許可する。
// ブラウザのDOMを利用するため、クライアントサイドでのみ呼び出すこと。
import DOMPurify from "dompurify";

export function sanitizeSvg(rawSvg: string): string {
  return DOMPurify.sanitize(rawSvg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["script", "foreignObject", "use", "iframe"],
    FORBID_ATTR: ["onload", "onerror", "onclick", "onmouseover"],
  });
}
