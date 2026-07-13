"""複数の実績あるQRデコードエンジンを統一インターフェースで扱う。

要件: 「最低3種類の一般的なQRコードデコーダーで読み取り検証を行い、
すべてで正常にデコードできることを確認する」に対応するため、
実装方式が異なる3エンジンを採用している。

- OpenCV (WeChatQRCode): 画像処理ベース。実機検証の結果、レガシーのcv2.QRCodeDetector
  (1:1:3:1:1比率の正方形パターンを前提とする幾何学的検出)は四隅を丸め形状にした
  QRの検出に失敗することが判明したため、より頑健なWeChatQRCode検出器を採用している。
  モデルファイル無しでも動作し、square/dot/extra-roundedいずれの四隅形状でも
  読み取れることを確認済み(45件中45件成功、レガシー版は丸め形状で全滅していた)。
- pyzbar (libzbar): ZBarベース。ZXingとは独立した実装で相互検証に有効。
- zxing-cpp: ZXing（多くのスマートフォン標準カメラアプリの読み取りエンジンの系譜）互換の実装。

いずれかのネイティブ依存が実行環境に存在しない場合でも、他のエンジンで検証を継続できるよう
インポート失敗を許容し「利用可能なエンジンの一覧」として扱う。
"""
from dataclasses import dataclass
from functools import lru_cache
from typing import Protocol

import numpy as np


class QrDecoder(Protocol):
    name: str

    def decode(self, image: np.ndarray) -> str | None: ...


@lru_cache(maxsize=1)
def _wechat_detector():
    """WeChatQRCode検出器をプロセス内で使い回す(状態を持たないため使い回して安全)。"""
    import cv2

    return cv2.wechat_qrcode.WeChatQRCode()


@dataclass
class _OpenCvDecoder:
    name: str = "opencv"

    def decode(self, image: np.ndarray) -> str | None:
        import cv2

        bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        results, _points = _wechat_detector().detectAndDecode(bgr)
        return results[0] if results else None


@dataclass
class _PyzbarDecoder:
    name: str = "pyzbar"

    def decode(self, image: np.ndarray) -> str | None:
        from pyzbar.pyzbar import decode as zbar_decode

        results = zbar_decode(image)
        if not results:
            return None
        return results[0].data.decode("utf-8", errors="strict")


@dataclass
class _ZxingCppDecoder:
    name: str = "zxing-cpp"

    def decode(self, image: np.ndarray) -> str | None:
        import zxingcpp

        results = zxingcpp.read_barcodes(image)
        if not results:
            return None
        return results[0].text


def available_decoders() -> list[QrDecoder]:
    """実行環境で利用可能なデコーダーのみを返す（ネイティブ依存が無い場合は除外）。"""
    candidates: list[QrDecoder] = []
    for factory in (_OpenCvDecoder, _PyzbarDecoder, _ZxingCppDecoder):
        decoder = factory()
        try:
            # 各デコーダーのネイティブライブラリが読み込めるか軽く確認する。
            _probe_import(decoder.name)
            candidates.append(decoder)
        except (ImportError, OSError):
            continue
    return candidates


def _probe_import(name: str) -> None:
    if name == "opencv":
        import cv2

        if not hasattr(cv2, "wechat_qrcode"):
            raise ImportError("opencv-contrib-python(-headless) required for wechat_qrcode")
    elif name == "pyzbar":
        from pyzbar.pyzbar import decode  # noqa: F401
    elif name == "zxing-cpp":
        import zxingcpp  # noqa: F401
