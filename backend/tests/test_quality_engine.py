from app.models.schemas import CornerSquareStyle, DotStyle, ErrorCorrectionLevel, QrDesignParams
from app.services import correction_engine, quality_engine
from app.utils.image_utils import decode_base64_image


def test_well_formed_qr_passes_without_corrections(make_qr_png_base64):
    payload = "https://example.com/"
    design = QrDesignParams(
        error_correction=ErrorCorrectionLevel.M,
        quiet_zone_modules=4,
        logo_ratio=None,
        size_px=600,
    )
    image = decode_base64_image(
        make_qr_png_base64(payload, quiet_zone_modules=4, box_size=10), max_dimension_px=4096
    )

    metrics = quality_engine.analyze(image, payload, design)
    corrections = correction_engine.build_corrections(design, metrics)

    assert metrics.all_decoders_matched
    assert corrections is None


def test_insufficient_quiet_zone_triggers_correction(make_qr_png_base64):
    payload = "https://example.com/"
    design = QrDesignParams(
        error_correction=ErrorCorrectionLevel.M,
        quiet_zone_modules=0,
        logo_ratio=None,
        size_px=600,
    )
    image = decode_base64_image(
        make_qr_png_base64(payload, quiet_zone_modules=0, box_size=10), max_dimension_px=4096
    )

    metrics = quality_engine.analyze(image, payload, design)
    corrections = correction_engine.build_corrections(design, metrics)

    assert not metrics.quiet_zone_ok
    assert corrections is not None
    assert corrections.quiet_zone_modules >= 4


def test_oversized_logo_ratio_is_reduced():
    design = QrDesignParams(
        error_correction=ErrorCorrectionLevel.M,
        quiet_zone_modules=4,
        logo_ratio=0.35,
        size_px=600,
    )
    metrics = quality_engine.QualityMetrics(
        decoders_matched=["opencv", "pyzbar", "zxing-cpp"],
        all_decoders_matched=True,
        contrast_ratio=10.0,
        contrast_ok=True,
        quiet_zone_ok=True,
        logo_ratio_ok=False,
        size_ok=True,
        module_count=25,
        recommended_min_size_px=200,
    )

    corrections = correction_engine.build_corrections(design, metrics)

    assert corrections is not None
    assert corrections.logo_ratio < design.logo_ratio


def test_rounded_corner_style_is_reverted_to_square_on_decode_failure():
    """実機検証で判明した回帰防止テスト。

    四隅の外枠を丸め形状(extra-rounded/dot)にするとOpenCVのQRCodeDetectorが
    ファインダーパターンを検出できずデコードに失敗する。Error Correctionの
    エスカレーションでは解決しないため、まず形状をsquareへ補正すべきで、
    同じラウンドでEC levelは変更しないことを確認する。
    """
    design = QrDesignParams(
        error_correction=ErrorCorrectionLevel.M,
        quiet_zone_modules=4,
        logo_ratio=None,
        size_px=600,
        corner_square_style=CornerSquareStyle.EXTRA_ROUNDED,
    )
    metrics = quality_engine.QualityMetrics(
        decoders_matched=["pyzbar", "zxing-cpp"],
        all_decoders_matched=False,
        contrast_ratio=10.0,
        contrast_ok=True,
        quiet_zone_ok=True,
        logo_ratio_ok=True,
        size_ok=True,
        module_count=25,
        recommended_min_size_px=200,
    )

    corrections = correction_engine.build_corrections(design, metrics)

    assert corrections is not None
    assert corrections.corner_square_style == CornerSquareStyle.SQUARE
    assert corrections.error_correction == ErrorCorrectionLevel.M


def test_contrast_failure_increases_output_size():
    """実機検証で判明した回帰防止テスト。

    モジュール数が多い(=1モジュールが小さい)QRを丸みのある形状で描画すると、
    縁のアンチエイリアシングにより実効コントラストが不足することがある。
    この場合、配色を変えなくても出力サイズを大きくすれば
    1モジュールあたりのピクセル数が増えて解決するため、
    contrast_ok=Falseの際はsize_pxを増やす補正を返すべきである。
    """
    design = QrDesignParams(
        error_correction=ErrorCorrectionLevel.M,
        quiet_zone_modules=4,
        logo_ratio=None,
        size_px=640,
    )
    metrics = quality_engine.QualityMetrics(
        decoders_matched=["opencv", "pyzbar", "zxing-cpp"],
        all_decoders_matched=True,
        contrast_ratio=2.9,
        contrast_ok=False,
        quiet_zone_ok=True,
        logo_ratio_ok=True,
        size_ok=True,
        module_count=57,
        recommended_min_size_px=260,
    )

    corrections = correction_engine.build_corrections(design, metrics)

    assert corrections is not None
    assert corrections.size_px > design.size_px


def test_contrast_failure_at_max_size_falls_back_to_square_dots():
    """実機検証で判明した回帰防止テスト。

    出力サイズが上限(4096px)に達してもなおコントラスト不足が解消しない場合、
    最終手段としてモジュール形状をsquareへフォールバックすべきである。
    """
    design = QrDesignParams(
        error_correction=ErrorCorrectionLevel.M,
        quiet_zone_modules=4,
        logo_ratio=None,
        size_px=4096,
        dot_style=DotStyle.OTHER,
    )
    metrics = quality_engine.QualityMetrics(
        decoders_matched=["opencv", "pyzbar", "zxing-cpp"],
        all_decoders_matched=True,
        contrast_ratio=2.9,
        contrast_ok=False,
        quiet_zone_ok=True,
        logo_ratio_ok=True,
        size_ok=True,
        module_count=57,
        recommended_min_size_px=260,
    )

    corrections = correction_engine.build_corrections(design, metrics)

    assert corrections is not None
    assert corrections.dot_style == DotStyle.SQUARE
    assert corrections.size_px == design.size_px
