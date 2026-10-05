#!/usr/bin/env bash
# check-marketplace-sync.sh — 驗證 marketplace 的同步契約。
#
# 結構：每個 plugin 是一組「會一起安裝」的 skill（例如 venvia-ui、venvia-js），
# 安裝後 skill 以 `<plugin>:<skill>` 出現。契約：
#
#   對每個 plugin：
#   1. marketplace.json 的 plugins[].name  ==  plugins/<name>/.claude-plugin/plugin.json 的 name
#   2. marketplace.json 的 plugins[].source ==  "./plugins/<name>"（且該目錄存在）
#   3. marketplace.json 的 plugins[].description == plugin.json 的 description
#   4. plugins/<name>/skills/ 底下至少有一個 SKILL.md
#   對每個 skill（plugins/<plugin>/skills/<skill>/SKILL.md）：
#   5. frontmatter 的 name == 目錄名 <skill>
#   6. metadata.summary 存在，且是單行字串（不可用 >- / | 等摺疊格式）
#   7. 根 README.md 有一列「| <plugin> | <skill> | <summary> |」，summary 逐字相同
#
# 任一不符，marketplace 就會壞掉或顯示不一致的說明。人工核對多處字串是否逐字
# 相同，正是最容易漏的那種事，所以自動化。
set -uo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$REPO"
MF=".claude-plugin/marketplace.json"
fails=0

fail() { echo "FAIL - $1"; fails=$((fails + 1)); }
ok()   { echo "ok   - $1"; }

command -v jq >/dev/null || { echo "需要 jq"; exit 1; }
[ -f "$MF" ] || { echo "找不到 $MF"; exit 1; }

# 0. $MF 必須是合法 JSON，且必須有 plugins 欄位、型別為陣列——
#    三者任一不成立就直接中止，不能讓後面的迴圈在壞掉的資料上「安靜地」跑完。
if ! JQ_ERR="$(jq empty "$MF" 2>&1 1>/dev/null)"; then
  echo "FAIL - $MF 無法解析：不是合法的 JSON"
  echo "$JQ_ERR" | sed 's/^/    /'
  exit 1
fi
if [ "$(jq -r 'has("plugins")' "$MF")" != "true" ]; then
  echo "FAIL - $MF 缺少 plugins 欄位（不是「plugins: []」，是整個欄位不存在）"
  exit 1
fi
PLUGINS_TYPE="$(jq -r '.plugins | type' "$MF")"
if [ "$PLUGINS_TYPE" != "array" ]; then
  echo "FAIL - $MF 的 plugins 欄位型別是 ${PLUGINS_TYPE}，應為陣列"
  exit 1
fi

# 讀 SKILL.md frontmatter 中某個欄位的單行值（去掉前後引號）
fm() {
  awk '/^---$/{n++; next} n==1' "$1" \
    | sed -n "s/^[[:space:]]*$2:[[:space:]]*//p" \
    | head -n1 | sed 's/[[:space:]]*$//'
}

COUNT="$(jq -r '.plugins | length' "$MF")"
echo "== marketplace: $(jq -r .name "$MF")（$COUNT 個 plugin）=="

for i in $(seq 0 $((COUNT - 1))); do
  [ "$COUNT" -eq 0 ] && break
  NAME="$(jq -r ".plugins[$i].name" "$MF")"
  SRC="$(jq -r ".plugins[$i].source" "$MF")"
  MDESC="$(jq -r ".plugins[$i].description" "$MF")"
  PJ="plugins/${NAME}/.claude-plugin/plugin.json"

  # 2. source 形式與目錄存在
  if [ "$SRC" != "./plugins/${NAME}" ]; then
    fail "$NAME: source 應為 ./plugins/${NAME}，實為 ${SRC}"
  elif [ ! -d "plugins/${NAME}" ]; then
    fail "$NAME: source 指向的目錄不存在"
  else
    ok "$NAME: source"
  fi

  # 1 + 3. plugin.json 的 name / description
  if [ ! -f "$PJ" ]; then
    fail "$NAME: 缺 $PJ"
  else
    PNAME="$(jq -r .name "$PJ")"
    PDESC="$(jq -r .description "$PJ")"
    [ "$PNAME" = "$NAME" ] && ok "$NAME: plugin.json name" \
      || fail "$NAME: plugin.json name 為 ${PNAME}"
    [ "$PDESC" = "$MDESC" ] && ok "$NAME: plugin.json description" \
      || fail "$NAME: plugin.json description 與 marketplace 不一致"
  fi

  # 4–7. 每個 skill
  SKILLS=0
  while IFS= read -r sk; do
    SKILLS=$((SKILLS + 1))
    DIR="$(basename "$(dirname "$sk")")"
    ID="${NAME}:${DIR}"

    # 5. name 與目錄名一致
    SNAME="$(fm "$sk" name | sed 's/^"//; s/"$//')"
    [ "$SNAME" = "$DIR" ] && ok "$ID: name" \
      || fail "$ID: SKILL.md name 為 '${SNAME}'，應等於目錄名 ${DIR}"

    # 6. summary 存在且為單行。YAML 的摺疊/區塊純量指示字元（>、|，可再接
    #    +/- chomping 或縮排數字，如 ">-"、"|2"）代表真正的值在後續縮排行——
    #    本檢查器只比對單行字串，遇到就直接判失敗並指名，別讓作者去猜。
    RAW="$(fm "$sk" summary)"
    if [ -z "$RAW" ]; then
      fail "$ID: 缺 metadata.summary"
      continue
    fi
    if printf '%s' "$RAW" | grep -qE '^[|>][+0-9-]*$'; then
      fail "$ID: metadata.summary 用了多行/摺疊格式（例如 '>-'），請改成單行"
      continue
    fi
    SUM="$(printf '%s' "$RAW" | sed 's/^"//; s/"$//')"
    ok "$ID: summary"

    # 7. README 有對應的列
    if grep -qF "| ${NAME} | ${DIR} | ${SUM} |" README.md 2>/dev/null; then
      ok "$ID: README 列"
    else
      fail "$ID: 根 README.md 缺少「| ${NAME} | ${DIR} | <summary> |」這一列，或 summary 不一致"
    fi
  done < <(find "plugins/${NAME}/skills" -mindepth 2 -maxdepth 2 -name SKILL.md 2>/dev/null | sort)

  [ "$SKILLS" -gt 0 ] && ok "$NAME: ${SKILLS} 個 skill" \
    || fail "$NAME: plugins/${NAME}/skills/ 底下沒有任何 SKILL.md"
done

# 反向：plugins/ 底下不能有沒登記在 marketplace 的 plugin 目錄
for d in plugins/*/; do
  P="$(basename "$d")"
  jq -e --arg p "$P" '.plugins | any(.name == $p)' "$MF" >/dev/null \
    || fail "plugins/${P} 存在但沒有登記在 $MF"
done

if [ "$fails" -gt 0 ]; then
  echo "==> $fails 項不符"
  exit 1
fi
echo "==> 同步契約一致"
