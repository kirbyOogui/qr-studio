export type DotType =
  | "square"
  | "dots"
  | "rounded"
  | "classy"
  | "classy-rounded"
  | "extra-rounded";

export type CornerSquareType = "square" | "dot" | "extra-rounded";
export type CornerDotType = "square" | "dot";
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export interface GradientStop {
  offset: number;
  color: string;
}

export interface GradientConfig {
  type: "linear" | "radial";
  rotationDeg: number;
  stops: [GradientStop, GradientStop];
}

export type LogoShape = "square" | "circle";

export interface LogoConfig {
  /** 中央クロップ+形状マスク済みのPNG data URL (メモリ上のみで保持し、サーバーへの永続化は行わない) */
  dataUrl: string;
  /** QR全体の幅に対する比率 (0〜0.4) */
  sizeRatio: number;
  fileName: string;
  /** ロゴの切り抜き形状。四角=正方形中央クロップ、丸=それを円形マスク。 */
  shape: LogoShape;
}

export type FrameTemplateKey =
  | "none"
  | "ribbon"
  | "speech"
  | "badge"
  | "ticket"
  | "tag"
  | "polaroid"
  | "stamp"
  | "pin"
  | "corner";

/**
 * フレームの呼びかけテキスト・ロゴのテキストで使うフォント。
 * システムフォントのみで構成し、外部フォント読み込みは行わない。
 */
export type FontKey = "gothic" | "mincho" | "rounded";

export type SizePresetKey =
  | "auto"
  | "web"
  | "sns"
  | "businessCard"
  | "a4"
  | "poster"
  | "presentation"
  | "printHQ"
  | "custom";

export interface SizePreset {
  key: SizePresetKey;
  label: string;
  description: string;
  widthPx: number;
  heightPx: number;
}

export interface QrDesignConfig {
  url: string;
  foregroundColor: string;
  backgroundColor: string;
  gradient: GradientConfig | null;
  dotType: DotType;
  cornerSquareType: CornerSquareType;
  cornerDotType: CornerDotType;
  borderEnabled: boolean;
  borderColor: string;
  /** 枠線(線そのもの)の太さ。 */
  borderWidthPx: number;
  /**
   * 枠線が描く四角の大きさ(面積)。1=QR全体の縁ぎりぎり(既存の見た目)、
   * 1未満にすると枠線の四角自体が小さくなり、外側に背景色の余白が生まれる。
   * 太さ(borderWidthPx)とは独立したパラメータ。
   */
  borderSizeRatio: number;
  cornerRadiusPx: number;
  sizePreset: SizePresetKey;
  sizePx: number;
  errorCorrection: ErrorCorrectionLevel;
  quietZoneModules: number;
  logo: LogoConfig | null;
  /** 四隅(ファインダーパターン)だけに使う差し色。nullの場合はforegroundColorと同じ。 */
  cornerAccentColor: string | null;
  /** QR本体は一切加工せず、周囲に付与する装飾フレーム。 */
  frameTemplate: FrameTemplateKey;
  frameText: string;
  /** テキストボックス(呼びかけテキストを載せる領域)を表示するかどうか。 */
  frameTextEnabled: boolean;
  /** フレーム装飾(リボン・吹き出し等)の色。QR本体の色(foregroundColor)とは独立。 */
  frameColor: string;
  /** 呼びかけテキストのフォント。 */
  frameFont: FontKey;
}

export type DownloadFormat = "png" | "svg" | "pdf" | "webp";

export type QaStatus = "idle" | "checking" | "ready" | "degraded";

export type DotStyleDto = "square" | "other";

export interface QrDesignParamsDto {
  error_correction: ErrorCorrectionLevel;
  quiet_zone_modules: number;
  logo_ratio: number | null;
  size_px: number;
  corner_square_style: CornerSquareType;
  dot_style: DotStyleDto;
}

export interface QualityCheckRequestDto {
  image_base64: string;
  expected_payload: string;
  design: QrDesignParamsDto;
}

export interface QualityCheckResponseDto {
  passed: boolean;
  corrections: QrDesignParamsDto | null;
  decoders_matched: string[];
  contrast_adjustment_needed: boolean;
}
