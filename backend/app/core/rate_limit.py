"""Cloud Run側でのレート制限。slowapi(IPベース)を使用する。

Cloud Run はスケールアウトするため完全に正確なグローバル制限ではないが、
インスタンス単位のバーストを抑止し、単一クライアントによる濫用・DoS的呼び出しを防ぐ。
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
