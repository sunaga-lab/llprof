
※ここの内容は以下のURLにあるものと同一の内容です。
  http://sunagae.net/wiki/doku.php?id=software:llprof:doc

====== llprof version 0.3 ドキュメント ======
  * 対象バージョン: 0.3.1

====== 概要 ======
  * プロファイラです

====== 動作確認環境 ======
  * 以下には作者が確認した環境のみ載せています
  * たぶんこれ以外もそれなりに動くはずです


===== プロファイリングモジュール =====
  * Gentoo Linux 11 (64bit)
  * Debian 6.0 (64bit) + Amazon EC2

===== プロファイル情報サーバー =====
  * Gentoo Linux 11 (64bit)
  * Debian 6.0 + Amazon EC2

===== プロファイル情報ビューア =====
  * Gentoo Linux 11 (64bit)
    * Firefox 6.0

====== ディレクトリ構成 ======
  * pyllprof/              --- Python用プロファイリングモジュール   
    * setup.py             --- セットアップ用スクリプト
  * rrprofext/             --- Ruby用プロファイリングモジュール
    * extconf.rb           --- Makefile生成スクリプト
  * webmon/               --- プロファイル情報サーバー
    * Makefile

====== プロファイリングモジュールのコンパイル方法 ======
それぞれビルド用のスクリプト(build_***.sh)があるので、それらを使用するか、それら参考にして
コンパイルを行ってください。

====== プロファイリングモジュールの使用方法 ======
Ruby用もPython用も対応するモジュールを読み込ませることで
実行させることができます。

===== Python用モジュール =====
本プロファイラモジュール(pyllprof)をimportしてください。

===== Ruby用モジュール =====
本プロファイラモジュール(rrprof)をrequireしてください。

一つの方法としては、環境変数RUBYOPTに-rオプションを指定して実行する方法があります。
以下に実行例を示します。

(本プロファイラ＋rdocの実行例)
<code bash>
$ export RUBYOPT="-r rrprof"
$ rdoc
</code>

====== プロファイル情報サーバー ======
  * webmonディレクトリ以下にあるMakefileを使っmakeしてください
  * boost C++ Librariesが必要です
  * webmonを実行することでプロファイル情報サーバーが使用できます
    * Webブラウザで「http://localhost:8020/」にアクセスしてください
    * プロファイル情報ビューアが立ち上がります

====== 環境変数一覧  ======
^         変数名                ^                                         ^
|LLPROF_PROFILE_TARGET_NAME     |プロファイルターゲット名                 |
|LLPROF_CM_HOST                |クライアントモード時の接続先ホスト名     |
|LLPROF_CM_PORT                |クライアントモード時の接続先ポート       |
|LLPROF_CM_INTERVAL            |クライアントモード時の接続時間間隔(秒)   |

===== pyllprof専用 =====
^         変数名                ^                                         ^
|LLPROF_STARTUP                 |開始時にプログラムのエントリポイントをルートにする |

===== webmon =====
^         変数名                ^                                         ^
|WEBMON_SINGLE                  |統合ツリーモード                         |
|WEBMON_INTERVAL                |情報の取得間隔                               |





